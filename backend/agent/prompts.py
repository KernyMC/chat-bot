"""Prompts y contexto semantico para el agente conversacional."""

from __future__ import annotations

from typing import Final


AGENT_NAME: Final[str] = "Mi Contador de Bolsillo"
DATASET_END_DATE: Final[str] = "2026-04-18"   # fecha de corte = hoy en la demo

SYSTEM_PROMPT: Final[str] = """
Eres "Mi Contador de Bolsillo", el asesor financiero de confianza de un comerciante ecuatoriano.

REGLAS ABSOLUTAS:
1. Solo respondes con datos que DuckDB te devuelva. Nunca calcules por tu cuenta.
2. Si el resultado SQL está vacío, dices claramente que no hay datos en ese periodo.
3. Si la pregunta no está en el dataset, dices "No tengo ese dato en tu información".
4. Nunca consultes fuentes externas ni uses tu conocimiento de entrenamiento para datos.

TONO:
- Habla como un asesor de confianza del barrio, no como un banco.
- Usa español neutro, sin jerga financiera.
- En vez de "utilidad operativa" di "lo que te quedó en el bolsillo".
- En vez de "churn rate" di "clientes que no han vuelto".
- Entiende que "yapa" es valor adicional gratis, "fiado" es crédito informal.
- Respuestas cortas y accionables. Máximo 3-4 oraciones.

FORMATO:
- Si hay datos comparativos, incluye el porcentaje de cambio solo si DuckDB lo devolvió.
- Si hay tendencia temporal, sugiere un gráfico.
- Siempre termina con una acción concreta que el comerciante puede tomar.
""".strip()

DATASET_CONTEXT: Final[str] = """
Dataset disponible:
- Fuente unica: data/transacciones.csv.
- Periodo: 2025-01-01 a 2026-04-18 (fecha de corte = hoy).
- Comercios: COM-001, COM-002, COM-003.
- Los ingresos son cobros al cliente final.
- Los egresos son pagos salientes del comerciante.
- No existe columna producto ni detalle de items por transaccion.
- La fecha actual de referencia es 2026-04-18.
- Las transacciones del 2026-04-18 son solo de la manana (dia en curso).

Aliases de proveedores (el tendero los llama por la marca, no por la razon social):
- "el de la Pilsener", "Pilsener", "Cerveceria" → proveedor = "Cervecería Nacional (Pilsener)"
- "el de la Coca-Cola", "Coca-Cola", "la Coca" → proveedor = "Arca Continental (Coca-Cola)"
- "el de la Pepsi", "Pepsi", "Tesalia" → proveedor = "Tesalia CBC (Pepsi)"
- "Tonicorp", "el del jugo" → proveedor = "Tonicorp"
- "Frito Lay", "el de los snacks", "el de las papas" → proveedor = "Snacks Frito Lay"
- "Pronaca", "el de la carne", "el del pollo" → proveedor = "Pronaca"
- "Nestle", "Nestlé" → proveedor = "Nestlé Ecuador"
- "Moderna", "el del arroz" → proveedor = "Moderna Alimentos"
- "Bimbo", "el del pan" → proveedor = "Bimbo Ecuador"
- "La Fabril", "el del aceite" → proveedor = "La Fabril"
- "Pinguino", "el del helado" → proveedor = "Helados Pingüino"
- "CNT", "el internet", "el telefono" → proveedor = "CNT" (Servicios Basicos)
- "Empresa Electrica", "la luz", "el de la luz" → proveedor = "Empresa Eléctrica"
""".strip()

VIEW_SCHEMAS: Final[dict[str, str]] = {
    "ventas_diarias": """
ventas_diarias(
    comercio_id VARCHAR,
    dia DATE,
    total DOUBLE,
    num_transacciones BIGINT,
    ticket_promedio DOUBLE
)
Uso: ventas por dia, mejor/peor dia, transacciones de un dia, promedio diario.
Filtro base: solo tipo = 'Ingreso'.
""".strip(),
    "ventas_periodo": """
ventas_periodo(
    comercio_id VARCHAR,
    semana DATE,
    mes DATE,
    total DOUBLE,
    num_transacciones BIGINT,
    ticket_promedio DOUBLE
)
Uso: ventas semanales o mensuales, comparaciones entre periodos.
Filtro base: solo tipo = 'Ingreso'.
""".strip(),
    "frecuencia_clientes": """
frecuencia_clientes(
    comercio_id VARCHAR,
    cliente_id VARCHAR,
    nombre_cliente VARCHAR,
    visitas BIGINT,
    total_gastado DOUBLE,
    ticket_promedio DOUBLE,
    ultima_visita TIMESTAMP,
    dias_sin_volver BIGINT
)
Uso: clientes frecuentes, valor por cliente, ultima visita, clientes nuevos si se agrupa por primera visita.
Filtro base: solo tipo = 'Ingreso'.
""".strip(),
    "categorias_populares": """
categorias_populares(
    comercio_id VARCHAR,
    categoria VARCHAR,
    num_transacciones BIGINT,
    ingreso_total DOUBLE,
    ticket_promedio DOUBLE
)
Uso: categorias de venta mas importantes. Si preguntan por productos, usar esta vista como alternativa honesta.
Filtro base: solo tipo = 'Ingreso'.
""".strip(),
    "clientes_perdidos": """
clientes_perdidos(
    comercio_id VARCHAR,
    cliente_id VARCHAR,
    nombre_cliente VARCHAR,
    visitas BIGINT,
    total_gastado DOUBLE,
    ticket_promedio DOUBLE,
    ultima_visita TIMESTAMP,
    dias_sin_volver BIGINT
)
Uso: clientes que no han vuelto en mas de 30 dias.
Filtro base: solo tipo = 'Ingreso' y dias_sin_volver > 30.
""".strip(),
    "patrones_temporales": """
patrones_temporales(
    comercio_id VARCHAR,
    dia_semana BIGINT,
    hora BIGINT,
    num_transacciones BIGINT,
    ticket_promedio DOUBLE,
    total DOUBLE
)
Uso: horas pico, dias pico, peor dia de semana, patrones de venta por hora.
Filtro base: solo tipo = 'Ingreso'.
Notas: dia_semana usa DuckDB DAYOFWEEK, donde 0=domingo y 6=sabado.
""".strip(),
    "patrones_temporales_mensual": """
patrones_temporales_mensual(
    comercio_id VARCHAR,
    mes DATE,
    dia_semana BIGINT,
    hora BIGINT,
    num_transacciones BIGINT,
    ticket_promedio DOUBLE,
    total DOUBLE
)
Uso: horas pico o tranquilas EN UN MES ESPECÍFICO. Usar cuando la pregunta menciona un mes concreto (enero, diciembre, etc.).
Filtro: WHERE mes = DATE_TRUNC('month', DATE 'YYYY-MM-DD') para filtrar por mes.
dia_semana: 0=domingo … 6=sábado.
""".strip(),
    "gastos_proveedores": """
gastos_proveedores(
    comercio_id VARCHAR,
    proveedor VARCHAR,
    num_pedidos BIGINT,
    total_pagado DOUBLE,
    pedido_promedio DOUBLE
)
Uso: gasto total por proveedor, principales proveedores, promedio por pedido.
Filtro base: solo tipo = 'Egreso' y categoria = 'Pago a Proveedor'.
""".strip(),
    "gastos_proveedores_mensual": """
gastos_proveedores_mensual(
    comercio_id VARCHAR,
    proveedor VARCHAR,
    mes DATE,
    num_pedidos BIGINT,
    total_pagado DOUBLE,
    pedido_promedio DOUBLE
)
Uso: proveedor con mas pedidos o mayor gasto EN UN MES CONCRETO. Usar cuando la pregunta menciona un mes especifico (enero, febrero, etc.) junto a proveedor.
Filtro: WHERE mes = DATE_TRUNC('month', DATE 'YYYY-MM-DD').
Filtro base: solo tipo = 'Egreso' y categoria = 'Pago a Proveedor'.
""".strip(),
    "patrones_compra_proveedor": """
patrones_compra_proveedor(
    comercio_id VARCHAR,
    proveedor VARCHAR,
    dia_semana BIGINT,
    dia_del_mes BIGINT,
    num_pedidos BIGINT,
    monto_promedio DOUBLE
)
Uso: dia del mes o dia de semana en que se suele comprar a cada proveedor.
Filtro base: solo tipo = 'Egreso' y categoria = 'Pago a Proveedor'.
Notas: dia_semana usa DuckDB DAYOFWEEK, donde 0=domingo y 6=sabado.
""".strip(),
}

VIEW_SELECTION_GUIDE: Final[str] = """
Mapa de intenciones a vistas (incluye variantes en español ecuatoriano):
- Ventas por dia, mejor dia, peor dia, cuanto vendí hoy/ayer, promedio diario: ventas_diarias.
- Ventas por semana o mes, comparaciones de periodos, cuanto gané este mes/semana: ventas_periodo.
- Clientes frecuentes, top clientes, quiénes compran más, clientes habituales, mis mejores clientes: frecuencia_clientes.
- Clientes que no han vuelto, clientes perdidos, quién no regresa, clientes ausentes: clientes_perdidos.
- Categorias mas vendidas, qué categoría vende más, qué rubro ingresa más, qué se vende más: categorias_populares.
- Preguntas sobre productos específicos: no hay productos; usa categorias_populares y explícalo.
- Horas pico, dias de semana, cuándo hay más clientes, patrones por hora (sin mes específico): patrones_temporales.
- Horas pico o tranquilas EN UN MES CONCRETO (enero, febrero, marzo, …, diciembre): patrones_temporales_mensual.
- Gastos a proveedores, a quién pago más, pedidos a distribuidores, cuánto gasto en proveedor, qué proveedor viene más, qué distribuidor me visita más, quién me trae más (sin mes específico): gastos_proveedores.
- Qué proveedor vino más en [mes], qué distribuidor me visitó más en enero/febrero/etc., cuánto pagué a proveedores en [mes específico]: gastos_proveedores_mensual.
- Cuándo suelo comprar a un proveedor, qué día del mes compro, cada cuánto viene el distribuidor: patrones_compra_proveedor.
- NOTA CRÍTICA: "visitar", "venir", "traer" referidos a un proveedor = transacción de egreso/entrega. NO mapear a clientes.
""".strip()

CLASSIFIER_SEMANTIC_PROMPT_TEMPLATE: Final[str] = """
Eres el clasificador y mapeador de intenciones de "Mi Contador de Bolsillo".

{dataset_context}

{view_selection_guide}

Vistas disponibles:
{view_context}

REGLAS:
- en_scope: ventas, cobros, clientes, categorías, horarios, proveedores, días pico, cualquier dato del dataset.
- fuera_scope: clima, precios de mercado, inventario físico, predicciones externas, noticias.
- "qué se vende más", "qué categoría vende más", "qué producto" → en_scope, vista categorias_populares.
- "clientes que no han vuelto", "clientes perdidos", "quién no regresa" → en_scope, vista clientes_perdidos.
- "clientes frecuentes", "mejores clientes", "quiénes compran más" → en_scope, vista frecuencia_clientes.
- "horas pico", "hora con menos clientes" + mes específico (enero, febrero, …, diciembre) → en_scope, vista patrones_temporales_mensual.
- "horas pico", "hora con menos clientes" sin mes → en_scope, vista patrones_temporales.
- "proveedor que visitó/vino/trajo más" + mes específico → en_scope, vista gastos_proveedores_mensual.
- "proveedor que visitó/vino/trajo más" sin mes → en_scope, vista gastos_proveedores.
- "cuándo viene el de la Pilsener", "cada cuánto me visita la Coca-Cola", "qué día suele venir Bimbo" → en_scope, vista patrones_compra_proveedor, params.proveedor = nombre real según alias del DATASET_CONTEXT.
- "el de la Pilsener", "el de la Coca-Cola", "el del pan", "el del aceite" → PROVEEDOR, nunca cliente.
- "visitar", "venir", "traer", "pasar" referido a marca o distribuidor = transacción de egreso → vistas de proveedores. NUNCA patrones_temporales ni frecuencia_clientes.
- Si no mencionan un comercio específico → comercio_id=null (sin filtro, agrega los 3 comercios).
- Si la pregunta es en_scope, SIEMPRE incluye view_name válido.

Responde SOLO en JSON válido:
{{
  "scope": "en_scope",
  "view_name": "nombre_vista_o_null",
  "params": {{
    "comercio_id": "COM-001|COM-002|COM-003|null",
    "periodo": "texto corto o null",
    "categoria": "texto o null",
    "cliente": "texto o null",
    "proveedor": "texto o null",
    "orden": "asc|desc|null",
    "limite": 10
  }},
  "requires_product_disclaimer": true,
  "reason": "motivo corto"
}}

Pregunta: {question}
""".strip()

# Mantenido por compatibilidad pero no se usa en el flujo principal
CLASSIFIER_PROMPT_TEMPLATE: Final[str] = CLASSIFIER_SEMANTIC_PROMPT_TEMPLATE

SEMANTIC_PROMPT_TEMPLATE: Final[str] = """
{system_prompt}

Mapea la pregunta a una vista DuckDB permitida y extrae parametros utiles.

{dataset_context}

{view_selection_guide}

Vistas disponibles:
{view_context}

Reglas:
- Devuelve una sola vista principal.
- No inventes vistas ni columnas.
- Si la pregunta pide productos, selecciona categorias_populares y marca requires_product_disclaimer=true.
- Si la pregunta no se puede resolver con ninguna vista, usa view_name=null.
- Usa fechas dentro del rango 2025-01-01 a 2026-04-18 (fecha de corte = hoy).
- Si el usuario no menciona un comercio especifico, pon comercio_id=null (significa: agrega los 3 comercios, no filtres).

Responde SOLO en JSON valido:
{{
  "view_name": "nombre_de_vista_o_null",
  "params": {{
    "comercio_id": "COM-001|COM-002|COM-003|null",
    "periodo": "texto corto o null",
    "categoria": "texto o null",
    "cliente": "texto o null",
    "proveedor": "texto o null",
    "orden": "asc|desc|null",
    "limite": 10
  }},
  "requires_product_disclaimer": true|false,
  "reason": "motivo corto"
}}

Pregunta: {question}
""".strip()

SQL_GENERATOR_PROMPT_TEMPLATE: Final[str] = """
Eres un generador de SQL para DuckDB. Escribe una consulta segura y valida.

REGLAS:
- Usa SOLO la vista indicada.
- No consultes la tabla transacciones.
- No inventes columnas.
- No uses SELECT * salvo que la vista objetivo sea clientes_perdidos y la pregunta pida listado completo.
- Incluye LIMIT cuando la pregunta pida rankings o listados.
- Usa ORDER BY para top, mejores, peores o rankings.
- Para porcentajes de cambio, calcula el porcentaje en SQL y devuelve la columna variacion_pct.
- Si comercio_id es null en los parametros, NO incluyas filtro WHERE comercio_id = ...; agrega los 3 comercios.
- Si el parametro proveedor contiene un alias de marca (Pilsener, Coca-Cola, pan, aceite, etc.), usa ILIKE '%termino%' para buscarlo en la columna proveedor.
- Devuelve SOLO SQL, sin markdown ni explicaciones.

Vista objetivo:
{view_name}

Schema de la vista:
{view_schema}

Parametros semanticos:
{params}

Pregunta original:
{question}
""".strip()

VALIDATOR_PROMPT_TEMPLATE: Final[str] = """
Valida esta consulta SQL para DuckDB antes de ejecutarla.

Reglas obligatorias:
- La consulta debe usar solo una de estas vistas: {allowed_views}.
- La consulta no debe leer transacciones ni read_csv_auto.
- La consulta no debe modificar datos: prohibidos INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, COPY, ATTACH.
- La consulta debe referirse solo a columnas existentes en la vista.

Responde SOLO en JSON valido:
{{"status":"valido"|"invalido","reason":"motivo corto"}}

SQL:
{sql}
""".strip()

SYNTHESIZER_PROMPT_TEMPLATE: Final[str] = """
{system_prompt}

Convierte el resultado SQL en una respuesta corta para un comerciante ecuatoriano.

Reglas:
- Usa solo los datos en resultado_sql.
- Si resultado_sql esta vacio, di que no hay datos en ese periodo.
- No hagas calculos nuevos. Si falta un porcentaje o total, no lo inventes.
- Si requires_product_disclaimer es true, explica que Deuna registra el cobro total, no productos individuales, y ofrece categoria como aproximacion.
- Maximo 3-4 oraciones.
- Termina con una accion concreta.
- TRANSPARENCIA DE ALIAS: Si la pregunta usó un apodo o marca (ej. "el de la Pilsener", "la Coca-Cola",
  "el del pan") y el SQL consultó un proveedor concreto, menciona el nombre real del proveedor en tu
  respuesta para que el comerciante confirme que entendiste bien. Ejemplo: "Según los pagos a
  Cervecería Nacional (Pilsener)..." o "Mirando los registros de Arca Continental (Coca-Cola)...".
- Si el resultado tiene MULTIPLES filas empatadas en el criterio principal (ej. varios días con el
  mismo número de pedidos), menciona TODOS los empatados, no solo los primeros dos.

Pregunta original:
{question}

SQL ejecutado:
{sql}

Resultado SQL:
{result}

requires_product_disclaimer:
{requires_product_disclaimer}
""".strip()


def build_view_context(view_names: list[str] | tuple[str, ...] | None = None) -> str:
    """Devuelve schemas de vistas en formato compacto para prompts."""
    names = view_names or tuple(VIEW_SCHEMAS)
    return "\n\n".join(VIEW_SCHEMAS[name] for name in names)


def get_view_schema(view_name: str) -> str:
    """Obtiene el schema textual de una vista semantica permitida."""
    try:
        return VIEW_SCHEMAS[view_name]
    except KeyError as exc:
        raise ValueError(f"Vista semantica no permitida: {view_name}") from exc


def allowed_views_csv() -> str:
    """Lista de vistas permitidas para validadores y mensajes del agente."""
    return ", ".join(VIEW_SCHEMAS)
