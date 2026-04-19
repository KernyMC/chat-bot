"""Nodos LangGraph para Mi Contador de Bolsillo."""

from __future__ import annotations

import inspect
import json
import re
from typing import Any, Literal, TypedDict

from agent.prompts import (
    CLASSIFIER_SEMANTIC_PROMPT_TEMPLATE,
    DATASET_CONTEXT,
    DEUNA_PRODUCTOS,
    FINANCIAL_ADVISOR_PROMPT_TEMPLATE,
    FINANCIAL_KEYWORDS,
    SQL_GENERATOR_PROMPT_TEMPLATE,
    SYNTHESIZER_PROMPT_TEMPLATE,
    SYSTEM_PROMPT,
    VALIDATOR_PROMPT_TEMPLATE,
    VIEW_SCHEMAS,
    VIEW_SELECTION_GUIDE,
    allowed_views_csv,
    build_history_str,
    build_view_context,
    get_view_schema,
)

from agent.config import DEMO_COMERCIO_ID  # fuente única — cambia solo en agent/config.py


MAX_RETRIES = 3
OLLAMA_BASE_URL = "http://localhost:11434/v1"
OLLAMA_MODEL = "qwen2.5:32b"
SECONDARY_SQL_CATEGORIAS = """
SELECT categoria, num_transacciones, ingreso_total, ticket_promedio
FROM categorias_populares
WHERE comercio_id = ?
ORDER BY ingreso_total DESC
LIMIT 3
"""
SECONDARY_SQL_CATEGORIAS_SIN_FILTRO = """
SELECT categoria, num_transacciones, ingreso_total, ticket_promedio
FROM categorias_populares
ORDER BY ingreso_total DESC
LIMIT 3
"""

Scope = Literal["en_scope", "en_scope_financiero", "fuera_scope", "ambiguous"]


class AgentState(TypedDict, total=False):
    question: str
    comercio_id: str | None
    default_comercio_id: str | None
    scope: Scope
    requires_financial_advice: bool
    producto_url: str | None
    view_name: str | None
    params: dict[str, Any]
    requires_product_disclaimer: bool
    sql: str
    sql_valid: bool
    sql_result: list[dict[str, Any]]
    sql_result_secondary: list[dict[str, Any]]
    response: str
    error: str | None
    retry_count: int
    con: Any
    conversation_history: list[dict[str, str]]


def create_llm(temperature: float = 0, max_tokens: int = 512) -> Any:
    """Crea el cliente OpenAI-compatible de Ollama bajo demanda."""
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        base_url=OLLAMA_BASE_URL,
        api_key="ollama",
        model=OLLAMA_MODEL,
        temperature=temperature,
        max_tokens=max_tokens,
    )


async def _call_llm(prompt: str, temperature: float = 0, max_tokens: int = 512) -> str:
    llm = create_llm(temperature=temperature, max_tokens=max_tokens)
    if hasattr(llm, "ainvoke"):
        message = await llm.ainvoke(prompt)
    else:
        maybe_message = llm.invoke(prompt)
        if inspect.isawaitable(maybe_message):
            message = await maybe_message
        else:
            message = maybe_message
    return str(getattr(message, "content", message)).strip()


def _extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def _clean_sql(text: str) -> str:
    sql = text.strip()
    if sql.startswith("```"):
        sql = re.sub(r"^```(?:sql)?\s*", "", sql, flags=re.IGNORECASE)
        sql = re.sub(r"\s*```$", "", sql)
    return sql.strip()


def _normalize_nullable(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, str) and value.strip().lower() in {"", "null", "none", "ninguno"}:
        return None
    return value


def _safe_params(params: Any) -> dict[str, Any]:
    if not isinstance(params, dict):
        return {}
    return {str(key): _normalize_nullable(value) for key, value in params.items()}


def _is_product_question(question: str) -> bool:
    normalized = question.lower()
    return any(term in normalized for term in ("producto", "productos", "item", "items"))


async def classify_and_map_node(state: AgentState) -> AgentState:
    """Nodos 1+2 fusionados: clasifica Y mapea vista en una sola llamada LLM.
    Reduce latencia eliminando un round-trip al modelo (~1-2s menos).
    """
    question = state["question"]
    prompt = CLASSIFIER_SEMANTIC_PROMPT_TEMPLATE.format(
        dataset_context=DATASET_CONTEXT,
        view_selection_guide=VIEW_SELECTION_GUIDE,
        view_context=build_view_context(),
        conversation_history=build_history_str(state.get("conversation_history", [])),
        question=question,
    )
    raw = await _call_llm(prompt, temperature=0, max_tokens=400)

    try:
        parsed = _extract_json(raw)
    except (json.JSONDecodeError, TypeError):
        return {
            **state,
            "scope": "fuera_scope",
            "error": "No pude interpretar la pregunta.",
        }

    scope = parsed.get("scope", "fuera_scope")
    if scope not in {"en_scope", "en_scope_financiero", "fuera_scope", "ambiguous"}:
        scope = "fuera_scope"

    # Override determinístico: si el LLM no detectó la pregunta financiera pero las palabras clave sí
    if scope == "fuera_scope":
        q_lower = question.lower()
        if any(kw in q_lower for kw in FINANCIAL_KEYWORDS):
            scope = "en_scope_financiero"

    if scope == "en_scope_financiero":
        comercio_id = _normalize_nullable(parsed.get("params", {}).get("comercio_id"))
        if comercio_id is None:
            comercio_id = state.get("default_comercio_id") or DEMO_COMERCIO_ID
        return {
            **state,
            "scope": "en_scope_financiero",
            "view_name": "ventas_periodo",
            "params": {"comercio_id": comercio_id},
            "comercio_id": comercio_id,
            "requires_financial_advice": True,
            "requires_product_disclaimer": False,
            "error": None,
        }

    if scope == "ambiguous":
        return {
            **state,
            "scope": "ambiguous",
            "view_name": None,
            "params": {},
            "comercio_id": None,
            "requires_product_disclaimer": False,
            "sql": "",
            "sql_valid": False,
            "sql_result": [],
            "error": None,
        }

    if scope == "fuera_scope":
        return {
            **state,
            "scope": "fuera_scope",
            "error": str(parsed.get("reason") or "Pregunta fuera del dataset."),
        }

    view_name = _normalize_nullable(parsed.get("view_name"))
    params = _safe_params(parsed.get("params"))
    comercio_id = _normalize_nullable(params.get("comercio_id"))

    # Usar el comercio del perfil activo (chat profile) como fallback
    if comercio_id is None:
        comercio_id = state.get("default_comercio_id") or DEMO_COMERCIO_ID

    _temporal_hint = " ".join([
        str(params.get("periodo") or ""),
        question,
    ]).lower()
    _temporal_re = re.compile(
        r"\b(20\d{2}|enero|febrero|marzo|abril|mayo|junio|julio|agosto|"
        r"septiembre|octubre|noviembre|diciembre)\b",
        re.IGNORECASE,
    )

    # Override determinístico: frecuencia_clientes no tiene columna de fecha filtrable.
    # Si el modelo la eligió pero hay año/mes en la pregunta, redirigir a _mensual.
    if view_name == "frecuencia_clientes" and _temporal_re.search(_temporal_hint):
        view_name = "frecuencia_clientes_mensual"

    # Override determinístico: gastos_proveedores no tiene columna mes.
    # Si el modelo la eligió pero hay año/mes en la pregunta, redirigir a _mensual.
    if view_name == "gastos_proveedores" and _temporal_re.search(_temporal_hint):
        view_name = "gastos_proveedores_mensual"

    if view_name not in VIEW_SCHEMAS:
        return {
            **state,
            "scope": "fuera_scope",
            "error": "No tengo ese dato en tu información.",
        }

    return {
        **state,
        "scope": "en_scope",
        "view_name": str(view_name),
        "params": {**params, "comercio_id": comercio_id},
        "comercio_id": comercio_id,
        "requires_product_disclaimer": bool(
            parsed.get("requires_product_disclaimer") or _is_product_question(question)
        ),
        "error": None,
    }


# Aliases para compatibilidad con código que aún referencie los nodos separados
classifier_node = classify_and_map_node
semantic_node = classify_and_map_node


async def sql_generator_node(state: AgentState) -> AgentState:
    """Nodo 3: genera SQL DuckDB contra una unica vista semantica."""
    if state.get("scope") in {"fuera_scope", "ambiguous"}:
        return state

    view_name = state.get("view_name")
    if not view_name:
        return {**state, "sql": "", "error": state.get("error") or "No hay vista semántica."}

    prompt = SQL_GENERATOR_PROMPT_TEMPLATE.format(
        view_name=view_name,
        view_schema=get_view_schema(view_name),
        params=json.dumps(state.get("params", {}), ensure_ascii=False),
        question=state["question"],
    )

    if state.get("error") and state.get("retry_count", 0) > 0:
        prompt += f"\n\nCorrige el SQL anterior. Error recibido: {state['error']}"
        if state.get("sql"):
            prompt += f"\nSQL anterior:\n{state['sql']}"

    raw = await _call_llm(prompt, temperature=0, max_tokens=512)
    return {**state, "sql": _clean_sql(raw), "sql_valid": False, "error": None}


async def validator_node(state: AgentState) -> AgentState:
    """Nodo 4: chequeo estatico antes de ejecutar SQL."""
    sql = state.get("sql", "")
    view_name = state.get("view_name")
    valid, reason = validate_sql(sql, view_name)

    # Validación estática pura (sin LLM): más rápida y determinista para el constraint de 5s.
    # VALIDATOR_PROMPT_TEMPLATE está disponible si en el futuro se quiere añadir chequeo LLM.

    return {
        **state,
        "sql_valid": valid,
        "error": None if valid else reason,
    }


async def executor_node(state: AgentState) -> AgentState:
    """Nodo 5: ejecuta SQL validado con la conexion DuckDB del estado."""
    if not state.get("sql_valid"):
        return {
            **state,
            "retry_count": state.get("retry_count", 0) + 1,
            "sql_result": [],
        }

    con = state.get("con")
    if con is None:
        return {
            **state,
            "sql_result": [],
            "error": "No hay conexión DuckDB en el estado.",
            "retry_count": state.get("retry_count", 0) + 1,
        }

    try:
        cursor = con.execute(state["sql"])
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        result = [dict(zip(columns, row, strict=False)) for row in rows]
        secondary_result = _secondary_categoria_result(state, result)
        return {
            **state,
            "sql_result": result,
            "sql_result_secondary": secondary_result,
            "error": None,
        }
    except Exception as exc:
        return {
            **state,
            "sql_result": [],
            "error": str(exc),
            "retry_count": state.get("retry_count", 0) + 1,
        }


def _secondary_categoria_result(
    state: AgentState,
    primary_result: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    if not primary_result or not state.get("requires_product_disclaimer"):
        return []

    con = state.get("con")
    if con is None:
        return []

    try:
        comercio_id = state.get("comercio_id")
        if comercio_id is None:
            cursor = con.execute(SECONDARY_SQL_CATEGORIAS_SIN_FILTRO)
        else:
            cursor = con.execute(SECONDARY_SQL_CATEGORIAS, [comercio_id])
        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()
        return [dict(zip(columns, row, strict=False)) for row in rows]
    except Exception:
        return []


async def synthesizer_node(state: AgentState) -> AgentState:
    """Nodo 6: sintetiza la respuesta final en español neutro."""
    if state.get("scope") == "ambiguous":
        return {
            **state,
            "response": "¿Me puedes aclarar si hablamos de un cliente que te compra, o de un proveedor que te surte?",
        }

    if state.get("scope") == "fuera_scope":
        return {
            **state,
            "response": "No tengo ese dato en tu información.",
        }

    if state.get("error") and not state.get("sql_result"):
        return {
            **state,
            "response": "No pude consultar ese dato con seguridad. Probemos con una pregunta más específica.",
        }

    prompt = SYNTHESIZER_PROMPT_TEMPLATE.format(
        system_prompt=SYSTEM_PROMPT,
        question=state["question"],
        scope=state.get("scope", "en_scope"),
        sql=state.get("sql", ""),
        result=json.dumps(state.get("sql_result", []), ensure_ascii=False, default=str),
        resultado_secundario=json.dumps(
            state.get("sql_result_secondary", []),
            ensure_ascii=False,
            default=str,
        ),
        requires_product_disclaimer=state.get("requires_product_disclaimer", False),
    )
    response = await _call_llm(prompt, temperature=0.3, max_tokens=300)
    return {**state, "response": response.strip()}


async def financial_advisor_node(state: AgentState) -> AgentState:
    """Nodo financiero: combina datos reales de ventas con producto DeUna × Banco Pichincha."""
    if not state.get("requires_financial_advice"):
        return state

    comercio_id = state.get("comercio_id") or DEMO_COMERCIO_ID
    producto = DEUNA_PRODUCTOS.get(comercio_id, DEUNA_PRODUCTOS["COM-001"])

    # Formatear los datos reales de ventas como contexto legible
    sql_result = state.get("sql_result", [])
    if sql_result:
        ventas_lines = []
        for row in sql_result[-6:]:   # últimos 6 meses
            mes = row.get("mes") or row.get("semana") or ""
            total = row.get("total", 0)
            ntx = row.get("num_transacciones", 0)
            ventas_lines.append(f"  {str(mes)[:7]}: ${total:.2f} ({int(ntx)} cobros)")
        ventas_data = "\n".join(ventas_lines) if ventas_lines else "Sin datos de ventas disponibles."
    else:
        ventas_data = "Sin datos de ventas disponibles."

    prompt = FINANCIAL_ADVISOR_PROMPT_TEMPLATE.format(
        ventas_data=ventas_data,
        producto_nombre=producto["nombre"],
        producto_monto_explicado=producto["monto_explicado"],
        producto_plazo=producto["plazo"],
        producto_tasa=producto["tasa"],
        producto_por_que=producto["por_que_te_conviene"],
        producto_uso=producto["uso_sugerido"],
        producto_accion=producto["accion"],
        producto_requisito=producto["requisito_clave"],
        question=state["question"],
    )

    response = await _call_llm(prompt, temperature=0.3, max_tokens=350)
    return {
        **state,
        "response": response.strip(),
        "producto_url": producto.get("url", ""),
    }


def validate_sql(sql: str, view_name: str | None) -> tuple[bool, str | None]:
    """Valida que el SQL sea de solo lectura y use solo vistas semanticas."""
    normalized = sql.strip()
    lowered = normalized.lower()
    allowed_views = set(VIEW_SCHEMAS)

    if not normalized:
        return False, "SQL vacío."
    if not view_name or view_name not in allowed_views:
        return False, "Vista semántica no permitida."
    if not re.match(r"^\s*(select|with)\b", lowered):
        return False, "La consulta debe ser SELECT o WITH."

    disallowed = r"\b(insert|update|delete|drop|alter|create|copy|attach|detach|pragma)\b"
    if re.search(disallowed, lowered):
        return False, "La consulta contiene una operación no permitida."
    if re.search(r"\b(transacciones|read_csv_auto)\b", lowered):
        return False, "La consulta no puede leer la tabla cruda ni archivos."

    referenced_views = {view for view in allowed_views if re.search(rf"\b{view}\b", lowered)}
    if view_name not in referenced_views:
        return False, f"La consulta debe usar la vista {view_name}."
    if referenced_views - {view_name}:
        return False, "La consulta debe usar solo la vista objetivo."

    return True, None


def should_retry(state: AgentState) -> bool:
    """Indica si el grafo debe volver al generador SQL."""
    return bool(state.get("error")) and state.get("retry_count", 0) < MAX_RETRIES
