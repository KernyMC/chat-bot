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
Fuente:        CSV sintético generado por scripts/generar_dataset.py
Comercios:     3 (COM-001, COM-002, COM-003) — modelo: tienda de barrio ecuatoriana
Periodo:       2025-01-01 a 2026-04-18 (fecha de corte = hoy en la demo)
Transacciones: ~2650 por comercio (8020 total)
Clientes:      50 únicos con cuenta Deuna, identificados por CL-XXXX + nombre
El 2026-04-18 tiene SOLO 3 transacciones de la mañana (día en curso) → alerta garantizada
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

## Los 6 nodos del grafo LangGraph

```python
# Nodo 1: Clasificador
# Input:  pregunta del usuario (string)
# Output: "en_scope" | "fuera_scope"
# Lógica: El LLM evalúa si la pregunta puede responderse con el dataset

# Nodo 2: Semántico
# Input:  pregunta del usuario
# Output: nombre de vista DuckDB + parámetros relevantes
# Lógica: Mapeo intención → vista pre-calculada

# Nodo 3: Generador SQL
# Input:  vista objetivo + parámetros + schema de la vista
# Output: query SQL válido para DuckDB
# Modelo: qwen2.5:32b, temperature=0, max_tokens=512

# Nodo 4: Validador
# Input:  query SQL generado
# Output: "valido" | "invalido" + razón
# Lógica: sql_db_query_checker, chequeo estático antes de ejecutar

# Nodo 5: Ejecutor
# Input:  query SQL validado
# Output: resultado tabular (lista de dicts) | error
# Lógica: duckdb.execute(query), si error → vuelve al Nodo 3 (max 3 intentos)

# Nodo 6: Sintetizador
# Input:  resultado tabular + pregunta original
# Output: respuesta en español neutro + figura Plotly si aplica
# Modelo: qwen2.5:32b, temperature=0.3, max_tokens=300
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

Actualiza esta sección al terminar cada archivo.

```
agent/config.py             ✅ done  ← DEMO_COMERCIO_ID, fuente única
agent/semantic_layer.py     ✅ done  ← 10 vistas (incluye gastos_proveedores_mensual), ref 2026-04-18
agent/prompts.py            ✅ done  ← DATASET_END_DATE=2026-04-18, VIEW_SELECTION_GUIDE actualizado
agent/nodes.py              ✅ done  ← Nodos 1+2 fusionados en classify_and_map_node
agent/graph.py              ✅ done
alerts/proactive.py         ✅ done  ← mensaje empático con cifras reales
utils/charts.py             ✅ done
app.py                      ✅ done  ← 5 mensajes bienvenida rotatorios con DuckDB real
data/transacciones.csv      ✅ done  ← 2025-01-01→2026-04-18, 8020 tx, hoy=3 tx mañana
```

*Notas de implementación:* (agrega aquí decisiones no obvias, bugs encontrados, o cambios al schema)
- `agent/semantic_layer.py`: se implementó DuckDB en memoria con `get_connection()`, carga tipada desde `data/transacciones.csv` y las 8 vistas semánticas requeridas. `get_connection()` entrega una conexión fresca para guardarla por sesión en Chainlit; los nodos no deben llamarlo directamente. No se cambió el schema ni se agregó vista de productos. La verificación de ejecución queda pendiente en este entorno local porque falta instalar el paquete Python `duckdb`; `python3 -m compileall agent/semantic_layer.py` sí pasó.
- `agent/prompts.py`: se implementaron prompts declarativos para clasificador, mapeo semántico, generación SQL, validación y síntesis. Se incluyó contexto compacto de las 8 vistas permitidas y una regla explícita para preguntas de productos: no inventar ítems, responder con categorías como alternativa.
- `agent/nodes.py`: se implementaron los 6 nodos async y `AgentState` con la estructura requerida. El ejecutor usa exclusivamente `state["con"]`; ningún nodo crea conexiones DuckDB. El validador bloquea escritura, lectura de `transacciones`/CSV y vistas distintas a la seleccionada.
- `agent/graph.py`: se conectó el grafo LangGraph con el loop de auto-corrección requerido: `executor` llama a `should_retry`; si hay error y `retry_count < 3`, vuelve a `sql_generator`, si no pasa a `synthesizer`. El grafo se compila bajo demanda para no requerir LangGraph al importar el módulo.
- `alerts/proactive.py`: se implementó el monitor async de caída de ventas usando solo la vista `ventas_diarias`. Para la demo histórica, si no se pasa `fecha_referencia`, compara la última fecha disponible del dataset contra la mediana histórica del mismo día de semana; no se agregaron vistas extra como `ventas_hoy` o `mediana_dia_semana`.
- `utils/charts.py`: se implementaron helpers Plotly desacoplados de Chainlit para generar figuras según la vista semántica (`ventas_diarias`, `ventas_periodo`, `categorias_populares`, `patrones_temporales`, proveedores y clientes). `app.py` debe envolver estas figuras con `cl.Plotly` cuando existan.
- `app.py`: se implementó el entry point Chainlit. En `on_chat_start` crea una conexión DuckDB fresca con `get_connection()`, la guarda en `cl.user_session`, inicia la alerta de demo con `intervalo_segundos=10` y `fecha_referencia="2023-09-21"`, y guarda la `Task` en sesión. En `on_message` recupera `con`, llama `run_agent(question, con)`, envía `state["response"]` y adjunta `cl.Plotly` cuando `chart_for_result(..., params=state["params"])` devuelve figura.

---

---

## PENDIENTES — funcionalidades identificadas, no implementadas

### ✅ Consulta secundaria para preguntas compuestas (cliente + qué compra)

**Problema detectado en pruebas:** Cuando el usuario pregunta "¿Quién me visita más y qué compra?",
el agente consulta `frecuencia_clientes` correctamente pero luego dice "no tengo qué compra,
pregúntame por categorías" — sin dar la categoría. La pregunta de clarificación queda incompleta.

**Diseño acordado (opción simple, sin cambiar arquitectura del grafo):**

El `executor_node` detecta `requires_product_disclaimer = True` + ejecución SQL exitosa.
En ese caso corre una **segunda consulta hardcodeada** contra `categorias_populares` y la guarda
en `sql_result_secondary`. El sintetizador recibe ambos resultados y fusiona la respuesta.

**La consulta secundaria es fija (no generada por LLM):**
```python
SECONDARY_SQL_CATEGORIAS = """
SELECT categoria, num_transacciones, ingreso_total, ticket_promedio
FROM categorias_populares
WHERE comercio_id = ?
ORDER BY ingreso_total DESC
LIMIT 3
"""
# Parámetro: state["comercio_id"] (o sin filtro si es None)
```

**Cambios requeridos — exactamente 2 archivos:**

**`agent/nodes.py`:**
1. `AgentState`: añadir `sql_result_secondary: list[dict[str, Any]]` (default `[]`)
2. `executor_node`: al final, si `state["sql_result"]` no está vacío Y `state.get("requires_product_disclaimer")` es True:
   - Ejecutar `SECONDARY_SQL_CATEGORIAS` con `state["comercio_id"]` como parámetro
   - Si `comercio_id` es None, ejecutar sin filtro WHERE
   - Guardar resultado en `state["sql_result_secondary"]`
   - Si falla la consulta secundaria: ignorar el error (no bloquear la respuesta principal)

**`agent/prompts.py`:**
3. `SYNTHESIZER_PROMPT_TEMPLATE`: añadir campo `resultado_secundario` al final del template
4. Añadir regla: "Si `resultado_secundario` tiene datos Y `requires_product_disclaimer` es True,
   úsalos como la respuesta a la pregunta de categorías. Ejemplo de respuesta fusionada:
   'Tu cliente más frecuente es Diego (61 visitas, $1128.24). No tengo el detalle exacto de
   lo que compra, pero en tu tienda lo que más mueve plata es {categoria_top} con ${ingreso_top}.
   Probablemente Diego también elige eso.'"

**`agent/nodes.py` — también actualizar `synthesizer_node`:**
5. Pasar `sql_result_secondary` al template como `resultado_secundario=json.dumps(...)`

**Restricciones importantes:**
- La consulta secundaria NO pasa por `sql_generator` ni `validator` — es código de confianza
- Si `comercio_id` es None, ejecutar: `SELECT categoria... FROM categorias_populares ORDER BY ingreso_total DESC LIMIT 3` (sin WHERE)
- Latencia adicional esperada: <0.1s (DuckDB en memoria, sin LLM)
- `sql_result_secondary` debe estar en `AgentState` con `total=False` para no romper LangGraph

**Caso de prueba para validar:**
- P: "¿Cuál es el cliente que más me visita, y qué es lo que más compra?"
- R esperada: nombre del top cliente + visitas + total gastado + disclaimer honesto + top 3 categorías del comercio como aproximación

---

### ✅ TAREA A — 3 fixes críticos en agent/prompts.py (un solo archivo)

Detectados en pruebas con las 15 preguntas. Solo tocar `agent/prompts.py`.

**Fix 1 — CURRENT_DATE prohibido (rompe P1 "¿cuánto vendí esta semana?" y P4)**

En `SQL_GENERATOR_PROMPT_TEMPLATE`, añadir después de "Devuelve SOLO SQL":
```
- NUNCA uses CURRENT_DATE, NOW() ni funciones de fecha del sistema operativo.
  La fecha de referencia fija del dataset es DATE '2026-04-18'.
  Traduce así:
    "hoy"          → DATE '2026-04-18'
    "esta semana"  → semana que contiene DATE '2026-04-18'
                     → DATE_TRUNC('week', DATE '2026-04-18') = DATE '2026-04-14'
    "este mes"     → DATE_TRUNC('month', DATE '2026-04-18') = DATE '2026-04-01'
    "mes pasado"   → DATE_TRUNC('month', DATE '2026-03-01')
```

**Fix 2 — Clasificador demasiado agresivo con "ambiguous" (rompe P11)**

En `CLASSIFIER_SEMANTIC_PROMPT_TEMPLATE`, en la definición de `ambiguous`, añadir:
```
- EXCEPCIÓN: si la pregunta incluye verbos de acción del comprador
  (compra, comprar, compró, gasta, gastó, paga, pagó, consume), NO es ambiguous
  aunque use "visita" o "vino" — clasificar como en_scope con vista frecuencia_clientes.
  EJEMPLO: "¿quién me visita más y qué compra?" → en_scope, frecuencia_clientes.
  EJEMPLO: "¿quién vino más y cuánto gastó?" → en_scope, frecuencia_clientes.
```

**Fix 3 — Mes sin año (rompe P13 "¿en qué hora vendo más en diciembre?")**

En `SQL_GENERATOR_PROMPT_TEMPLATE`, añadir:
```
- Si la pregunta menciona un mes sin año explícito, deduce el año del dataset:
    mayo–diciembre → siempre 2025 (solo existen en ese año en el dataset)
    enero–abril    → usa 2026 si el contexto sugiere reciente, 2025 si no
  Ejemplo: "diciembre" → DATE '2025-12-01'; "enero pasado" → DATE '2026-01-01'
```

---

### ✅ TAREA B — Historial de conversación (Opción B)

**Problema:** El agente procesa cada mensaje de forma aislada. Cuando el clasificador
devuelve `scope = "ambiguous"` y el usuario responde "Cliente", el siguiente turno
no tiene contexto de cuál era la pregunta original.

**Diseño — 4 archivos:**

**`agent/nodes.py`:**
1. Añadir a `AgentState`:
```python
conversation_history: list[dict[str, str]]
# Formato: [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
# Máximo 6 entradas (3 turnos completos)
```

**`agent/graph.py`:**
2. En `create_initial_state`: añadir `"conversation_history": []`
3. `run_agent` debe aceptar `conversation_history: list[dict] = []` como parámetro
   e inyectarlo al estado inicial.

**`agent/prompts.py`:**
4. En `CLASSIFIER_SEMANTIC_PROMPT_TEMPLATE`, añadir ANTES de "Pregunta: {question}":
```
Historial reciente (últimos turnos — úsalo para entender preguntas de seguimiento):
{conversation_history}
```
5. Añadir regla al clasificador:
```
- Si la pregunta actual es una respuesta corta a una clarificación previa
  (ej. "Cliente", "Proveedor", "sí", "el de clientes"), reconstruye la intención
  combinando el historial con la respuesta actual.
  EJEMPLO: historial muestra "¿quién me visitó más en enero?" → ambiguous →
  "¿Me puedes aclarar si hablamos de cliente o proveedor?" → usuario responde "Cliente"
  → clasificar como en_scope, vista frecuencia_clientes, params.periodo = "2026-01"
```

**`app.py`:**
6. En `on_message`, ANTES de llamar `run_agent`:
   - Recuperar `history = cl.user_session.get("conversation_history", [])`
   - Pasar `history` a `run_agent`
7. DESPUÉS de obtener `state["response"]`:
   - Añadir `{"role": "user", "content": question}` al historial
   - Añadir `{"role": "assistant", "content": state["response"]}` al historial
   - Guardar solo los últimos 6 elementos: `history[-6:]`
   - Actualizar en sesión: `cl.user_session.set("conversation_history", history)`
8. En `on_chat_start`: inicializar `cl.user_session.set("conversation_history", [])`

**Formato del historial en el prompt** (para el template):
```python
# En build_history_str(history: list[dict]) → str:
# Si history vacío → ""
# Si hay entradas → formatear como:
# "Usuario: {content}\nAsistente: {content}\n..."
# Truncar cada mensaje a 200 caracteres para no explotar el contexto
```

**Casos de prueba para validar:**
- P11 → P11.1: "¿quién me visita más y qué compra?" → NO debe ser ambiguous
- P14 → P14.1: "¿quién me visitó más en enero?" → ambiguous → usuario: "de proveedores" → debe responder con datos de gastos_proveedores_mensual para enero
- P14 → P14.2: misma pregunta → usuario: "de clientes" → frecuencia_clientes (nota: no hay filtro por mes en esta vista — responder con todos los clientes y nota aclaratoria)

**IMPORTANTE:** La Tarea A debe completarse y validarse antes de empezar la Tarea B.

---

### ✅ Pregunta de clarificación para casos ambiguos

**Problema:** El clasificador falla cuando la pregunta puede referirse a un cliente o a un
proveedor (ej. "¿quién me visitó más en enero?"). Actualmente elige una vista y puede
alucinár resultados incorrectos.

**Diseño acordado:**
- Añadir `scope = "ambiguous"` al Nodo 1 como tercer valor (junto a `"en_scope"` / `"fuera_scope"`)
- El grafo LangGraph hace bypass al Nodo 6 directamente sin ejecutar SQL
- El Nodo 6 devuelve: *"¿Me puedes aclarar si hablamos de un cliente que te compra, o de un proveedor que te surte?"*
- En el siguiente turno el usuario responde, y el flujo reinicia con intención clara

**Archivos a modificar:**
1. `agent/nodes.py` — `classify_and_map_node`: rama `scope = "ambiguous"` con prompt actualizado
2. `agent/graph.py` — edge condicional: `scope == "ambiguous"` → `synthesizer` (bypass SQL)
3. `agent/prompts.py` — ejemplos de casos ambiguos en `CLASSIFIER_SEMANTIC_PROMPT_TEMPLATE`
4. `agent/prompts.py` — plantilla de pregunta de aclaración en `SYNTHESIZER_PROMPT_TEMPLATE`
5. `app.py` — detectar `state["scope"] == "ambiguous"` y no disparar alerta en ese turno

**Casos de prueba:**
- "¿Quién me visitó más en enero?" → debe devolver pregunta de clarificación
- "el de la Pilsener vino esta semana?" → NO ambiguo, alias conocido → `patrones_compra_proveedor`
- "¿Cuánto me compró Juan?" → NO ambiguo → `frecuencia_clientes`

---

*Última actualización: Interact2Hack 2026 — Equipo USFQ*
