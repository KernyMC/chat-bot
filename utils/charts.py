"""Helpers Plotly para visualizaciones inline en Chainlit."""

from __future__ import annotations

import datetime
from collections import defaultdict
from typing import Any


DIAS_SEMANA = {
    0: "Dom",
    1: "Lun",
    2: "Mar",
    3: "Mié",
    4: "Jue",
    5: "Vie",
    6: "Sáb",
}

COLOR_PRIMARY = "#0F766E"
COLOR_SECONDARY = "#2563EB"
COLOR_WARNING = "#D97706"
COLOR_GRID = "#E5E7EB"

MESES_ES = {
    1: "Ene", 2: "Feb", 3: "Mar", 4: "Abr",
    5: "May", 6: "Jun", 7: "Jul", 8: "Ago",
    9: "Sep", 10: "Oct", 11: "Nov", 12: "Dic",
}


def _parse_date(v: Any) -> datetime.date | None:
    """Convierte datetime.date, datetime.datetime o string ISO a date."""
    if isinstance(v, datetime.datetime):
        return v.date()
    if isinstance(v, datetime.date):
        return v
    try:
        return datetime.date.fromisoformat(str(v)[:10])
    except Exception:
        return None


def _fmt_dia(v: Any) -> str:
    """'14-Abr' para ejes de ventas por día o semana."""
    d = _parse_date(v)
    if d:
        return f"{d.day}-{MESES_ES[d.month]}"
    return str(v)


def _fmt_mes(v: Any) -> str:
    """'Abr-26' para ejes de ventas por mes."""
    d = _parse_date(v)
    if d:
        return f"{MESES_ES[d.month]}-{str(d.year)[2:]}"
    return str(v)


def _go() -> Any:
    import plotly.graph_objects as go

    return go


def _apply_layout(fig: Any, title: str, y_title: str | None = None) -> Any:
    fig.update_layout(
        title=title,
        template="plotly_white",
        margin={"l": 48, "r": 24, "t": 56, "b": 48},
        height=360,
        font={"family": "Inter, Arial, sans-serif", "size": 13},
        title_font={"size": 18},
        xaxis={"showgrid": False},
        yaxis={"gridcolor": COLOR_GRID, "title": y_title},
        hovermode="x unified",
    )
    return fig


def _rows(result: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    return result or []


def _column(result: list[dict[str, Any]], key: str) -> list[Any]:
    return [row.get(key) for row in result]


def chart_for_result(
    view_name: str | None,
    result: list[dict[str, Any]] | None,
    question: str = "",
    params: dict[str, Any] | None = None,
) -> Any | None:
    """Devuelve una figura Plotly adecuada para la vista, o None si no aplica."""
    rows = _rows(result)
    if not view_name or not rows:
        return None

    if view_name == "ventas_diarias":
        return ventas_diarias_chart(rows)
    if view_name == "ventas_periodo":
        return ventas_periodo_chart(rows, question=question, params=params)
    if view_name == "categorias_populares":
        return categorias_populares_chart(rows)
    if view_name == "patrones_temporales":
        return patrones_temporales_chart(rows)
    if view_name == "gastos_proveedores":
        return gastos_proveedores_chart(rows)
    if view_name == "patrones_compra_proveedor":
        return patrones_compra_proveedor_chart(rows)
    if view_name == "patrones_temporales_mensual":
        return patrones_temporales_chart(rows)
    if view_name == "gastos_proveedores_mensual":
        return gastos_proveedores_chart(rows)

    return None


def ventas_diarias_chart(result: list[dict[str, Any]]) -> Any | None:
    rows = _rows(result)
    if not rows or "dia" not in rows[0] or "total" not in rows[0]:
        return None

    go = _go()
    fig = go.Figure()

    x_vals = [_fmt_dia(v) for v in _column(rows, "dia")]
    # Un solo punto (ej: mejor día del año) → barra, no línea
    if len(rows) == 1:
        fig.add_trace(
            go.Bar(
                x=x_vals,
                y=_column(rows, "total"),
                name="Ventas",
                marker={"color": COLOR_PRIMARY},
            )
        )
        fig.update_xaxes(type="category")
    else:
        fig.add_trace(
            go.Scatter(
                x=x_vals,
                y=_column(rows, "total"),
                mode="lines+markers",
                name="Ventas",
                line={"color": COLOR_PRIMARY, "width": 3},
                marker={"size": 7},
            )
        )
    return _apply_layout(fig, "Ventas por día", "USD")


def ventas_periodo_chart(
    result: list[dict[str, Any]],
    question: str = "",
    params: dict[str, Any] | None = None,
) -> Any | None:
    rows = _rows(result)
    if not rows or "total" not in rows[0]:
        return None

    # Prioridad: params del Nodo 2 (fuente de verdad) → texto pregunta → default mes
    periodo = str((params or {}).get("periodo") or "").lower()
    question_lower = question.lower()
    hint = periodo or question_lower
    x_key = "semana" if "semana" in hint else "mes"
    if x_key not in rows[0]:
        x_key = "mes" if "mes" in rows[0] else "semana"

    fmt = _fmt_mes if x_key == "mes" else _fmt_dia
    x_vals = [fmt(v) for v in _column(rows, x_key)]
    go = _go()
    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=x_vals,
            y=_column(rows, "total"),
            name="Ventas",
            marker={"color": COLOR_SECONDARY},
        )
    )
    fig.update_xaxes(type="category")
    label = "mes" if x_key == "mes" else "semana"
    return _apply_layout(fig, f"Ventas por {label}", "USD")


def categorias_populares_chart(result: list[dict[str, Any]]) -> Any | None:
    rows = _rows(result)
    if not rows or "categoria" not in rows[0]:
        return None

    value_key = "ingreso_total" if "ingreso_total" in rows[0] else "num_transacciones"
    title = "Ingresos por categoría" if value_key == "ingreso_total" else "Transacciones por categoría"

    go = _go()
    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=_column(rows, "categoria"),
            y=_column(rows, value_key),
            name=title,
            marker={"color": COLOR_PRIMARY},
        )
    )
    return _apply_layout(fig, title, "USD" if value_key == "ingreso_total" else "Transacciones")


def patrones_temporales_chart(result: list[dict[str, Any]]) -> Any | None:
    rows = _rows(result)
    if not rows or "hora" not in rows[0]:
        return None

    go = _go()

    # Columna de conteo: acepta num_transacciones O total_transacciones (alias frecuente del SQL)
    count_key = "num_transacciones" if "num_transacciones" in rows[0] else "total_transacciones"
    if count_key not in rows[0]:
        return None

    # Si tenemos dia_semana → heatmap completo (más rico)
    if "dia_semana" in rows[0]:
        matrix: dict[int, dict[int, float]] = defaultdict(dict)
        horas = sorted({int(row["hora"]) for row in rows if row.get("hora") is not None})
        dias = list(range(7))
        for row in rows:
            if row.get("dia_semana") is None or row.get("hora") is None:
                continue
            matrix[int(row["dia_semana"])][int(row["hora"])] = row.get(count_key, 0)

        z = [[matrix[dia].get(hora, 0) for hora in horas] for dia in dias]
        fig = go.Figure(
            data=go.Heatmap(
                x=[f"{hora}:00" for hora in horas],
                y=[DIAS_SEMANA[dia] for dia in dias],
                z=z,
                colorscale=[[0, "#ECFDF5"], [0.5, "#5EEAD4"], [1, COLOR_PRIMARY]],
                colorbar={"title": "Trans."},
            )
        )
        return _apply_layout(fig, "Patrones de venta por día y hora", "Día")

    # Sin dia_semana → barra por hora (resultado de "¿cuál es mi hora pico?")
    rows_sorted = sorted(rows, key=lambda r: int(r.get("hora", 0)))
    x_vals = [f"{int(r['hora'])}:00" for r in rows_sorted]
    y_vals = [r.get(count_key, 0) for r in rows_sorted]

    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=x_vals,
            y=y_vals,
            name="Transacciones",
            marker={"color": COLOR_PRIMARY},
        )
    )
    fig.update_xaxes(type="category")
    return _apply_layout(fig, "Ventas por hora del día", "Transacciones")


def gastos_proveedores_chart(result: list[dict[str, Any]]) -> Any | None:
    rows = _rows(result)
    if not rows or "proveedor" not in rows[0] or "total_pagado" not in rows[0]:
        return None

    go = _go()
    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=_column(rows, "total_pagado"),
            y=_column(rows, "proveedor"),
            orientation="h",
            name="Total pagado",
            marker={"color": COLOR_WARNING},
        )
    )
    fig.update_yaxes(autorange="reversed")
    return _apply_layout(fig, "Pagos a proveedores", "USD")


def patrones_compra_proveedor_chart(result: list[dict[str, Any]]) -> Any | None:
    rows = _rows(result)
    if not rows or "dia_del_mes" not in rows[0] or "num_pedidos" not in rows[0]:
        return None

    go = _go()
    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=_column(rows, "dia_del_mes"),
            y=_column(rows, "num_pedidos"),
            name="Pedidos",
            marker={"color": COLOR_SECONDARY},
        )
    )
    return _apply_layout(fig, "Compras a proveedor por día del mes", "Pedidos")


def clientes_chart(result: list[dict[str, Any]], title: str) -> Any | None:
    rows = _rows(result)[:10]
    if not rows or "nombre_cliente" not in rows[0]:
        return None

    value_key = "visitas" if "visitas" in rows[0] else "total_gastado"

    go = _go()
    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=_column(rows, value_key),
            y=_column(rows, "nombre_cliente"),
            orientation="h",
            name=title,
            marker={"color": COLOR_PRIMARY},
        )
    )
    fig.update_yaxes(autorange="reversed")
    return _apply_layout(fig, title, "Visitas" if value_key == "visitas" else "USD")


def should_suggest_chart(view_name: str | None, result: list[dict[str, Any]] | None) -> bool:
    """Indica si vale la pena adjuntar Plotly al mensaje de Chainlit."""
    return chart_for_result(view_name, result) is not None
