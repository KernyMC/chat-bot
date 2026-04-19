"""
Benchmark de 15 preguntas — Mi Contador de Bolsillo
Ejecutar con la API activa: uvicorn api:app --port 8001
Uso: python tests/preguntas_benchmark.py
"""

import asyncio
import os
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:8001")
COMERCIO_ID = os.getenv("BENCHMARK_COMERCIO_ID", "COM-001")

# ── 15 preguntas con criterios de validación ──────────────────────────────────
# cada pregunta tiene:
#   "q"        → texto de la pregunta
#   "must"     → palabras/frases que DEBEN aparecer en la respuesta (lowercase)
#   "must_not" → palabras que NO deben aparecer (alucinaciones conocidas)
#   "scope"    → scope esperado del agente

PREGUNTAS = [
    {
        "id": 1,
        "categoria": "ventas_diarias",
        "q": "¿Cuánto vendí el viernes 11 de abril de 2026?",
        "must": ["$", "abril"],
        "must_not": ["no tengo", "no puedo"],
        "scope": "en_scope",
    },
    {
        "id": 2,
        "categoria": "ventas_periodo",
        "q": "¿Cuánto vendí esta semana?",
        "must": ["$", "semana"],
        "must_not": ["no tengo", "no puedo"],
        "scope": "en_scope",
    },
    {
        "id": 3,
        "categoria": "ventas_periodo",
        "q": "¿Cuánto vendí el mes pasado?",
        "must": ["$", "marzo"],
        "must_not": ["no tengo", "no puedo"],
        "scope": "en_scope",
    },
    {
        "id": 4,
        "categoria": "ventas_periodo_mensual",
        "q": "¿Cuánto vendí en febrero de 2026?",
        "must": ["$", "febrero"],
        "must_not": ["no tengo", "no puedo"],
        "scope": "en_scope",
    },
    {
        "id": 5,
        "categoria": "ventas_periodo_comparacion",
        "q": "¿Cuánto vendí en promedio por semana este año?",
        "must": ["$", "semana"],
        "must_not": ["no tengo", "no puedo"],
        "scope": "en_scope",
    },
    {
        "id": 6,
        "categoria": "ventas_mejor_mes",
        "q": "¿En qué mes de 2025 tuve más ventas?",
        "must": ["$", "2025"],
        "must_not": ["no tengo", "no puedo"],
        "scope": "en_scope",
    },
    {
        "id": 7,
        "categoria": "ventas_comparacion_semanas",
        "q": "¿Cuánto vendí esta semana comparado con la semana pasada?",
        "must": ["$", "semana"],
        "must_not": ["no tengo", "no puedo"],
        "scope": "en_scope",
    },
    {
        "id": 8,
        "categoria": "patrones_temporales",
        "q": "¿Cuál es mi hora pico de ventas?",
        "must": ["hora", ":"],
        "must_not": ["no tengo", "no puedo"],
        "scope": "en_scope",
    },
    {
        "id": 9,
        "categoria": "patrones_temporales",
        "q": "¿Qué día de la semana vendo más?",
        "must": ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"],
        "must_not": ["no tengo", "no puedo"],
        "scope": "en_scope",
        "must_any": True,  # basta con que aparezca cualquiera
    },
    {
        "id": 10,
        "categoria": "categorias_populares",
        "q": "¿Qué categoría me genera más ingresos?",
        "must": ["$"],
        "must_not": ["no tengo", "no puedo"],
        "scope": "en_scope",
    },
    {
        "id": 11,
        "categoria": "gastos_proveedores",
        "q": "¿Cuánto le pagué a Cervecería Nacional en total?",
        "must": ["$", "cervecería"],
        "must_not": ["no tengo", "no puedo"],
        "scope": "en_scope",
    },
    {
        "id": 12,
        "categoria": "gastos_proveedores",
        "q": "¿A qué proveedor le pago más dinero?",
        "must": ["$", "proveedor"],
        "must_not": ["no tengo", "no puedo"],
        "scope": "en_scope",
    },
    {
        "id": 13,
        "categoria": "en_scope_financiero",
        "q": "¿Puedo acceder a un crédito con mi historial de DeUna?",
        "must": ["banco pichincha", "crédito", "meses"],
        "must_not": ["no tengo", "no puedo", "no sé"],
        "scope": "en_scope_financiero",
    },
    {
        "id": 14,
        "categoria": "fuera_scope",
        "q": "¿Cuál es el precio del dólar hoy?",
        "must": ["no tengo", "dato"],
        "must_not": ["$1", "cotización"],
        "scope": "fuera_scope",
    },
    {
        "id": 15,
        "categoria": "gastos_proveedores_mensual",
        "q": "¿Cuánto le pagué a mis proveedores en total en marzo de 2026?",
        "must": ["$", "marzo"],
        "must_not": ["no tengo", "no puedo"],
        "scope": "en_scope",
    },
]


def evaluar(pregunta: dict, respuesta: str, scope_real: str, latencia: float) -> dict:
    resp_lower = respuesta.lower()  # chequea respuesta COMPLETA, no preview

    if pregunta.get("must_any"):
        ok_must = any(kw in resp_lower for kw in pregunta["must"])
    else:
        ok_must = all(kw.lower() in resp_lower for kw in pregunta["must"])

    ok_must_not = not any(kw.lower() in resp_lower for kw in pregunta.get("must_not", []))
    ok_scope = scope_real == pregunta["scope"] or pregunta["scope"] == "en_scope"
    ok_latencia_demo = latencia < 5.0   # criterio demo (Groq)
    ok_latencia_hpc  = latencia < 30.0  # criterio HPC realista

    acierto = ok_must and ok_must_not  # contenido correcto (independiente de latencia)

    return {
        "id": pregunta["id"],
        "categoria": pregunta["categoria"],
        "pregunta": pregunta["q"],
        "acierto": acierto,
        "latencia": round(latencia, 2),
        "ok_latencia_demo": ok_latencia_demo,
        "ok_latencia_hpc": ok_latencia_hpc,
        "scope_esperado": pregunta["scope"],
        "scope_real": scope_real,
        "ok_must": ok_must,
        "ok_must_not": ok_must_not,
        "respuesta_preview": respuesta[:120].replace("\n", " "),
    }


async def run_benchmark():
    print(f"\n{'='*60}")
    print("BENCHMARK — Mi Contador de Bolsillo")
    print(f"Comercio: {COMERCIO_ID} | API: {API_URL}")
    print(f"{'='*60}\n")

    resultados = []

    async with httpx.AsyncClient(timeout=45) as client:
        for p in PREGUNTAS:
            # reset conversation history between questions para benchmarking limpio
            await client.post(f"{API_URL}/reset")
            print(f"[{p['id']:02d}] {p['q'][:55]}...", end=" ", flush=True)
            try:
                t0 = time.time()
                r = await client.post(
                    f"{API_URL}/chat",
                    json={"message": p["q"], "comercio_id": COMERCIO_ID},
                )
                latencia = time.time() - t0
                data = r.json()
                respuesta = data.get("response", "")
                scope = data.get("scope", "")
                resultado = evaluar(p, respuesta, scope, latencia)
                resultados.append(resultado)
                lat_icon = "⚡" if resultado["ok_latencia_demo"] else ("🟡" if resultado["ok_latencia_hpc"] else "🐢")
                estado = "✅" if resultado["acierto"] else "❌"
                print(f"{estado}{lat_icon} {latencia:.1f}s")
                if not resultado["acierto"]:
                    print(f"       must_ok={resultado['ok_must']} must_not_ok={resultado['ok_must_not']}")
                    print(f"       preview: {resultado['respuesta_preview']}")
            except Exception as e:
                print(f"💥 ERROR: {e}")
                resultados.append({"id": p["id"], "acierto": False, "error": str(e)})

    # Resumen
    aciertos = sum(1 for r in resultados if r.get("acierto"))
    total = len(resultados)
    pct = aciertos / total * 100
    latencias = [r["latencia"] for r in resultados if "latencia" in r]
    avg_lat = sum(latencias) / len(latencias) if latencias else 0
    rapidas_demo = sum(1 for r in resultados if r.get("ok_latencia_demo"))
    rapidas_hpc  = sum(1 for r in resultados if r.get("ok_latencia_hpc"))

    print(f"\n{'='*60}")
    print(f"PRECISIÓN (contenido): {aciertos}/{total} ({pct:.0f}%) — umbral jurado: 80%")
    print(f"{'✅ APROBADO' if pct >= 80 else '❌ REPROBADO'}")
    print(f"")
    print(f"LATENCIA: promedio {avg_lat:.1f}s | máx {max(latencias, default=0):.1f}s")
    print(f"  ⚡ <5s (demo Groq):  {rapidas_demo}/{total}")
    print(f"  🟡 <30s (HPC warm): {rapidas_hpc}/{total}")
    print(f"{'='*60}\n")

    if pct < 80:
        print("Preguntas fallidas:")
        for r in resultados:
            if not r.get("acierto"):
                print(f"  [{r['id']:02d}] {r.get('categoria','')} — {r.get('pregunta','')[:50]}")

    return resultados


if __name__ == "__main__":
    asyncio.run(run_benchmark())
