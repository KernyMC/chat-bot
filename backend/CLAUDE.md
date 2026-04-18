# CLAUDE.md — Mi Contador de Bolsillo
## Interact2Hack 2026 · Reto IA Deuna · USFQ

---

## Contexto del proyecto

Estamos construyendo **"Mi Contador de Bolsillo"**, un agente conversacional de negocio para micro-comerciantes ecuatorianos que usan Deuna como medio de cobro. El usuario objetivo **no tiene formación financiera** y toma decisiones por intuición. El agente debe responder en lenguaje natural, empático, en español neutro, en menos de 5 segundos.

Esto es un hackathon. Priorizamos que funcione en la demo sobre que sea perfecto en producción.

---

## Decisión estratégica de diseño (validada con mentor Deuna)

**Modelamos el peor escenario real**: el tendero ecuatoriano promedio NO lleva registro
de lo que vende. Cuando el vecino paga $12.50 por queso + jamón + leche, Deuna solo captura
el monto total, la hora, y quién pagó. Sin productos, sin ítems.

**El diferenciante**: nuestro agente funciona con los datos que Deuna YA tiene de cualquier
comerciante desde el primer cobro. Cero configuración, cero catálogo. Los insights vienen
del patrón de pagos: hora pico, día pico, frecuencia de clientes, flujo vs. egresos a
proveedores, qué día del mes suele comprar al distribuidor.

---

## Stack técnico definido

| Componente | Tecnología | Notas |
|---|---|---|
| LLM | `qwen2.5:32b` via Ollama | Servido en HPC CEDIA (A100-SXM4-40GB), expuesto vía túnel SSH a localhost |
| API LLM | `http://localhost:11434/v1` | OpenAI-compatible, api_key="ollama" — el HPC solo sirve el modelo, todo lo demás corre local |
| Motor SQL | DuckDB en memoria | Lee CSV directamente, sin imports |
| Orquestación | LangGraph | 6 nodos + loop auto-corrección |
| Capa semántica | Vistas DuckDB pre-calculadas | CRÍTICO: nunca exponer CSV crudo al LLM |
| UI | Chainlit | Async nativo, Plotly inline |
| Visualizaciones | Plotly via `cl.Plotly` | Inline en el chat |
| Alertas | asyncio background task | Hilo paralelo, siempre activo |
| Dataset | CSV sintético Deuna | 3 comercios, 2025-01-01→2026-04-18, ~8000 transacciones, sin ítems |

---

## Arquitectura de los 6 nodos LangGraph

```
Nodo 1: Clasificador     → ¿La pregunta usa datos del dataset? Sí/No
Nodo 2: Semántico        → Mapea intención a vista DuckDB correcta
Nodo 3: Generador SQL    → Qwen genera SQL contra la vista
Nodo 4: Validador        → Chequea sintaxis antes de ejecutar
Nodo 5: Ejecutor         → DuckDB ejecuta, si falla vuelve al Nodo 3
Nodo 6: Sintetizador     → Qwen traduce resultado a español neutro + Plotly si aplica
```

---

## Comportamiento definido para casos borde

- **`comercio_id` no especificado**: el SQL no filtra por comercio — agrega los 3 juntos. No preguntar al usuario.
- **Pregunta de producto**: responder con `categorias_populares` + disclaimer honesto. No inventar ítems.
- **Resultado SQL vacío**: decir explícitamente que no hay datos en ese período. No estimar ni proyectar.

---

## Reglas de negocio inamovibles (guardarraíles)

Estas reglas DEBEN estar en el system prompt y en la lógica del Nodo 1:

1. **Dominio restringido**: Si la pregunta no está en el dataset sintético, responder "No tengo ese dato en tu información". Nunca inventar, nunca consultar fuentes externas.
2. **Solo datos retornados por DuckDB**: Todas las cifras deben venir del resultado SQL. El LLM no puede hacer aritmética propia.
3. **Conjunto vacío = decirlo claramente**: Si DuckDB devuelve vacío, decir que no hay transacciones en ese periodo. Nunca proyectar ni estimar.

---

## Vistas semánticas requeridas (9 vistas)

```sql
-- ventas_diarias              → total + ticket promedio por día (solo Ingresos)
-- ventas_periodo              → por semana y mes (solo Ingresos)
-- frecuencia_clientes         → visitas + total gastado + días sin volver (ref: 2026-04-18)
-- categorias_populares        → ranking por categoría: Bebidas, Snacks, Lácteos, etc.
-- clientes_perdidos           → días_sin_volver > 30
-- patrones_temporales         → hora + día semana → horas pico (año completo)
-- patrones_temporales_mensual → horas pico EN UN MES CONCRETO (cuando mencionan enero, diciembre, etc.)
-- gastos_proveedores          → gasto total por proveedor (Egresos Pago a Proveedor)
-- patrones_compra_proveedor   → qué día del mes/semana se compra al distribuidor
```

El LLM **nunca** debe escribir SQL contra la tabla cruda. Solo contra estas vistas.
No existe vista de "productos" — el dataset no tiene ítems individuales (escenario real Deuna).

---

## Tono y lenguaje del agente

- Español neutro, comprensible para adulto sin formación financiera
- Empático, como un asesor de confianza del barrio
- Sin jerga financiera: nada de EBITDA, KPI, churn rate, ROI
- Traducir conceptos: "lo que te quedó en el bolsillo" en vez de "utilidad operativa"
- Entender modismos ecuatorianos: "yapa", "fiado", "tendero"
- Respuestas cortas y accionables

---

## Constraint crítico de performance

- Tiempo máximo de respuesta: **5 segundos**
- Temperature del LLM: **0** (determinístico para SQL)
- max_tokens generación SQL: 512
- max_tokens síntesis respuesta: 300
- Usar vistas pre-calculadas, nunca JOINs complejos en tiempo real

---

## Lo que NO hacer

- No usar RAG ni embeddings para datos tabulares
- No hacer dos llamadas LLM separadas para SQL y síntesis si se puede evitar
- No exponer el schema crudo al LLM en cada llamada (usar capa semántica)
- No usar Streamlit (usa Chainlit)
- No bloquear el hilo principal con la alerta proactiva
- No guardar ni loggear datos de usuarios reales (aunque sean sintéticos, buena práctica)

---

## PENDIENTES — mejoras identificadas, no implementadas aún

### ⏳ Pregunta de clarificación para casos ambiguos

**Problema detectado en pruebas:** Cuando el tendero usa una frase que puede referirse tanto
a un cliente como a un proveedor (ej. "el de la Pilsener", "el que me visita los martes"),
el clasificador elige una vista y puede alucinár en la otra dirección.

**Solución diseñada (pendiente de implementar):**
- Añadir `scope = "ambiguous"` como tercer valor posible en el Nodo 1 (además de `"en_scope"` y `"fuera_scope"`)
- Cuando `scope == "ambiguous"`, el grafo LangGraph hace bypass directo al Nodo 6 (Sintetizador)
  sin pasar por los nodos SQL
- El Sintetizador devuelve una pregunta de clarificación al usuario, por ejemplo:
  > "¿Me puedes aclarar si hablamos de un cliente que te compra, o de un proveedor que te surte?"
- Una vez el usuario responde, se reinicia el flujo con `scope = "en_scope"` y la intención clara

**Cambios requeridos cuando se implemente:**
1. `agent/nodes.py` — `classify_and_map_node`: añadir rama `scope = "ambiguous"` con ejemplos en el prompt
2. `agent/graph.py` — añadir edge condicional: si `scope == "ambiguous"` → `synthesizer` directamente
3. `agent/prompts.py` — `CLASSIFIER_SEMANTIC_PROMPT_TEMPLATE`: ejemplos de casos ambiguos
4. `agent/prompts.py` — `SYNTHESIZER_PROMPT_TEMPLATE`: plantilla de pregunta de clarificación
5. `app.py` — `on_message`: detectar si `state["scope"] == "ambiguous"` y NO iniciar la alerta proactiva en ese turno

**Casos de prueba para validar:**
- "¿Quién me visitó más en enero?" → ambiguo (cliente o proveedor?)
- "el de la Pilsener vino esta semana?" → debería resolver a proveedor (alias conocido), NO ambiguo
- "¿Cuánto me compró Juan?" → debería resolver a cliente sin ambigüedad

---

## Comandos útiles

```bash
# Verificar que Ollama ve la GPU
ollama run qwen2.5:32b "hola"

# Levantar servidor Ollama
ollama serve

# Correr la app
chainlit run app.py

# Verificar DuckDB con el CSV
python -c "import duckdb; duckdb.sql('SELECT COUNT(*) FROM read_csv_auto(\"data/transacciones.csv\")')"
```

---

## Archivos del proyecto

```
mi-contador/
├── CLAUDE.md              ← este archivo
├── AGENTS.md              ← instrucciones para otros modelos
├── app.py                 ← Chainlit entry point + mensajes bienvenida rotatorios
├── agent/
│   ├── config.py          ← DEMO_COMERCIO_ID (fuente única — cambiar aquí para la demo)
│   ├── graph.py           ← LangGraph con los 6 nodos (Nodos 1+2 fusionados)
│   ├── nodes.py           ← lógica de cada nodo
│   ├── semantic_layer.py  ← 9 vistas DuckDB, ref fecha 2026-04-18
│   └── prompts.py         ← system prompt + templates
├── data/
│   └── transacciones.csv  ← 2025-01-01→2026-04-18, 8020 tx, sin ítems
├── scripts/
│   └── generar_dataset.py ← regenera el CSV (seed=42, reproducible)
├── alerts/
│   └── proactive.py       ← asyncio background task
└── utils/
    └── charts.py          ← helpers Plotly
```

---

## Parámetros críticos para la demo

```python
# Alerta proactiva — usar estos valores en la demo, NO los defaults
intervalo_segundos = 10          # default 300, bajar a 10 para que dispare en vivo
fecha_referencia   = "2026-04-18"  # fecha de corte del dataset = hoy, día parcial → caída 88% garantizada
```

El dataset corta el 2026-04-18 con solo 3 transacciones de la mañana (vs mediana histórica de sábados ~$95).
La caída es -88%, la alerta siempre dispara en la demo sin configuración adicional.

## Mensajes de bienvenida rotatorios (on_chat_start)

Al abrir el chat, `app.py` consulta DuckDB directamente y elige al azar uno de 5 mensajes accionables:
- **ventas_hoy**: cuánto lleva el comercio hoy (parcial del sábado)
- **top_cliente**: quién es el cliente más fiel y cuándo fue la última visita
- **clientes_perdidos**: cuántos clientes no han vuelto en >30 días
- **semana**: comparación esta semana vs semana pasada con % de cambio
- **top_categoria**: la categoría que más ingresos genera

Estos mensajes simulan trazabilidad en tiempo real: como si los datos bancarios llegaran continuamente y el agente ya los estuviera monitoreando.

---

## Contexto de adopción (investigación validada — alimenta el pitch)

**El problema real de adopción** (investigado con Consensus + web):
- 85% de microempresarios en Ecuador ya usa billeteras digitales (2025), pero la literacidad
  digital no modera los resultados financieros — adoptan sin entender.
- Deuna tiene ~450,000 comercios afiliados y 4M+ usuarios, pero el merchant lo usa como
  *reducción de fraude*, no como *herramienta de gestión*. Adopción supply-driven.
- Barreras documentadas al chatbot financiero: miedo a visibilidad fiscal (cuaderno es opaco),
  preferencia por liquidez en efectivo, desconfianza en plataformas externas.

**Por qué el agente ambiental supera estas barreras**:
- Nudges proactivos reducen tasas de default >50% en plataformas financieras.
- El efecto es mayor en usuarios de baja literacidad (no requieren comprensión, solo reacción).
- WhatsApp chatbots funcionan en Nigeria/Zimbabwe por el canal de confianza preexistente,
  no por el chatbot en sí — Deuna YA es ese canal de confianza para el tendero.

**Reencuadre del pitch** (NO "asesor financiero", SÍ "motor de notificaciones"):
> "No le pedimos al tendero que confíe en un chatbot. Le mandamos un mensaje cuando
> algo va mal — hoy llevas $11, normalmente cierras en $95. Él responde con la intuición
> que ya tiene. Solo le ponemos los números en la mano."

**Argumento de negocio para Deuna (datos Gemini, validados):**
- Retener un comercio cuesta **5-25x menos** que adquirir uno nuevo en pagos digitales LatAm
- Mejorar retención 5% → ganancias +25-95%
- **Caso PayPal**: usaron analytics de historial de pagos para predecir churn y enviar alertas proactivas → validación directa del modelo que construimos
- Data lock-in: el tendero con 15 meses de historial en Deuna no migra a PayPhone/Kushki porque perdería sus insights
- Wallets digitales solo tienen el **6% del e-commerce ecuatoriano** (tarjetas 74%) → huge upside si Deuna aumenta stickiness de comercios

---

## Criterios de éxito del jurado (no perder de vista)

- [ ] 80% de precisión en 15 preguntas de prueba
- [ ] Tiempo de respuesta < 5 segundos
- [ ] Respuestas comprensibles sin explicación adicional
- [ ] Al menos 1 alerta proactiva funcionando en demo
- [ ] Visualizaciones inline cuando aplican
