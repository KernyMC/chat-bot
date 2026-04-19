# Mi Contador de Bolsillo

**Interact2Hack 2026 · Reto IA Deuna · USFQ**

Agente conversacional de negocio para micro-comerciantes ecuatorianos que usan Deuna como medio de cobro. Responde preguntas sobre ventas, patrones, proveedores y salud financiera en lenguaje natural, en menos de 5 segundos, sin que el comerciante necesite formación contable.

---

## Stack

| Capa | Tecnología |
|---|---|
| LLM | Llama 3.3 70B vía Groq (`~3s`, open source) |
| Orquestación | LangGraph — 6 nodos + autocorrección SQL |
| Motor SQL | DuckDB en memoria sobre CSV sintético |
| Backend REST | FastAPI (`/chat`, `/health`, `/suggestions`, `/welcome`) |
| Frontend | React + TypeScript + Vite + Recharts |
| Alertas proactivas | asyncio background task — caída ventas + DeUna Negocios |

---

## Estructura

```
mi-contador/
├── agent/
│   ├── config.py           # LLM y comercio de demo
│   ├── graph.py            # Grafo LangGraph
│   ├── nodes.py            # 6 nodos + detección de prompt injection
│   ├── prompts.py          # System prompt, templates, productos DeUna
│   └── semantic_layer.py   # 8 vistas DuckDB (capa semántica)
├── alerts/
│   └── proactive.py        # Alertas async: caída ventas, DeUna Negocios tarjeta
├── data/
│   └── transacciones.csv   # 13,399 tx · 3 comercios · 2025-01-01→2026-04-18
├── front-end/              # React app (puerto 5173)
├── tests/
│   ├── preguntas_benchmark.py      # 15 preguntas · umbral 80%
│   └── preguntas_adversariales.py  # 10 casos borde e injection
├── utils/
│   └── charts.py           # Helpers Plotly → Recharts
├── api.py                  # FastAPI entry point (puerto 8001)
├── app.py                  # Chainlit entry point (alternativo)
└── requirements.txt
```

---

## Instalación y ejecución

### 1. Backend Python

```bash
# Requisitos: Python 3.11+
pip install -r requirements.txt

# Variables de entorno
cp .env.example .env
# Editar .env con tu GROQ_API_KEY

# Levantar API
uvicorn api:app --port 8001
```

### 2. Frontend React

```bash
cd front-end
npm install

# Configurar backend
cp .env.example .env
# Asegurar que diga: VITE_CHAT_PROVIDER=backend

npm run dev   # → http://localhost:5173
```

### 3. Benchmarking

Con la API corriendo en puerto 8001:

```bash
python tests/preguntas_benchmark.py
python tests/preguntas_adversariales.py
```

---

## Comercios demo

| ID | Negocio | Ticket promedio | Pico |
|---|---|---|---|
| COM-001 | Tienda Don Aurelio | $17.86 | Sábado |
| COM-002 | Fonda Don Jorge | $3.44 | Lun–Vie 12–2pm |
| COM-003 | Salón Belleza Total | $25.42 | Viernes–Sábado |

---

## Alertas proactivas (demo)

Para disparar las alertas en vivo, en `app.py` o al llamar `iniciar_monitor_ventas`:

```python
intervalo_segundos = 10          # 300 en producción
fecha_referencia   = "2026-04-18"  # día parcial → caída garantizada
```

Secuencia en demo:
- **t=10s** — 💡 Caída de ventas (−88% vs histórico sábados)
- **t=20s** — 💳 DeUna Negocios: cobro con tarjeta desde el celular

---

## Decisiones de arquitectura

- **Text-to-SQL sobre RAG**: el dataset es tabular. DuckDB ejecuta SQL analítico en memoria en milisegundos.
- **Capa semántica**: el LLM nunca ve el schema crudo — solo 8 vistas nombradas con semántica de negocio. Esto eleva la precisión de ~21% (raw SQL) a >80%.
- **LangGraph sobre CrewAI**: loop determinístico Genera→Valida→Autocorrige. CrewAI introduce overhead multi-agente que rompe el constraint de 5 segundos.
- **Privacidad por diseño**: el agente no expone perfiles individuales de clientes (LOPDP Ecuador). Todos los insights son datos agregados.
- **Prompt injection**: detección pre-LLM con 30+ patrones, respuesta fija sin pasar por el modelo.

---

## Criterios del jurado

- [x] ≥80% de precisión en 15 preguntas de prueba
- [x] Tiempo de respuesta <5 segundos (Groq ~3s)
- [x] Respuestas comprensibles sin explicación adicional
- [x] Al menos 1 alerta proactiva en demo (son 2)
- [x] Visualizaciones inline (Recharts)
- [x] Feature diferenciador: Mi salud financiera (5 métricas sin LLM, instantáneo)

---

## Equipo

Interact2Hack 2026 · USFQ · Quito, Ecuador
