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
| Dataset | CSV sintético Deuna | 3 comercios, 2025-01-01→2026-04-18, 13,399 transacciones, sin ítems |
| Perfiles de comercio | Chainlit Chat Profiles | 3 perfiles seleccionables: Tienda Don Aurelio, Fonda Don Jorge, Salón Belleza Total |

---

## Arquitectura de los nodos LangGraph

Nodos 1+2 están fusionados en un solo nodo (`classify_and_map_node`) para reducir latencia.

```
Nodo 1+2: Clasificador+Semántico → scope (en_scope | en_scope_financiero | ambiguous | fuera_scope)
                                    + vista DuckDB + parámetros
Nodo 3:   Generador SQL          → Qwen genera SQL contra la vista
Nodo 4:   Validador              → Chequeo estático antes de ejecutar
Nodo 5:   Ejecutor               → DuckDB ejecuta, si falla vuelve al Nodo 3 (hasta 3 reintentos)
Nodo 6a:  Sintetizador           → Qwen traduce resultado a español neutro + Plotly si aplica
Nodo 6b:  Asesor Financiero      → Solo para en_scope_financiero: combina datos reales de ventas
                                    con producto DeUna × Banco Pichincha personalizado por comercio
```

Routing especial:
- `ambiguous` → bypass directo a Sintetizador (devuelve pregunta de clarificación)
- `fuera_scope` → bypass directo a Sintetizador (devuelve "No tengo ese dato")
- `en_scope_financiero` → SQL contra ventas_periodo → Asesor Financiero → END
- `en_scope` → flujo normal → Sintetizador → END

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

## Vistas semánticas implementadas (11 vistas)

```sql
-- ventas_diarias              → total + ticket promedio por día (solo Ingresos)
-- ventas_periodo              → por semana y mes (solo Ingresos)
-- frecuencia_clientes         → visitas + total gastado + días sin volver (ref: 2026-04-18)
-- frecuencia_clientes_mensual → visitas por cliente filtrable por mes o año concreto
-- categorias_populares        → ranking por categoría: Bebidas, Snacks, Lácteos, etc.
-- clientes_perdidos           → días_sin_volver > 30
-- patrones_temporales         → hora + día semana → horas pico (año completo)
-- patrones_temporales_mensual → horas pico EN UN MES CONCRETO (cuando mencionan enero, diciembre, etc.)
-- gastos_proveedores          → gasto total por proveedor (Egresos Pago a Proveedor)
-- gastos_proveedores_mensual  → gasto por proveedor filtrable por mes concreto
-- patrones_compra_proveedor   → qué día del mes/semana se compra al distribuidor
```

El LLM **nunca** debe escribir SQL contra la tabla cruda. Solo contra estas vistas.
No existe vista de "productos" — el dataset no tiene ítems individuales (escenario real Deuna).

Override determinístico en `classify_and_map_node` (independiente del LLM):
- `frecuencia_clientes` + año/mes en pregunta → redirige a `frecuencia_clientes_mensual`
- `gastos_proveedores` + año/mes en pregunta → redirige a `gastos_proveedores_mensual`
- Palabras clave financieras → fuerza `en_scope_financiero` aunque LLM diga `fuera_scope`

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

## Estado de implementación

### ✅ Implementado y funcional

| Feature | Descripción |
|---|---|
| Historial de conversación | `conversation_history` en AgentState, últimos 3 turnos inyectados al clasificador |
| Pregunta de clarificación | `scope="ambiguous"` con bypass directo a sintetizador |
| Selección de comercio | Chainlit Chat Profiles → `default_comercio_id` propagado por todo el grafo |
| Dataset con personalidades | 13,399 tx, 3 perfiles diferenciados (tienda / fonda / salón) |
| Vista frecuencia_clientes_mensual | Clientes filtrables por mes o año concreto |
| Vista gastos_proveedores_mensual | Proveedores filtrables por mes concreto |
| Overrides determinísticos | Python fuerza redirección de vistas cuando LLM falla |
| Rama financiera en el grafo | `en_scope_financiero` → `financial_advisor_node` con datos reales + producto DeUna |
| Alertas proactivas (2 ticks) | Tick 1: caída de ventas; Tick 2: calificación para Microcrédito Digital Banco Pichincha |
| Gráficos Plotly inline | Eje categorical forzado, labels en español, mapeo vista→chart |

### 🚫 Descartado para el pitch

| Feature | Razón |
|---|---|
| Supermemory API (persistencia entre sesiones) | Latencia extra, privacidad, jurado no lo verá. Mencionar como roadmap de producción. |

### ⏳ Pendiente

| Feature | Prioridad | Notas |
|---|---|---|
| 15 preguntas de prueba con dataset nuevo | Alta — criterio del jurado | Validar precisión ≥80% antes del pitch |
| Benchmarking de modelos (Qwen vs alternativas) | Media | Necesita acceso HPC CEDIA; no bloquea demo |

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
├── Productos.md           ← productos financieros Banco Pichincha / DeUna investigados (2025-2026)
├── app.py                 ← Chainlit entry point + chat profiles + bienvenidas rotatorias
├── agent/
│   ├── config.py          ← DEMO_COMERCIO_ID (fuente única — cambiar aquí para la demo)
│   ├── graph.py           ← LangGraph: 7 nodos (1+2 fusionados + financial_advisor)
│   ├── nodes.py           ← lógica de cada nodo + financial_advisor_node
│   ├── semantic_layer.py  ← 11 vistas DuckDB, ref fecha 2026-04-18
│   └── prompts.py         ← system prompt + templates + DEUNA_PRODUCTOS
├── data/
│   └── transacciones.csv  ← 2025-01-01→2026-04-18, 13399 tx, 3 comercios, sin ítems
├── scripts/
│   └── generar_dataset.py ← regenera el CSV (seed=42, reproducible, COMERCIO_CONFIG por perfil)
├── alerts/
│   └── proactive.py       ← asyncio: tick1=caída ventas, tick2=calificación crédito DeUna
└── utils/
    └── charts.py          ← helpers Plotly con eje categorical + labels español
```

---

## Parámetros críticos para la demo

```python
# Alerta proactiva — usar estos valores en la demo, NO los defaults
intervalo_segundos = 10          # default 300, bajar a 10 para que dispare en vivo
fecha_referencia   = "2026-04-18"  # fecha de corte del dataset = hoy, día parcial → caída 88% garantizada
```

El dataset corta el 2026-04-18 con solo 3 transacciones de la mañana (vs mediana histórica de sábados).
La caída es ~-88%, la alerta siempre dispara en la demo sin configuración adicional.

Los 3 comercios tienen **16 meses exactos** de historial (ene 2025 → abr 2026) → siempre califican para la alerta de crédito (tick 2).

**Secuencia garantizada en demo (intervalo=10s):**
1. **t=0s** — Bienvenida rotatorea con datos reales del comercio seleccionado
2. **t=10s** — 💡 Alerta de caída de ventas (-88% vs histórico sábados)
3. **t=20s** — 🏦 Alerta de calificación: "Llevas 16 meses de cobros — ya tienes más historial digital que muchos negocios que llegan al banco con carpetas. Te abre la puerta al Crédito para Negocio y Emprendedores de Banco Pichincha."

## Mensajes de bienvenida rotatorios (on_chat_start)

Al abrir el chat, `app.py` consulta DuckDB directamente (usando el comercio del perfil activo) y elige al azar uno de 5 mensajes accionables:
- **ventas_hoy**: cuánto lleva el comercio hoy (parcial del sábado)
- **top_cliente**: quién es el cliente más fiel y cuándo fue la última visita
- **clientes_perdidos**: cuántos clientes no han vuelto en >30 días
- **semana**: comparación esta semana vs semana pasada
- **top_categoria**: la categoría que más ingresos genera

Estos mensajes simulan trazabilidad en tiempo real: como si los datos bancarios llegaran continuamente y el agente ya los estuviera monitoreando.

---

## Contexto de adopción (investigación validada — alimenta el pitch)

**El problema real de adopción** (investigado con Consensus + web):
- 85% de microempresarios en Ecuador ya usa billeteras digitales (2025), pero la literacidad
  digital no modera los resultados financieros — adoptan sin entender.
- Deuna tiene ~620,000 comercios afiliados y 6M+ usuarios (datos 2025), pero el merchant lo usa como
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

- [ ] 80% de precisión en 15 preguntas de prueba ← **PENDIENTE ejecutar**
- [ ] Tiempo de respuesta < 5 segundos
- [ ] Respuestas comprensibles sin explicación adicional
- [x] Al menos 1 alerta proactiva funcionando en demo (ahora son 2: caída + crédito)
- [ ] Visualizaciones inline cuando aplican

## Argumento diferenciador para el pitch (validado con fuentes reales)

> "Tu historial de cobros en DeUna ES tu historial crediticio. Banco Pichincha tiene el primer microcrédito 100% digital de la región — sin ir a agencia, en minutos desde el celular. Nosotros detectamos cuándo ya calificas y te avisamos. Tú solo tocas el link."

Fuentes verificadas:
- DeUna declaró oficialmente que su uso "construye historial crediticio facilitando acceso a crédito" (El Universo, 2025)
- Banco Pichincha ganó premio Qorus/Accenture a la innovación por su microcrédito digital
- Banco Pichincha otorga >50% de los microcréditos del sector bancario en Ecuador
- **Producto correcto para los 3 comercios**: "Crédito para Negocio y Emprendedores — Microempresas" ($500–$20,000, hasta 48 meses, 100% digital). "Impulsa tu negocio" y "Crédito Mujer" requieren ingresos >$100k/año — ninguno de los 3 comercios califica.
