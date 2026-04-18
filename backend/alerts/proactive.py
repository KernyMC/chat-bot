"""Alertas proactivas async para Chainlit."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import date
from typing import Any


THRESHOLD_CAIDA = 0.20
DEFAULT_INTERVALO_SEGUNDOS = 300

DIAS_SEMANA = {
    0: "domingo",
    1: "lunes",
    2: "martes",
    3: "miércoles",
    4: "jueves",
    5: "viernes",
    6: "sábado",
}


@dataclass(frozen=True)
class AlertaVentas:
    ventas_hoy: float
    mediana_historica: float
    variacion: float
    dia_semana: int
    fecha_referencia: date

    @property
    def variacion_pct_abs(self) -> float:
        return abs(self.variacion) * 100


def obtener_dia_espanol(dia_semana: int) -> str:
    """Convierte DuckDB DAYOFWEEK (0=domingo) a nombre en español."""
    return DIAS_SEMANA.get(dia_semana, "día")


def calcular_alerta_ventas(
    con: Any,
    comercio_id: str | None = None,
    fecha_referencia: str | date | None = None,
    threshold: float = THRESHOLD_CAIDA,
) -> AlertaVentas | None:
    """Compara ventas de la fecha de referencia vs mediana histórica del mismo día."""
    resultado = con.execute(
        """
        WITH daily AS (
            SELECT
                dia,
                DAYOFWEEK(dia) AS dia_semana,
                ROUND(SUM(total), 2) AS total
            FROM ventas_diarias
            WHERE (? IS NULL OR comercio_id = ?)
            GROUP BY dia, dia_semana
        ),
        referencia AS (
            SELECT COALESCE(CAST(? AS DATE), MAX(dia)) AS dia
            FROM daily
        ),
        hoy AS (
            SELECT d.dia, d.dia_semana, d.total
            FROM daily d
            JOIN referencia r ON d.dia = r.dia
        ),
        historico AS (
            SELECT MEDIAN(d.total) AS mediana
            FROM daily d
            JOIN hoy h ON d.dia_semana = h.dia_semana
            WHERE d.dia < h.dia
        )
        SELECT
            hoy.total AS ventas_hoy,
            historico.mediana AS mediana_historica,
            CASE
                WHEN historico.mediana IS NULL OR historico.mediana = 0 THEN NULL
                ELSE (hoy.total - historico.mediana) / historico.mediana
            END AS variacion,
            hoy.dia_semana,
            hoy.dia AS fecha_referencia
        FROM hoy, historico;
        """,
        [comercio_id, comercio_id, fecha_referencia],
    ).fetchone()

    if not resultado or resultado[2] is None:
        return None

    ventas_hoy, mediana_historica, variacion, dia_semana, fecha = resultado
    if variacion >= -threshold:
        return None

    return AlertaVentas(
        ventas_hoy=float(ventas_hoy),
        mediana_historica=float(mediana_historica),
        variacion=float(variacion),
        dia_semana=int(dia_semana),
        fecha_referencia=fecha,
    )


def construir_mensaje_alerta(alerta: AlertaVentas) -> str:
    """Mensaje corto y accionable para el comerciante."""
    dia = obtener_dia_espanol(alerta.dia_semana)
    return (
        f"Oye, estuve revisando los números y noté que este {dia} "
        f"llevas **${alerta.ventas_hoy:.2f}** — "
        f"un **{alerta.variacion_pct_abs:.0f}% menos** de lo que normalmente vendes "
        f"un {dia} (tu referencia es **${alerta.mediana_historica:.2f}**). "
        "¿Revisamos qué categorías están más quietas hoy para mover una promo rápida?"
    )


async def _send_chainlit_message(content: str) -> None:
    import chainlit as cl

    await cl.Message(content=content).send()


async def monitor_ventas(
    session_id: str,
    con: Any,
    intervalo_segundos: int = DEFAULT_INTERVALO_SEGUNDOS,
    comercio_id: str | None = None,
    fecha_referencia: str | date | None = None,
) -> None:
    """Monitorea caídas de venta y empuja alertas al hilo activo de Chainlit."""
    alerta_enviada = False
    while True:
        await asyncio.sleep(intervalo_segundos)

        if alerta_enviada:
            continue

        alerta = calcular_alerta_ventas(
            con=con,
            comercio_id=comercio_id,
            fecha_referencia=fecha_referencia,
        )
        if alerta is None:
            continue

        await _send_chainlit_message(content=f"💡 {construir_mensaje_alerta(alerta)}")
        alerta_enviada = True


def iniciar_monitor_ventas(
    session_id: str,
    con: Any,
    intervalo_segundos: int = DEFAULT_INTERVALO_SEGUNDOS,
    comercio_id: str | None = None,
    fecha_referencia: str | date | None = None,
) -> asyncio.Task[None]:
    """Crea la tarea background; app.py debe guardarla en cl.user_session."""
    return asyncio.create_task(
        monitor_ventas(
            session_id=session_id,
            con=con,
            intervalo_segundos=intervalo_segundos,
            comercio_id=comercio_id,
            fecha_referencia=fecha_referencia,
        )
    )
