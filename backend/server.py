"""FastAPI REST layer — expone el agente LangGraph al frontend React."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent.graph import run_agent
from agent.semantic_layer import get_connection
from utils.charts import chart_as_dict


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


@app.post("/chat")
async def chat(req: ChatRequest) -> dict[str, Any]:
    """Recibe un mensaje del usuario y devuelve respuesta + gráfico Plotly (JSON)."""
    con = _get_con()
    state = await run_agent(req.message.strip(), con)

    response = state.get("response") or "No pude preparar una respuesta con esos datos."
    chart = chart_as_dict(
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

    chart = chart_as_dict(
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
