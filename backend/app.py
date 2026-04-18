"""Chainlit entry point para Mi Contador de Bolsillo."""

from __future__ import annotations

import asyncio
import random
from typing import Any

import chainlit as cl

from agent.config import DEMO_COMERCIO_ID
from agent.graph import run_agent
from agent.semantic_layer import get_connection
from alerts.proactive import iniciar_monitor_ventas
from utils.charts import chart_for_result


DEMO_ALERT_INTERVAL_SECONDS = 10
DEMO_ALERT_REFERENCE_DATE = "2026-04-18"   # día parcial → alerta garantizada


# ── Mensajes de bienvenida rotatorios ─────────────────────────────────────────
# Cada función consulta DuckDB directamente y devuelve un string accionable.
# Al abrir el chat se elige uno al azar, simulando que el agente "ya revisó" los números.

def _bienvenida_ventas_hoy(con: Any) -> str:
    try:
        row = con.execute(
            "SELECT COALESCE(ROUND(SUM(total), 2), 0), COALESCE(SUM(num_transacciones), 0) "
            "FROM ventas_diarias WHERE comercio_id = ? AND dia = DATE '2026-04-18'",
            [DEMO_COMERCIO_ID],
        ).fetchone()
        total, ntx = row if row else (0, 0)
        if total and total > 0:
            return (
                f"¡Buenos días! Hoy sábado llevas **${total:.2f}** en ventas "
                f"({int(ntx)} cobros esta mañana). Los sábados sueles cerrar bien — "
                f"¿quieres ver cómo va el día o revisar qué se está moviendo más?"
            )
    except Exception:
        pass
    return _bienvenida_fallback()


def _bienvenida_top_cliente(con: Any) -> str:
    try:
        row = con.execute(
            "SELECT nombre_cliente, visitas, ROUND(total_gastado, 2), dias_sin_volver "
            "FROM frecuencia_clientes WHERE comercio_id = ? "
            "ORDER BY total_gastado DESC LIMIT 1",
            [DEMO_COMERCIO_ID],
        ).fetchone()
        if row:
            nombre, visitas, gastado, dias = row
            if dias == 0:
                ultimo = "¡estuvo hoy!"
            elif dias == 1:
                ultimo = "estuvo ayer"
            else:
                ultimo = f"hace {dias} días que no pasa"
            return (
                f"Tu cliente más fiel es **{nombre}** — ha venido **{visitas} veces** "
                f"y lleva **${gastado:.2f}** gastados en tu tienda ({ultimo}). "
                f"¿Quieres ver quiénes son tus otros clientes frecuentes?"
            )
    except Exception:
        pass
    return _bienvenida_fallback()


def _bienvenida_clientes_perdidos(con: Any) -> str:
    try:
        row = con.execute(
            "SELECT COUNT(*), nombre_cliente, ROUND(total_gastado, 2) "
            "FROM clientes_perdidos WHERE comercio_id = ? "
            "ORDER BY total_gastado DESC LIMIT 1",
            [DEMO_COMERCIO_ID],
        ).fetchone()
        if row and row[0]:
            count, nombre, gastado = row
            return (
                f"Oye, tienes **{count} clientes** que no han vuelto en más de un mes. "
                f"El que más gastó fue **{nombre}** con **${gastado:.2f}**. "
                f"¿Revisamos quiénes son para ver si podemos recuperarlos?"
            )
    except Exception:
        pass
    return _bienvenida_fallback()


def _bienvenida_semana(con: Any) -> str:
    try:
        rows = con.execute(
            "SELECT semana, ROUND(total, 2) FROM ventas_periodo "
            "WHERE comercio_id = ? AND semana >= DATE_TRUNC('week', DATE '2026-04-18') - INTERVAL '7 days' "
            "ORDER BY semana DESC LIMIT 2",
            [DEMO_COMERCIO_ID],
        ).fetchall()
        if rows and len(rows) >= 2:
            esta_sem = rows[0][1]
            pasada = rows[1][1]
            if pasada and pasada > 0:
                cambio = ((esta_sem - pasada) / pasada) * 100
                emoji = "📈" if cambio >= 0 else "📉"
                signo = "+" if cambio >= 0 else ""
                return (
                    f"{emoji} Esta semana llevas **${esta_sem:.2f}** — "
                    f"**{signo}{cambio:.0f}%** vs la semana pasada (${pasada:.2f}). "
                    f"¿Quieres ver el detalle de días o comparar con semanas anteriores?"
                )
        elif rows:
            esta_sem = rows[0][1]
            return (
                f"Esta semana llevas **${esta_sem:.2f}** en ventas. "
                f"¿Quieres comparar con semanas anteriores o ver qué días vendiste más?"
            )
    except Exception:
        pass
    return _bienvenida_fallback()


def _bienvenida_top_categoria(con: Any) -> str:
    try:
        row = con.execute(
            "SELECT categoria, ROUND(ingreso_total, 2) FROM categorias_populares "
            "WHERE comercio_id = ? ORDER BY ingreso_total DESC LIMIT 1",
            [DEMO_COMERCIO_ID],
        ).fetchone()
        if row:
            cat, total = row
            return (
                f"Tu categoría estrella es **{cat}** — la que más ingresos te genera "
                f"con **${total:.2f}** en el historial. "
                f"¿Quieres ver el ranking completo de categorías?"
            )
    except Exception:
        pass
    return _bienvenida_fallback()


def _bienvenida_fallback() -> str:
    return (
        "¡Hola! Soy tu Contador de Bolsillo. Pregúntame por ventas, clientes, "
        "horarios fuertes o pagos a proveedores — todo en segundos."
    )


BIENVENIDAS = [
    _bienvenida_ventas_hoy,
    _bienvenida_top_cliente,
    _bienvenida_clientes_perdidos,
    _bienvenida_semana,
    _bienvenida_top_categoria,
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_session_id() -> str:
    session = getattr(cl.context, "session", None)
    session_id = getattr(session, "id", None)
    return str(session_id or "chainlit-session")


async def _close_session_resources() -> None:
    task: asyncio.Task[Any] | None = cl.user_session.get("monitor_task")
    if task and not task.done():
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

    con = cl.user_session.get("con")
    if con is not None and hasattr(con, "close"):
        con.close()


# ── Chainlit handlers ─────────────────────────────────────────────────────────

@cl.on_chat_start
async def on_chat_start() -> None:
    con = get_connection()
    cl.user_session.set("con", con)

    session_id = _get_session_id()
    monitor_task = iniciar_monitor_ventas(
        session_id=session_id,
        con=con,
        intervalo_segundos=DEMO_ALERT_INTERVAL_SECONDS,
        fecha_referencia=DEMO_ALERT_REFERENCE_DATE,
    )
    cl.user_session.set("monitor_task", monitor_task)

    # Mensaje de bienvenida rotatorio con dato real del DuckDB
    probe = random.choice(BIENVENIDAS)
    welcome = probe(con)
    await cl.Message(content=welcome).send()


@cl.on_message
async def main(message: cl.Message) -> None:
    con = cl.user_session.get("con")
    if con is None:
        con = get_connection()
        cl.user_session.set("con", con)

    question = message.content.strip()
    if not question:
        await cl.Message(content="Cuéntame qué dato quieres revisar.").send()
        return

    state = await run_agent(question, con)
    response = state.get("response") or "No pude preparar una respuesta con esos datos."

    elements = []
    fig = chart_for_result(
        state.get("view_name"),
        state.get("sql_result"),
        question=question,
        params=state.get("params"),
    )
    if fig is not None:
        elements.append(cl.Plotly(name="grafico", figure=fig, display="inline"))

    await cl.Message(content=response, elements=elements).send()


@cl.on_chat_end
async def on_chat_end() -> None:
    await _close_session_resources()
