# AGENTS.md — Mi Contador de Bolsillo
## Interact2Hack 2026 · Reto IA Deuna · USFQ

Este archivo es para cualquier modelo de IA (Gemini, GPT, Claude, etc.) que esté ayudando
con este proyecto. Léelo completo antes de sugerir código o arquitectura.

---

## INSTRUCCIONES PARA EL AGENTE QUE LEE ESTO AHORA

1. **Lee este archivo completo** antes de escribir una sola línea de código.
2. **Empieza por `agent/semantic_layer.py`** — es la base de todo. Las vistas DuckDB están
   definidas en la sección "Vistas semánticas requeridas" más abajo. Impleméntalas exactamente.
3. **Orden de implementación sugerido:**
   ```
   1. agent/config.py           ← DEMO_COMERCIO_ID (fuente única, cambiar aquí)
   2. agent/semantic_layer.py   ← conexión DuckDB + 9 vistas + get_connection()
   3. agent/prompts.py          ← system prompt + templates de cada nodo
   4. agent/nodes.py            ← los 6 nodos LangGraph (Nodos 1+2 fusionados)
   5. agent/graph.py            ← grafo LangGraph que conecta los nodos
   6. alerts/proactive.py       ← background task asyncio
   7. utils/charts.py           ← helpers Plotly
   8. app.py                    ← Chainlit entry point, arranca todo
   ```
4. **Implementa un archivo a la vez.** No saltes al siguiente hasta terminar el actual.
5. **Al terminar cada archivo**, actualiza la sección "Estado de implementación" al final
   de este AGENTS.md marcando el archivo como `✅ done` y anotando cualquier decisión
   de diseño no obvia que tomaste.
6. **Si encontraste algo que contradice este archivo** (un bug en el schema, una vista que
   no funciona en DuckDB, etc.), corrígelo aquí en AGENTS.md Y en CLAUDE.md antes de seguir.
7. **No cambies arquitectura.** Las decisiones de stack están cerradas (ver sección
   "Decisiones de arquitectura ya tomadas"). Si algo no funciona, busca otra forma dentro
   del mismo stack.

---

---

## Qué estamos construyendo

Un agente conversacional llamado **"Mi Contador de Bolsillo"** para el hackathon Interact2Hack 2026,
reto corporativo de Deuna. El agente responde preguntas de negocio a micro-comerciantes
ecuatorianos en lenguaje natural, basándose en un dataset sintético de transacciones.

---

## Decisiones de arquitectura ya tomadas — NO replantear

Estas decisiones están cerradas. Si sugieres cambiarlas, estás perdiendo el tiempo del equipo.

### ✅ Text-to-SQL con DuckDB (NO RAG)
RAG es para texto no estructurado. El dataset es tabular. DuckDB ejecuta SQL en memoria,
es más rápido que Pandas, y los LLMs ya saben SQL estándar. Esta decisión es final.

### ✅ LangGraph como orquestador (NO CrewAI, NO AutoGen)
CrewAI introduce overhead multi-agente que rompe el constraint de 5 segundos.
LangGraph permite el loop Genera→Valida→Auto-corrige con estado preservado.

### ✅ Chainlit como UI (NO Streamlit)
Streamlit recarga toda la página en cada interacción. Chainlit es async nativo,
soporta Plotly inline con `cl.Plotly`, y maneja sesiones persistentes.

### ✅ Qwen 2.5 32B via Ollama (NO DeepSeek-R1, NO Llama 70B)
- DeepSeek-R1: overhead de reasoning tokens mata los 5 segundos
- Llama 3.3 70B: no cabe cómodo en A100 40GB con KV cache
- Qwen 2.5 32B: ~16GB VRAM cuantizado, excelente español, buen SQL

### ✅ Ollama como servidor LLM (NO vLLM, NO Singularity, NO SLURM para serving)
El HPC de CEDIA ya tiene Ollama instalado. La API corre en localhost:11434/v1
con compatibilidad OpenAI. Zero config adicional necesario.

### ✅ Capa semántica con vistas pre-calculadas
El LLM nunca ve el schema crudo. Solo ve vistas nombradas con semántica de negocio.
Esto es lo que garantiza el 80% de precisión requerido por el jurado.

---

## Infraestructura disponible

```
HPC CEDIA   → SOLO sirve el modelo LLM via Ollama (GPU A100-SXM4-40GB)
              Acceso: túnel SSH → localhost:11434 en la máquina local
              NO hace deploy de la app, NO corre DuckDB, NO corre Chainlit

Local       → corre TODO lo demás: Chainlit, DuckDB, LangGraph, el agente
              El código asume que http://localhost:11434/v1 está disponible
              (ya sea túnel al HPC o Ollama corriendo localmente)
```

El código NO debe asumir que está en el HPC ni usar rutas absolutas del cluster.
Todo path debe ser relativo al root del proyecto.

---

## Decisión estratégica de diseño (validada con mentor Deuna)

**Modelamos el peor escenario real.** El tendero ecuatoriano promedio NO lleva registro
de lo que vende ítem por ítem. Cuando el vecino paga $12.50 por queso + jamón + leche,
Deuna solo captura: monto total, timestamp, comercio, y quién pagó (si tiene cuenta Deuna).

**Sin `producto`, sin ítems.** Esta es una decisión consciente y es el diferenciante del proyecto:
nuestro agente funciona con los datos que Deuna YA tiene de cualquier comerciante desde su
primer cobro. Sin configuración, sin catálogo. Los insights vienen del patrón de pagos.

Si un modelo sugiere agregar columna `producto` o ítems por transacción: **rechazar**. No es
realista y no es lo que pide el reto.

---

## Dataset disponible

```
Archivo:       data/transacciones.csv
Fuente:        CSV sintético generado por scripts/generar_dataset.py (seed=42, reproducible)
Comercios:     3 perfiles diferenciados con personalidad propia:
               COM-001 "Tienda Don Aurelio"  → tienda barrio, $49,822/año, ticket $17.86, pico sábado
               COM-002 "Fonda Don Jorge"     → restaurante, $25,773/año, ticket $3.44, bimodal 7-9am/12-2pm
               COM-003 "Salón Belleza Total" → salón belleza, $55,580/año, ticket $25.42, pico viernes-sábado
Periodo:       2025-01-01 a 2026-04-18 (16 meses, fecha de corte = hoy en la demo)
Transacciones: 13,399 total (COM-001: 2,789 | COM-002: 7,491 | COM-003: 2,186 + egresos)
Clientes:      50 únicos con cuenta Deuna por comercio, identificados por CL-XXXX + nombre
El 2026-04-18 tiene SOLO 3 transacciones de la mañana (día en curso) → alerta caída garantizada
Restricción:   El agente SOLO puede usar este dataset, nada externo
```

### Schema exacto de data/transacciones.csv

```
transaccion_id       string    — TX-COM-001-XXXXX, identificador único
comercio_id          string    — COM-001 | COM-002 | COM-003
fecha                datetime  — YYYY-MM-DD HH:MM:SS  ← hora es ORO para patrones
tipo                 string    — "Ingreso" | "Egreso"
categoria            string    — segmento de negocio (ver valores abajo)
monto                float     — en USD
cliente_id           string    — CL-XXXX si Ingreso (comprador Deuna); proveedor si Egreso
nombre_contrapartida string    — nombre del cliente (Ingresos) o del proveedor (Egresos)
```

**NO existe columna `producto`.** El dataset captura el cobro total, no los ítems individuales.

### Valores de tipo y categoria

```
tipo = "Ingreso"  → cobros al cliente final (avg $25.56, max $49.99)
  categorias: Bebidas | Lácteos | Abarrotes | Snacks | Limpieza | Otros
  — la categoria es inferida por Deuna según el perfil del comercio, no la ingresa el tendero

tipo = "Egreso"   → pagos salientes del comerciante (avg $158.04, max $299.67)
  categoria "Pago a Proveedor"  → transferencias a distribuidores vía Deuna
  categoria "Servicios Básicos" → CNT, Empresa Eléctrica
```

### Proveedores reales ecuatorianos en Egresos (nombre_contrapartida)

```
Cervecería Nacional (Pilsener)    Arca Continental (Coca-Cola)
Tesalia CBC (Pepsi)               Tonicorp
Snacks Frito Lay                  Pronaca
Nestlé Ecuador                    Moderna Alimentos
Bimbo Ecuador                     La Fabril
Helados Pingüino                  CNT
Empresa Eléctrica
```

### CRÍTICO: Filtrar por tipo en las vistas

**Siempre** usar `WHERE tipo = 'Ingreso'` en vistas de ventas, frecuencia de clientes y categorías.
Los Egresos son pagos salientes, NO se mezclan con ventas al cliente.
`nombre_contrapartida` = cliente cuando `tipo = 'Ingreso'`, proveedor cuando `tipo = 'Egreso'`.

### CRÍTICO: comercio_id null en parámetros semánticos

Cuando el Nodo 2 devuelve `comercio_id: null` significa que el usuario no especificó comercio.
**El SQL generado NO debe incluir `WHERE comercio_id = ...`** — agrega los 3 comercios juntos.
Nunca fallar ni pedir al usuario que especifique; simplemente agregar sin filtro.

---

## Estado LangGraph — estructura requerida

El estado que fluye entre nodos debe incluir la conexión DuckDB para no recrearla en cada nodo.
Estructura mínima:

```python
from typing import TypedDict, Any
import duckdb

class AgentState(TypedDict):
    question: str                          # pregunta original del usuario
    comercio_id: str | None               # extraído del Nodo 2, puede ser None
    scope: str                             # "en_scope" | "fuera_scope"
    view_name: str | None                 # vista seleccionada por Nodo 2
    params: dict                           # parámetros semánticos del Nodo 2
    requires_product_disclaimer: bool     # flag para Q5
    sql: str                               # SQL generado por Nodo 3
    sql_valid: bool                        # resultado del Nodo 4
    sql_result: list[dict]                # resultado de DuckDB del Nodo 5
    response: str                          # respuesta final del Nodo 6
    error: str | None                     # error si falla algún nodo
    retry_count: int                       # intentos de auto-corrección (max 3)
    con: Any                               # duckdb.DuckDBPyConnection — pasado desde on_chat_start
```

**CRÍTICO**: `con` viene de `cl.user_session.get("con")` en `app.py` y se inyecta al estado
al inicio de cada invocación del grafo. Los nodos NUNCA llaman `get_connection()` directamente.

---

## Los nodos del grafo LangGraph

Nodos 1+2 fusionados en `classify_and_map_node` para reducir latencia (~1-2s menos).

```python
# Nodo 1+2: Clasificador+Semántico (fusionados)
# Input:  pregunta + historial de conversación
# Output: scope ("en_scope"|"en_scope_financiero"|"ambiguous"|"fuera_scope")
#         + vista DuckDB + parámetros
# Lógica: LLM evalúa intención y mapea a vista; overrides determinísticos en Python
# Override: preguntas financieras → en_scope_financiero + ventas_periodo (sin importar LLM)
# Override: frecuencia_clientes + mes/año → frecuencia_clientes_mensual
# Override: gastos_proveedores + mes → gastos_proveedores_mensual

# Nodo 3: Generador SQL
# Input:  vista objetivo + parámetros + schema
# Output: query SQL válido para DuckDB
# Modelo: qwen2.5:32b, temperature=0, max_tokens=512

# Nodo 4: Validador (estático, sin LLM)
# Input:  query SQL generado
# Output: válido | inválido + razón
# Lógica: chequeo estático: solo SELECT/WITH, solo vistas permitidas, no tabla cruda

# Nodo 5: Ejecutor
# Input:  query SQL validado
# Output: resultado tabular (lista de dicts) | error → retry al Nodo 3 (max 3 intentos)

# Nodo 6a: Sintetizador (scope en_scope)
# Input:  resultado tabular + pregunta original
# Output: respuesta en español neutro + Plotly si aplica
# Modelo: qwen2.5:32b, temperature=0.3, max_tokens=300

# Nodo 6b: Asesor Financiero (scope en_scope_financiero)
# Input:  resultado ventas_periodo (datos reales) + DEUNA_PRODUCTOS[comercio_id]
# Output: recomendación personalizada de crédito con datos reales del comercio
# Producto: "Crédito para Negocio y Emprendedores" Banco Pichincha ($500-$20k, 48 meses)
# Nota: "Impulsa tu negocio" y "Crédito Mujer" requieren >$100k/año — NO aplican
```

---

## Vistas semánticas requeridas

Todas las vistas de ventas/clientes/categorías filtran `WHERE tipo = 'Ingreso'`.
Las vistas de gastos filtran `WHERE tipo = 'Egreso'`.
**No hay vista de productos** — el dataset no tiene ítems individuales.

```sql
-- cobros al cliente por día
CREATE VIEW ventas_diarias AS
SELECT comercio_id,
       DATE(fecha) AS dia,
       SUM(monto) AS total,
       COUNT(*) AS num_transacciones,
       ROUND(AVG(monto), 2) AS ticket_promedio
FROM transacciones
WHERE tipo = 'Ingreso'
GROUP BY comercio_id, dia;

-- cobros agregados por semana y mes
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

-- frecuencia y valor por cliente (solo clientes Deuna identificados)
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

-- categorías de venta más frecuentes (Bebidas, Snacks, Lácteos, etc.)
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

-- clientes que no han regresado en más de 30 días
CREATE VIEW clientes_perdidos AS
SELECT * FROM frecuencia_clientes
WHERE dias_sin_volver > 30;

-- horas pico y días pico de venta  ← insight diferenciante
-- dia_semana: 0=domingo … 6=sábado (DuckDB DAYOFWEEK)
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

-- gasto total por proveedor
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

-- horas pico/tranquilas EN UN MES CONCRETO (usar cuando la pregunta menciona enero, diciembre, etc.)
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

-- qué día del mes / día de semana se hacen las compras al distribuidor
-- útil para: "¿cuándo suelo comprar a Pilsener?" → planificación de caja
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
```

---

## System prompt del agente (base)

```
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
- Si hay datos comparativos (esta semana vs semana pasada), incluye el porcentaje de cambio.
- Si hay tendencia temporal, sugiere un gráfico.
- Siempre termina con una acción concreta que el comerciante puede tomar.
```

---

## Alerta proactiva — parámetros demo vs producción

```python
# DEMO ante el jurado — dispara rápido; el dataset ya tiene hoy (2026-04-18) parcial
iniciar_monitor_ventas(
    session_id=session_id,
    con=con,
    intervalo_segundos=10,           # ← 10s para demo, 300 en producción
    fecha_referencia="2026-04-18",   # ← fecha de corte = hoy, caída 88% garantizada
)

# PRODUCCIÓN — defaults seguros
iniciar_monitor_ventas(session_id=session_id, con=con)  # 300s, última fecha del dataset
```

**Fecha de prueba validada:** `2026-04-18` → caída 88% garantizada (solo 3 transacciones de mañana vs mediana ~$95 de sábados históricos).
El dataset YA tiene la fecha de corte en hoy, no se necesita fecha_referencia adicional.

---

## Alerta proactiva — implementación async

```python
# alerts/proactive.py
import asyncio
import chainlit as cl
import duckdb

THRESHOLD_CAIDA = 0.20  # 20% de caída activa la alerta

async def monitor_ventas(session_id: str, intervalo_segundos: int = 300):
    while True:
        await asyncio.sleep(intervalo_segundos)
        
        # Comparar ventas del día actual vs mediana histórica del mismo día de semana
        resultado = duckdb.execute("""
            SELECT 
                hoy.total AS ventas_hoy,
                historico.mediana AS mediana_historica,
                (hoy.total - historico.mediana) / historico.mediana AS variacion
            FROM ventas_hoy hoy, mediana_dia_semana historico
            WHERE historico.dia_semana = DAYOFWEEK(CURRENT_DATE)
        """).fetchone()
        
        if resultado and resultado[2] < -THRESHOLD_CAIDA:
            variacion_pct = abs(resultado[2]) * 100
            mensaje = (
                f"Oye, estuve revisando los números y noté que hoy "
                f"llevas un {variacion_pct:.0f}% menos de lo que normalmente "
                f"vendes un {obtener_dia_espanol()}. "
                f"¿Quieres que revisemos qué productos están rotando menos?"
            )
            # Push al hilo de conversación activo
            await cl.Message(content=f"💡 {mensaje}").send()
```

---

## Preguntas de prueba que el jurado va a usar (referencia)

Según el reto, deben soportar al menos 10 tipos. Estado con nuestro dataset:

| # | Pregunta | Vista | Estado |
|---|----------|-------|--------|
| 1 | ¿Cuánto vendí esta semana? | ventas_periodo | ✅ |
| 2 | ¿Cuál fue mi mejor día del mes? | ventas_diarias | ✅ |
| 3 | ¿Cuál es el peor día de la semana? | patrones_temporales | ✅ |
| 4 | ¿Cuánto gané este mes vs el anterior? | ventas_periodo | ✅ |
| 5 | ¿Qué producto se vende más? | — | ⚠️ ver abajo |
| 6 | ¿Qué clientes no han vuelto en el último mes? | clientes_perdidos | ✅ |
| 7 | ¿Cuántos clientes nuevos tuve esta semana? | frecuencia_clientes | ✅ |
| 8 | ¿Cuál fue mi día con más ventas en todo el año? | ventas_diarias | ✅ |
| 9 | ¿Cómo van mis ventas vs hace 3 meses? | ventas_periodo | ✅ |
| 10 | ¿Cuántas transacciones tuve hoy? | ventas_diarias | ✅ |
| 11 | ¿Quiénes son mis clientes más frecuentes? | frecuencia_clientes | ✅ |
| 12 | ¿Cuánto vendo en promedio por día? | ventas_diarias | ✅ |

**Manejo de Q5 (¿Qué producto se vende más?):**
El agente responde honestamente:
> *"Deuna registra el cobro total de cada venta, no los productos individuales, así que no
> tengo ese detalle. Lo que sí puedo decirte es qué categoría te genera más ingresos:
> [resultado de categorias_populares]. Si quieres saber los productos exactos, necesitarías
> registrar cada ítem en el momento del cobro."*

Esto es más valioso que inventar una respuesta, y demuestra solidez técnica ante el jurado.

---

## Lo que el jurado evalúa explícitamente

Según el documento oficial del reto:

- Relevancia para el negocio de Deuna y el comerciante
- Calidad técnica del agente y **precisión de las respuestas** (80% mínimo)
- **Claridad y naturalidad del lenguaje** utilizado
- Robustez del manejo de errores y casos borde
- Uso adecuado de IA aplicada a un problema concreto
- Potencial de implementación real

---

## Si vas a sugerir código, sigue estas convenciones

```python
# Conexión al LLM (Ollama)
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",
    model="qwen2.5:32b",
    temperature=0,
)

# Conexión a DuckDB — una conexion por sesion, NO singleton global
from agent.semantic_layer import get_connection

@cl.on_chat_start
async def on_chat_start():
    con = get_connection()           # conexion fresca con las 8 vistas ya listas
    cl.user_session.set("con", con)  # guardar en sesion, no en variable global

# Chainlit entry point
import chainlit as cl

@cl.on_message
async def main(message: cl.Message):
    con = cl.user_session.get("con")
    # pasar con al grafo LangGraph
```

---

## Restricciones del reto que no se pueden ignorar

- El dataset es el único origen de datos. Sin APIs externas, sin web scraping.
- Respuestas en español neutro (no español de España, no técnico)
- < 5 segundos por respuesta en la demo
- No inventar datos bajo ninguna circunstancia
- Al menos 1 flujo proactivo demostrable ante el jurado

---

## Flujo de orquestación human-in-the-loop

Este proyecto usa **Claude Code como orquestador** con el usuario (equipo USFQ) como checkpoint
entre iteraciones. Si eres otro modelo (Gemini, GPT, Qwen, etc.) recibiendo una tarea de este
proyecto, el flujo es:

```
Claude (orquestador) ←→ Usuario (human-in-the-loop)
        ↓
  Otro LLM (implementa un archivo/módulo específico)
        ↓
  Claude valida resultado contra reglas de negocio
        ↓
  Usuario aprueba o pide iteración
```

Cuando recibas una tarea de este flujo:
1. Lee este AGENTS.md completo antes de escribir código
2. Implementa SOLO lo que te pidan, un archivo a la vez
3. Respeta el schema exacto de data/transacciones.csv
4. Usa las vistas semánticas, nunca SQL directo contra la tabla cruda
5. Entrega el código y una lista de supuestos que asumiste

---

## Estado de implementación

```
agent/config.py             ✅ done  ← DEMO_COMERCIO_ID, fuente única
agent/semantic_layer.py     ✅ done  ← 11 vistas, ref 2026-04-18
agent/prompts.py            ✅ done  ← DEUNA_PRODUCTOS, FINANCIAL_ADVISOR_PROMPT, VIEW_SELECTION_GUIDE
agent/nodes.py              ✅ done  ← Nodos 1+2 fusionados + financial_advisor_node; overrides determinísticos
agent/graph.py              ✅ done  ← 7 nodos, routing en_scope_financiero → financial_advisor → END
alerts/proactive.py         ✅ done  ← tick1=caída ventas, tick2=calificación crédito con link markdown
utils/charts.py             ✅ done  ← eje categorical, labels español, frecuencia_clientes_mensual
app.py                      ✅ done  ← Chat Profiles, bienvenidas rotatorias, link crédito en respuesta financiera
data/transacciones.csv      ✅ done  ← 13,399 tx, 3 perfiles distintos, 16 meses, hoy=3 tx mañana
```

**Decisiones de diseño no obvias:**
- DuckDB `ILIKE` NO normaliza tildes → nombres de clientes/proveedores se buscan por palabras sueltas sin acento (`ILIKE '%Garcia%' AND ILIKE '%Gomez%'`)
- `frecuencia_clientes` no tiene columna de fecha → override Python redirige a `frecuencia_clientes_mensual` cuando hay año/mes en la pregunta
- Eje X de Plotly interpreta fechas ISO como axis de fecha continua → bars invisibles con pocos puntos. Fix: labels en español (`Ene-25`, `14-Abr`) + `fig.update_xaxes(type="category")`
- "Impulsa tu negocio" y "Crédito Mujer" requieren ingresos >$100k/año → los 3 comercios NO califican. Producto correcto: "Crédito para Negocio y Emprendedores" ($500-$20k, 48 meses, 100% digital)
- `cl.Action` con `url` en Chainlit requiere callback registrado pero no abre el link automáticamente → usar link markdown `[texto](url)` directamente en el mensaje

---

## ⏳ Pendiente antes del pitch

| # | Tarea | Prioridad |
|---|---|---|
| 1 | **15 preguntas de prueba** — validar precisión ≥80% con el dataset actual | Alta — criterio jurado |
| 2 | Benchmarking de modelos (Qwen vs Llama vs alternativas) | Media — necesita HPC CEDIA |

---

*Última actualización: Interact2Hack 2026 — Equipo USFQ*
