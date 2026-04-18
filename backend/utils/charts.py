"""Helpers Plotly para visualizaciones inline en Chainlit."""

from __future__ import annotations

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
    if view_name in {"frecuencia_clientes", "clientes_perdidos"}:
        return clientes_chart(rows, title="Clientes y frecuencia")

    return None


def ventas_diarias_chart(result: list[dict[str, Any]]) -> Any | None:
    rows = _rows(result)
    if not rows or "dia" not in rows[0] or "total" not in rows[0]:
        return None

    go = _go()
    fig = go.Figure()

    # Un solo punto (ej: mejor día del año) → barra, no línea
    if len(rows) == 1:
        fig.add_trace(
            go.Bar(
                x=_column(rows, "dia"),
                y=_column(rows, "total"),
                name="Ventas",
                marker={"color": COLOR_PRIMARY},
            )
        )
    else:
        fig.add_trace(
            go.Scatter(
                x=_column(rows, "dia"),
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

    go = _go()
    fig = go.Figure()
    fig.add_trace(
        go.Bar(
            x=_column(rows, x_key),
            y=_column(rows, "total"),
            name="Ventas",
            marker={"color": COLOR_SECONDARY},
        )
    )
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
    if not rows or not {"dia_semana", "hora", "num_transacciones"}.issubset(rows[0]):
        return None

    matrix: dict[int, dict[int, float]] = defaultdict(dict)
    horas = sorted({int(row["hora"]) for row in rows if row.get("hora") is not None})
    dias = list(range(7))
    for row in rows:
        if row.get("dia_semana") is None or row.get("hora") is None:
            continue
        matrix[int(row["dia_semana"])][int(row["hora"])] = row.get("num_transacciones", 0)

    z = [[matrix[dia].get(hora, 0) for hora in horas] for dia in dias]

    go = _go()
    fig = go.Figure(
        data=go.Heatmap(
            x=[f"{hora}:00" for hora in horas],
            y=[DIAS_SEMANA[dia] for dia in dias],
            z=z,
            colorscale=[
                [0, "#ECFDF5"],
                [0.5, "#5EEAD4"],
                [1, COLOR_PRIMARY],
            ],
            colorbar={"title": "Trans."},
        )
    )
    return _apply_layout(fig, "Patrones de venta por día y hora", "Día")


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


def chart_as_dict(
    view_name: str | None,
    result: list[dict[str, Any]] | None,
    question: str = "",
    params: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    """Igual que chart_for_result pero devuelve el JSON serializable de Plotly, o None."""
    import json

    fig = chart_for_result(view_name, result, question=question, params=params)
    if fig is None:
        return None
    return json.loads(fig.to_json())
