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

# ── Perfiles de comercio para la demo ─────────────────────────────────────────

COMERCIO_PERFILES = {
    "Tienda Don Aurelio": {
        "comercio_id": "COM-001",
        "emoji": "🛒",
        "descripcion": "Tienda de barrio · Abarrotes, Bebidas, Lácteos",
    },
    "Fonda Don Jorge": {
        "comercio_id": "COM-002",
        "emoji": "🍽️",
        "descripcion": "Restaurante de barrio · Almuerzos y desayunos",
    },
    "Salón Belleza Total": {
        "comercio_id": "COM-003",
        "emoji": "💇",
        "descripcion": "Salón de belleza · Cortes, tintes, manicure",
    },
}


@cl.set_chat_profiles
async def chat_profile() -> list[cl.ChatProfile]:
    return [
        cl.ChatProfile(
            name=nombre,
            markdown_description=f"{p['emoji']} **{nombre}**\n\n{p['descripcion']}",
        )
        for nombre, p in COMERCIO_PERFILES.items()
    ]


def _get_comercio_id() -> str:
    """Devuelve el comercio_id activo según el perfil seleccionado."""
    perfil = cl.user_session.get("chat_profile") or "Tienda Don Aurelio"
    return COMERCIO_PERFILES.get(perfil, {}).get("comercio_id", DEMO_COMERCIO_ID)


# ── Mensajes de bienvenida rotatorios ─────────────────────────────────────────

def _bienvenida_ventas_hoy(con: Any, comercio_id: str) -> str:
    try:
        row = con.execute(
            "SELECT COALESCE(ROUND(SUM(total), 2), 0), COALESCE(SUM(num_transacciones), 0) "
            "FROM ventas_diarias WHERE comercio_id = ? AND dia = DATE '2026-04-18'",
            [comercio_id],
        ).fetchone()
        total, ntx = row if row else (0, 0)
        if total and total > 0:
            return (
                f"¡Oe, veci! Esta mañana llevas **${total:.2f}** en ventas "
                f"({int(ntx)} cobros). Los sábados son buenos — "
                f"pregúntame **¿cuánto vendí esta semana?** para ver cómo va el ritmo."
            )
    except Exception:
        pass
    return _bienvenida_fallback()


def _bienvenida_top_cliente(con: Any, comercio_id: str) -> str:
    try:
        row = con.execute(
            "SELECT nombre_cliente, visitas, ROUND(total_gastado, 2), dias_sin_volver "
            "FROM frecuencia_clientes WHERE comercio_id = ? "
            "ORDER BY total_gastado DESC LIMIT 1",
            [comercio_id],
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
                f"¡Mi pana! Tu cliente más fiel es **{nombre}** — ha caído **{visitas} veces** "
                f"y lleva **${gastado:.2f}** gastados en tu negocio ({ultimo}). "
                f"Pregúntame **¿quiénes son mis clientes más frecuentes?** para ver el ranking completo."
            )
    except Exception:
        pass
    return _bienvenida_fallback()


def _bienvenida_clientes_perdidos(con: Any, comercio_id: str) -> str:
    try:
        row = con.execute(
            "SELECT COUNT(*), nombre_cliente, ROUND(total_gastado, 2) "
            "FROM clientes_perdidos WHERE comercio_id = ? "
            "ORDER BY total_gastado DESC LIMIT 1",
            [comercio_id],
        ).fetchone()
        if row and row[0]:
            count, nombre, gastado = row
            return (
                f"Veci, estuve revisando y tienes **{count} clientes** que no han caído en más de un mes. "
                f"El que más gastaba era **{nombre}** (dejaba **${gastado:.2f}** cada vez que venía). "
                f"Pregúntame **¿qué clientes no han vuelto en el último mes?** para ver la lista completa."
            )
    except Exception:
        pass
    return _bienvenida_fallback()


def _bienvenida_semana(con: Any, comercio_id: str) -> str:
    try:
        rows = con.execute(
            "SELECT semana, ROUND(total, 2) FROM ventas_periodo "
            "WHERE comercio_id = ? AND semana >= DATE_TRUNC('week', DATE '2026-04-18') - INTERVAL '7 days' "
            "ORDER BY semana DESC LIMIT 2",
            [comercio_id],
        ).fetchall()
        if rows and len(rows) >= 2:
            esta_sem = rows[0][1]
            pasada = rows[1][1]
            if pasada and pasada > 0:
                return (
                    f"¡Bien ahí, veci! Esta semana llevas **${esta_sem:.2f}** hasta ahorita "
                    f"(la semana pasada cerraste en **${pasada:.2f}** en total). "
                    f"Pregúntame **¿cuánto vendí cada día esta semana?** para ver el desglose por día."
                )
        elif rows:
            esta_sem = rows[0][1]
            return (
                f"¡Oe! Esta semana llevas **${esta_sem:.2f}** en ventas. "
                f"Pregúntame **¿cuánto vendí cada día esta semana?** para ver qué días moviste más."
            )
    except Exception:
        pass
    return _bienvenida_fallback()


def _bienvenida_top_categoria(con: Any, comercio_id: str) -> str:
    try:
        row = con.execute(
            "SELECT categoria, ROUND(ingreso_total, 2) FROM categorias_populares "
            "WHERE comercio_id = ? ORDER BY ingreso_total DESC LIMIT 1",
            [comercio_id],
        ).fetchone()
        if row:
            cat, total = row
            return (
                f"¡Oe! Lo que más te mueve la plata es **{cat}** — "
                f"**${total:.2f}** en el historial. "
                f"Pregúntame **¿qué categoría vende más?** para ver el ranking completo."
            )
    except Exception:
        pass
    return _bienvenida_fallback()


def _bienvenida_fallback() -> str:
    return (
        "¡Oe, veci! Soy tu Contador de Bolsillo. Pregúntame por ventas, clientes, "
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
    comercio_id = _get_comercio_id()
    con = get_connection()
    cl.user_session.set("con", con)
    cl.user_session.set("conversation_history", [])
    cl.user_session.set("comercio_id", comercio_id)

    session_id = _get_session_id()
    monitor_task = iniciar_monitor_ventas(
        session_id=session_id,
        con=con,
        intervalo_segundos=DEMO_ALERT_INTERVAL_SECONDS,
        fecha_referencia=DEMO_ALERT_REFERENCE_DATE,
        comercio_id=comercio_id,
    )
    cl.user_session.set("monitor_task", monitor_task)

    probe = random.choice(BIENVENIDAS)
    welcome = probe(con, comercio_id)
    await cl.Message(content=welcome).send()


@cl.on_message
async def main(message: cl.Message) -> None:
    con = cl.user_session.get("con")
    if con is None:
        con = get_connection()
        cl.user_session.set("con", con)

    comercio_id = cl.user_session.get("comercio_id", DEMO_COMERCIO_ID)
    question = message.content.strip()
    if not question:
        await cl.Message(content="Cuéntame qué dato quieres revisar.").send()
        return

    history = cl.user_session.get("conversation_history", [])
    state = await run_agent(
        question,
        con,
        conversation_history=history,
        comercio_id=comercio_id,
    )
    response = state.get("response") or "No pude preparar una respuesta con esos datos."
    history = [
        *history,
        {"role": "user", "content": question},
        {"role": "assistant", "content": response},
    ][-6:]
    cl.user_session.set("conversation_history", history)

    if state.get("scope") == "ambiguous":
        await cl.Message(content=response).send()
        return

    # Respuesta financiera: link directo al producto bancario
    if state.get("scope") == "en_scope_financiero" and state.get("producto_url"):
        texto = f"{response}\n\n[📋 Ver condiciones en Banco Pichincha →]({state['producto_url']})"
        await cl.Message(content=texto).send()
        return

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
