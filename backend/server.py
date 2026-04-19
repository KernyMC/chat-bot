"""FastAPI REST layer — expone el agente LangGraph al frontend React."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent.config import DEMO_COMERCIO_ID
from agent.graph import run_agent
from agent.semantic_layer import get_connection
from alerts.proactive import (
    calcular_alerta_ventas,
    calcular_calificacion_credito,
    calcular_potencial_tarjeta,
    construir_mensaje_alerta,
    construir_mensaje_credito,
    construir_mensaje_tarjeta,
)
from utils.charts import chart_for_result


app = FastAPI(title="Mi Contador de Bolsillo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:4173",   # Vite preview
    ],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# Una única conexión DuckDB compartida (solo lectura, seguro en concurrencia de demo)
_con: Any = None


def _get_con() -> Any:
    global _con
    if _con is None:
        _con = get_connection()
    return _con


# ── Schemas ───────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str


class ReportRequest(BaseModel):
    type: str  # "weekly" | "monthly" | "annual"


# ── Preguntas predefinidas para /report ───────────────────────────────────────

_REPORT_QUESTIONS: dict[str, str] = {
    "weekly": "¿Cuáles fueron mis ventas de las últimas 4 semanas?",
    "monthly": "¿Cuáles fueron mis ventas por mes este año?",
    "annual": "¿Cuál fue mi resumen anual de ventas del 2025?",
}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/suggestions")
async def suggestions() -> dict[str, Any]:
    """Devuelve las sugerencias proactivas basadas en los datos del comercio."""
    con = _get_con()
    result = []

    alerta = calcular_alerta_ventas(con=con, comercio_id=DEMO_COMERCIO_ID)
    if alerta:
        result.append({
            "title": "Alerta de ventas",
            "message": construir_mensaje_alerta(alerta),
            "icon": "alert",
            "url": None,
        })

    calificacion = calcular_calificacion_credito(con=con, comercio_id=DEMO_COMERCIO_ID)
    if calificacion:
        mensaje, url = construir_mensaje_credito(calificacion, DEMO_COMERCIO_ID)
        result.append({
            "title": "Calificación crediticia",
            "message": mensaje,
            "icon": "growth",
            "url": url,
        })

    potencial = calcular_potencial_tarjeta(con=con, comercio_id=DEMO_COMERCIO_ID)
    if potencial:
        mensaje, url = construir_mensaje_tarjeta(potencial, DEMO_COMERCIO_ID)
        result.append({
            "title": "Cobra con tarjeta",
            "message": mensaje,
            "icon": "tip",
            "url": url,
        })

    return {"suggestions": result}


@app.post("/chat")
async def chat(req: ChatRequest) -> dict[str, Any]:
    """Recibe un mensaje del usuario y devuelve respuesta + gráfico Plotly (JSON)."""
    con = _get_con()
    state = await run_agent(req.message.strip(), con)

    response = state.get("response") or "No pude preparar una respuesta con esos datos."
    chart = chart_for_result(
        state.get("view_name"),
        state.get("sql_result"),
        question=req.message,
        params=state.get("params"),
    )

    return {
        "response": response,
        "chart": chart,
        "sql_result": state.get("sql_result") or [],
    }


@app.post("/report")
async def report(req: ReportRequest) -> dict[str, Any]:
    """Genera los datos estructurados para un reporte PDF (semanal / mensual / anual)."""
    con = _get_con()
    question = _REPORT_QUESTIONS.get(req.type, _REPORT_QUESTIONS["monthly"])
    state = await run_agent(question, con)

    chart = chart_for_result(
        state.get("view_name"),
        state.get("sql_result"),
        question=question,
        params=state.get("params"),
    )

    return {
        "response": state.get("response") or "",
        "chart": chart,
        "sql_result": state.get("sql_result") or [],
        "report_type": req.type,
    }
