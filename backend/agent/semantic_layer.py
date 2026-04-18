"""Capa semantica DuckDB para Mi Contador de Bolsillo."""

from __future__ import annotations

from pathlib import Path
from typing import Final

import duckdb


PROJECT_ROOT: Final[Path] = Path(__file__).resolve().parents[1]
DEFAULT_CSV_PATH: Final[Path] = PROJECT_ROOT / "data" / "transacciones.csv"
DATASET_END_DATE: Final[str] = "2026-04-18"   # fecha de corte del dataset (= hoy en la demo)

SEMANTIC_VIEWS: Final[tuple[str, ...]] = (
    "ventas_diarias",
    "ventas_periodo",
    "frecuencia_clientes",
    "frecuencia_clientes_mensual",
    "categorias_populares",
    "clientes_perdidos",
    "patrones_temporales",
    "patrones_temporales_mensual",
    "gastos_proveedores",
    "gastos_proveedores_mensual",
    "patrones_compra_proveedor",
)

def _sql_path(path: Path) -> str:
    """Devuelve un path escapado para usarlo dentro de SQL."""
    return str(path).replace("'", "''")


def initialize_connection(
    csv_path: str | Path = DEFAULT_CSV_PATH,
) -> duckdb.DuckDBPyConnection:
    """Crea una conexion DuckDB en memoria con la tabla base y las 8 vistas."""
    path = Path(csv_path).expanduser().resolve()
    if not path.exists():
        raise FileNotFoundError(f"No existe el dataset: {path}")

    con = duckdb.connect(database=":memory:")
    con.execute(
        f"""
        CREATE OR REPLACE VIEW transacciones AS
        SELECT
            transaccion_id::VARCHAR AS transaccion_id,
            comercio_id::VARCHAR AS comercio_id,
            fecha::TIMESTAMP AS fecha,
            tipo::VARCHAR AS tipo,
            categoria::VARCHAR AS categoria,
            monto::DOUBLE AS monto,
            cliente_id::VARCHAR AS cliente_id,
            nombre_contrapartida::VARCHAR AS nombre_contrapartida
        FROM read_csv_auto('{_sql_path(path)}', header = true);
        """
    )

    _create_semantic_views(con)
    return con


def _create_semantic_views(con: duckdb.DuckDBPyConnection) -> None:
    """Registra las vistas semanticas requeridas por AGENTS.md."""
    con.execute(
        """
        CREATE VIEW ventas_diarias AS
        SELECT comercio_id,
               DATE(fecha) AS dia,
               SUM(monto) AS total,
               COUNT(*) AS num_transacciones,
               ROUND(AVG(monto), 2) AS ticket_promedio
        FROM transacciones
        WHERE tipo = 'Ingreso'
        GROUP BY comercio_id, dia;
        """
    )

    con.execute(
        """
        CREATE VIEW ventas_periodo AS
        SELECT comercio_id,
               DATE_TRUNC('week', fecha) AS semana,
               DATE_TRUNC('month', fecha) AS mes,
               SUM(monto) AS total,
               COUNT(*) AS num_transacciones,
               ROUND(AVG(monto), 2) AS ticket_promedio
        FROM transacciones
        WHERE tipo = 'Ingreso'
        GROUP BY comercio_id, semana, mes;
        """
    )

    con.execute(
        """
        CREATE VIEW frecuencia_clientes AS
        SELECT comercio_id,
               cliente_id,
               nombre_contrapartida AS nombre_cliente,
               COUNT(*) AS visitas,
               ROUND(SUM(monto), 2) AS total_gastado,
               ROUND(AVG(monto), 2) AS ticket_promedio,
               MAX(fecha) AS ultima_visita,
               DATEDIFF('day', MAX(fecha), DATE '2026-04-18') AS dias_sin_volver
        FROM transacciones
        WHERE tipo = 'Ingreso'
        GROUP BY comercio_id, cliente_id, nombre_contrapartida;
        """
    )

    con.execute(
        """
        CREATE VIEW categorias_populares AS
        SELECT comercio_id,
               categoria,
               COUNT(*) AS num_transacciones,
               ROUND(SUM(monto), 2) AS ingreso_total,
               ROUND(AVG(monto), 2) AS ticket_promedio
        FROM transacciones
        WHERE tipo = 'Ingreso'
        GROUP BY comercio_id, categoria
        ORDER BY ingreso_total DESC;
        """
    )

    con.execute(
        """
        CREATE VIEW frecuencia_clientes_mensual AS
        SELECT comercio_id,
               DATE_TRUNC('month', fecha) AS mes,
               cliente_id,
               nombre_contrapartida AS nombre_cliente,
               COUNT(*) AS visitas,
               ROUND(SUM(monto), 2) AS total_gastado,
               ROUND(AVG(monto), 2) AS ticket_promedio
        FROM transacciones
        WHERE tipo = 'Ingreso'
        GROUP BY comercio_id, mes, cliente_id, nombre_contrapartida
        ORDER BY mes DESC, visitas DESC;
        """
    )

    con.execute(
        """
        CREATE VIEW clientes_perdidos AS
        SELECT * FROM frecuencia_clientes
        WHERE dias_sin_volver > 30;
        """
    )

    con.execute(
        """
        CREATE VIEW patrones_temporales AS
        SELECT comercio_id,
               DAYOFWEEK(fecha) AS dia_semana,
               HOUR(fecha) AS hora,
               COUNT(*) AS num_transacciones,
               ROUND(AVG(monto), 2) AS ticket_promedio,
               ROUND(SUM(monto), 2) AS total
        FROM transacciones
        WHERE tipo = 'Ingreso'
        GROUP BY comercio_id, dia_semana, hora
        ORDER BY num_transacciones DESC;
        """
    )

    con.execute(
        """
        CREATE VIEW patrones_temporales_mensual AS
        SELECT comercio_id,
               DATE_TRUNC('month', fecha) AS mes,
               DAYOFWEEK(fecha) AS dia_semana,
               HOUR(fecha) AS hora,
               COUNT(*) AS num_transacciones,
               ROUND(AVG(monto), 2) AS ticket_promedio,
               ROUND(SUM(monto), 2) AS total
        FROM transacciones
        WHERE tipo = 'Ingreso'
        GROUP BY comercio_id, mes, dia_semana, hora
        ORDER BY num_transacciones DESC;
        """
    )

    con.execute(
        """
        CREATE VIEW gastos_proveedores AS
        SELECT comercio_id,
               nombre_contrapartida AS proveedor,
               COUNT(*) AS num_pedidos,
               ROUND(SUM(monto), 2) AS total_pagado,
               ROUND(AVG(monto), 2) AS pedido_promedio
        FROM transacciones
        WHERE tipo = 'Egreso' AND categoria = 'Pago a Proveedor'
        GROUP BY comercio_id, proveedor
        ORDER BY total_pagado DESC;
        """
    )

    con.execute(
        """
        CREATE VIEW gastos_proveedores_mensual AS
        SELECT comercio_id,
               nombre_contrapartida AS proveedor,
               DATE_TRUNC('month', fecha) AS mes,
               COUNT(*) AS num_pedidos,
               ROUND(SUM(monto), 2) AS total_pagado,
               ROUND(AVG(monto), 2) AS pedido_promedio
        FROM transacciones
        WHERE tipo = 'Egreso' AND categoria = 'Pago a Proveedor'
        GROUP BY comercio_id, proveedor, mes
        ORDER BY mes DESC, num_pedidos DESC;
        """
    )

    con.execute(
        """
        CREATE VIEW patrones_compra_proveedor AS
        SELECT comercio_id,
               nombre_contrapartida AS proveedor,
               DAYOFWEEK(fecha) AS dia_semana,
               DAY(fecha) AS dia_del_mes,
               COUNT(*) AS num_pedidos,
               ROUND(AVG(monto), 2) AS monto_promedio
        FROM transacciones
        WHERE tipo = 'Egreso' AND categoria = 'Pago a Proveedor'
        GROUP BY comercio_id, proveedor, dia_semana, dia_del_mes
        ORDER BY num_pedidos DESC;
        """
    )


def get_connection() -> duckdb.DuckDBPyConnection:
    """Crea una conexion DuckDB nueva por sesion. Llamar una vez en on_chat_start de Chainlit."""
    return initialize_connection()
