"""FastAPI REST layer — conecta el frontend React con el agente LangGraph."""

from __future__ import annotations

import json
from dotenv import load_dotenv
load_dotenv()
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent.config import DEMO_COMERCIO_ID
from agent.graph import run_agent
from agent.semantic_layer import get_connection
from alerts.proactive import (
    calcular_alerta_ventas,
    calcular_potencial_tarjeta,
    construir_mensaje_alerta,
    construir_mensaje_tarjeta,
)
from utils.charts import chart_for_result

DEMO_FECHA_REFERENCIA = "2026-04-18"

# ── Estado compartido (demo single-user) ──────────────────────────────────────

_con: Any = None
_conversation_history: list[dict[str, str]] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _con
    _con = get_connection()
    yield
    if _con and hasattr(_con, "close"):
        _con.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _plotly_to_json(fig: Any) -> dict | None:
    if fig is None:
        return None
    try:
        return json.loads(fig.to_json())
    except Exception:
        return None


# ── Schemas ───────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    comercio_id: str = DEMO_COMERCIO_ID


class ReportRequest(BaseModel):
    type: str  # weekly | monthly | annual
    comercio_id: str = DEMO_COMERCIO_ID


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/reset")
async def reset_history():
    global _conversation_history
    _conversation_history = []
    return {"ok": True}


@app.post("/chat")
async def chat(req: ChatRequest):
    global _conversation_history

    state = await run_agent(
        req.message,
        _con,
        conversation_history=_conversation_history,
        comercio_id=req.comercio_id,
    )

    response = state.get("response") or "No pude preparar una respuesta con esos datos."
    _conversation_history = [
        *_conversation_history,
        {"role": "user", "content": req.message},
        {"role": "assistant", "content": response},
    ][-6:]

    fig = chart_for_result(
        state.get("view_name"),
        state.get("sql_result"),
        question=req.message,
        params=state.get("params"),
    )

    return {
        "response": response,
        "chart": _plotly_to_json(fig),
        "sql_result": state.get("sql_result"),
        "scope": state.get("scope"),
        "producto_url": state.get("producto_url"),
    }


@app.post("/report")
async def report(req: ReportRequest):
    preguntas = {
        "weekly": "¿Cuánto vendí cada día esta semana?",
        "monthly": "¿Cuánto vendí cada semana este mes?",
        "annual": "¿Cuánto vendí cada mes este año?",
    }
    question = preguntas.get(req.type, preguntas["monthly"])

    state = await run_agent(
        question,
        _con,
        conversation_history=[],
        comercio_id=req.comercio_id,
    )

    response = state.get("response") or ""
    fig = chart_for_result(
        state.get("view_name"),
        state.get("sql_result"),
        question=question,
        params=state.get("params"),
    )

    return {
        "response": response,
        "chart": _plotly_to_json(fig),
        "sql_result": state.get("sql_result") or [],
        "report_type": req.type,
    }


@app.get("/welcome")
async def welcome(comercio_id: str = DEMO_COMERCIO_ID):
    import random
    queries = [
        (
            "SELECT COALESCE(ROUND(SUM(total),2),0), COALESCE(SUM(num_transacciones),0) "
            "FROM ventas_diarias WHERE comercio_id=? AND dia=DATE '2026-04-18'",
            "ventas_hoy",
        ),
        (
            "SELECT nombre_cliente, visitas, ROUND(total_gastado,2), dias_sin_volver "
            "FROM frecuencia_clientes WHERE comercio_id=? ORDER BY total_gastado DESC LIMIT 1",
            "top_cliente",
        ),
        (
            "SELECT COUNT(*), nombre_cliente, ROUND(total_gastado,2) "
            "FROM clientes_perdidos WHERE comercio_id=? ORDER BY total_gastado DESC LIMIT 1",
            "clientes_perdidos",
        ),
        (
            "SELECT categoria, ROUND(ingreso_total,2) FROM categorias_populares "
            "WHERE comercio_id=? ORDER BY ingreso_total DESC LIMIT 1",
            "top_categoria",
        ),
    ]
    tipo = random.choice([q[1] for q in queries])
    query = next(q[0] for q in queries if q[1] == tipo)
    try:
        row = _con.execute(query, [comercio_id]).fetchone()
        if tipo == "ventas_hoy" and row and row[0]:
            msg = (f"¡Oe, veci! Esta mañana llevas **${row[0]:.2f}** en ventas "
                   f"({int(row[1])} cobros). ¿Cómo va el ritmo hoy?")
        elif tipo == "top_cliente" and row:
            dias = int(row[3])
            ultimo = "¡estuvo hoy!" if dias == 0 else ("estuvo ayer" if dias == 1 else f"hace {dias} días que no pasa")
            msg = (f"¡Mi pana! Tu cliente más fiel es **{row[0]}** — {int(row[1])} visitas "
                   f"y **${row[2]:.2f}** gastados ({ultimo}).")
        elif tipo == "clientes_perdidos" and row and row[0]:
            msg = (f"Veci, tienes **{row[0]} clientes** que no han caído en más de un mes. "
                   f"El que más gastaba era **{row[1]}** (dejaba **${row[2]:.2f}** cada vez).")
        elif tipo == "top_categoria" and row:
            msg = (f"¡Oe! Lo que más te mueve la plata es **{row[0]}** — "
                   f"**${row[1]:.2f}** en el historial.")
        else:
            msg = "¡Oe, veci! Soy Mi Pana. Pregúntame por ventas, clientes o pagos a proveedores."
    except Exception:
        msg = "¡Oe, veci! Soy Mi Pana. Pregúntame por ventas, clientes o pagos a proveedores."
    return {"message": msg}


@app.get("/suggestions")
async def suggestions(comercio_id: str = DEMO_COMERCIO_ID):
    result = []

    alerta = calcular_alerta_ventas(
        con=_con,
        comercio_id=comercio_id,
        fecha_referencia=DEMO_FECHA_REFERENCIA,
    )
    if alerta:
        result.append({
            "title": "Alerta de ventas",
            "message": construir_mensaje_alerta(alerta),
            "icon": "alert",
            "url": None,
        })

    potencial = calcular_potencial_tarjeta(con=_con, comercio_id=comercio_id)
    if potencial:
        mensaje, url = construir_mensaje_tarjeta(potencial, comercio_id)
        result.append({
            "title": "DeUna Negocios",
            "message": mensaje,
            "icon": "growth",
            "url": url,
        })

    return {"suggestions": result}


# ── Salud Financiera ──────────────────────────────────────────────────────────

_DIAS_ES = {0: "domingo", 1: "lunes", 2: "martes", 3: "miércoles", 4: "jueves", 5: "viernes", 6: "sábado"}


def _health_tendencia(comercio_id: str) -> dict:
    row = _con.execute(
        """
        SELECT
            SUM(CASE WHEN mes BETWEEN DATE '2026-01-01' AND DATE '2026-03-31' THEN total ELSE 0 END) AS reciente,
            SUM(CASE WHEN mes BETWEEN DATE '2025-10-01' AND DATE '2025-12-31' THEN total ELSE 0 END) AS anterior
        FROM ventas_periodo WHERE (? IS NULL OR comercio_id = ?)
        """,
        [comercio_id, comercio_id],
    ).fetchone()
    reciente, anterior = float(row[0] or 0), float(row[1] or 0)
    if anterior == 0:
        return {}
    pct = (reciente - anterior) / anterior * 100
    status = "green" if pct >= 5 else ("red" if pct <= -5 else "yellow")
    consejos = {
        "green": "Mantén el ritmo y considera ampliar stock en tu categoría estrella.",
        "yellow": "Ventas estables. Revisa qué categoría puedes potenciar esta semana.",
        "red": f"Bajaste {abs(pct):.0f}% — habla con Mi Pana para ver dónde está la caída.",
    }
    return {
        "id": "tendencia", "emoji": "📈",
        "titulo": "Tendencia de ventas",
        "valor": f"{'+' if pct >= 0 else ''}{pct:.0f}%",
        "detalle": "últimos 3 meses vs los 3 anteriores",
        "consejo": consejos[status], "status": status,
    }


def _health_proveedor(comercio_id: str) -> dict:
    row = _con.execute(
        """
        SELECT proveedor, total_pagado,
               ROUND(total_pagado * 100.0 / SUM(total_pagado) OVER(), 1) AS pct
        FROM gastos_proveedores WHERE (? IS NULL OR comercio_id = ?)
        ORDER BY total_pagado DESC LIMIT 1
        """,
        [comercio_id, comercio_id],
    ).fetchone()
    if not row:
        return {}
    proveedor, _, pct = row[0], float(row[1]), float(row[2])
    nombre_corto = proveedor.split("(")[0].strip()
    status = "green" if pct < 35 else ("red" if pct > 55 else "yellow")
    consejos = {
        "green": "Buen balance — no dependes demasiado de ningún proveedor.",
        "yellow": f"{nombre_corto} es el {pct:.0f}% de tus gastos. Negocia plazo de pago más largo.",
        "red": f"{nombre_corto} es el {pct:.0f}% de tus gastos — si falla el suministro, te afecta fuerte.",
    }
    return {
        "id": "proveedor", "emoji": "🏭",
        "titulo": "Dependencia de proveedor",
        "valor": f"{pct:.0f}%",
        "detalle": f"de tus egresos van a {nombre_corto}",
        "consejo": consejos[status], "status": status,
    }


def _health_flujo(comercio_id: str) -> dict:
    row = _con.execute(
        """
        SELECT SUM(CASE WHEN tipo='Ingreso' THEN monto ELSE 0 END) AS ing,
               SUM(CASE WHEN tipo='Egreso'  THEN monto ELSE 0 END) AS egr
        FROM transacciones WHERE (? IS NULL OR comercio_id = ?)
        """,
        [comercio_id, comercio_id],
    ).fetchone()
    ing, egr = float(row[0] or 0), float(row[1] or 1)
    ratio = ing / egr if egr > 0 else 0
    status = "green" if ratio >= 3 else ("red" if ratio < 2 else "yellow")
    consejos = {
        "green": f"Por cada $1 que gastas entran ${ratio:.1f}. Sólido — tienes margen para crecer.",
        "yellow": f"Por cada $1 que gastas entran ${ratio:.1f}. Vigila de cerca los egresos.",
        "red": f"Por cada $1 que gastas entran ${ratio:.1f}. Revisa tus gastos fijos con Mi Pana.",
    }
    return {
        "id": "flujo", "emoji": "⚖️",
        "titulo": "Flujo de caja",
        "valor": f"${ratio:.1f}",
        "detalle": "entran por cada $1 que sale",
        "consejo": consejos[status], "status": status,
    }


def _health_categoria(comercio_id: str) -> dict:
    row = _con.execute(
        """
        SELECT categoria, ingreso_total,
               ROUND(ingreso_total * 100.0 / SUM(ingreso_total) OVER(), 1) AS pct
        FROM categorias_populares WHERE (? IS NULL OR comercio_id = ?)
        ORDER BY ingreso_total DESC LIMIT 1
        """,
        [comercio_id, comercio_id],
    ).fetchone()
    if not row:
        return {}
    categoria, _, pct = row[0], float(row[1]), float(row[2])
    status = "green" if pct < 40 else ("red" if pct > 60 else "yellow")
    consejos = {
        "green": f"Buen spread — {categoria} lidera con {pct:.0f}% pero el resto complementa bien.",
        "yellow": f"{categoria} genera el {pct:.0f}% de tus ventas — fortalece las otras categorías.",
        "red": f"El {pct:.0f}% de tus ventas depende solo de {categoria} — si baja, te afecta fuerte.",
    }
    return {
        "id": "categoria", "emoji": "🎯",
        "titulo": "Concentración de ventas",
        "valor": f"{pct:.0f}%",
        "detalle": f"de tus ingresos vienen de {categoria}",
        "consejo": consejos[status], "status": status,
    }


def _health_oportunidad(comercio_id: str) -> dict:
    rows = _con.execute(
        """
        SELECT dia_semana, SUM(total) AS ventas_dia
        FROM patrones_temporales WHERE (? IS NULL OR comercio_id = ?)
        GROUP BY dia_semana ORDER BY ventas_dia DESC
        """,
        [comercio_id, comercio_id],
    ).fetchall()
    if len(rows) < 2:
        return {}
    mejor_dia, mejor_v = _DIAS_ES.get(rows[0][0], ""), float(rows[0][1])
    peor_dia, peor_v = _DIAS_ES.get(rows[-1][0], ""), float(rows[-1][1])
    ratio = mejor_v / peor_v if peor_v > 0 else 0
    return {
        "id": "oportunidad", "emoji": "💡",
        "titulo": "Tu mayor oportunidad",
        "valor": f"{ratio:.1f}x",
        "detalle": f"más ventas el {mejor_dia} que el {peor_dia}",
        "consejo": f"Una promo de {peor_dia} podría equilibrar tu semana y sumar clientes nuevos.",
        "status": "tip",
    }


@app.get("/health")
async def health(comercio_id: str = DEMO_COMERCIO_ID):
    metrics = []
    for fn in [_health_tendencia, _health_proveedor, _health_flujo, _health_categoria, _health_oportunidad]:
        try:
            m = fn(comercio_id)
            if m:
                metrics.append(m)
        except Exception:
            pass
    return {"comercio_id": comercio_id, "metrics": metrics}

