"""
Generador de dataset sintético para Mi Contador de Bolsillo.
Periodo: 2025-01-01 → 2026-04-18 (hoy, fecha de corte)

El 18 de abril de 2026 solo tiene transacciones de la mañana (6am-10am),
simulando un día en curso. Esto hace que la alerta proactiva dispare
al comparar el parcial del día vs la mediana histórica de sábados.
"""

import csv
import random
from datetime import datetime, timedelta, date
from collections import defaultdict

random.seed(42)

# ── Constantes ────────────────────────────────────────────────────────────────

COMERCIOS = ["COM-001", "COM-002", "COM-003"]
START = date(2025, 1, 1)
END = date(2026, 4, 18)          # fecha de corte = hoy en la demo
TODAY_HOUR_CUTOFF = 10           # transacciones de hoy solo hasta las 10am

CLIENTS = [
    ("CL-0001", "Rosa Garcia Gomez"),
    ("CL-0002", "Marta Fernandez Noboa"),
    ("CL-0003", "Paulina Gonzalez Garcia"),
    ("CL-0004", "Carlos Cevallos Garcia"),
    ("CL-0005", "Camila Saltos Perez"),
    ("CL-0006", "Juan Garcia Martinez"),
    ("CL-0007", "Diego Gomez Lopez"),
    ("CL-0008", "Rosa Rodriguez Chavez"),
    ("CL-0009", "Fernando Gomez Gonzalez"),
    ("CL-0010", "Camila Fernandez Chavez"),
    ("CL-0011", "Jorge Almeida Sanchez"),
    ("CL-0012", "Maria Perez Martin"),
    ("CL-0013", "Rosa Chavez Gomez"),
    ("CL-0014", "Fernando Martinez Almeida"),
    ("CL-0015", "Juan Rodriguez Martinez"),
    ("CL-0016", "Carlos Martinez Mendoza"),
    ("CL-0017", "Camila Perez Velasco"),
    ("CL-0018", "Maria Velasco Chavez"),
    ("CL-0019", "Luis Velasco Sanchez"),
    ("CL-0020", "Patricia Mendoza Lopez"),
    ("CL-0021", "Carlos Noboa Noboa"),
    ("CL-0022", "Valentina Saltos Chavez"),
    ("CL-0023", "Marta Cevallos Zambrano"),
    ("CL-0024", "Rosa Lopez Martinez"),
    ("CL-0025", "Mateo Rodriguez Chavez"),
    ("CL-0026", "Andres Cevallos Gomez"),
    ("CL-0027", "Rosa Noboa Gomez"),
    ("CL-0028", "Rosa Martin Saltos"),
    ("CL-0029", "Ana Gomez Cevallos"),
    ("CL-0030", "Rosa Martin Cevallos"),
    ("CL-0031", "Marta Almeida Martinez"),
    ("CL-0032", "Ana Velasco Zambrano"),
    ("CL-0033", "Fernando Martin Perez"),
    ("CL-0034", "Valentina Rodriguez Rodriguez"),
    ("CL-0035", "Carmen Noboa Lopez"),
    ("CL-0036", "Daniel Noboa Martinez"),
    ("CL-0037", "Mateo Saltos Sanchez"),
    ("CL-0038", "Luis Martin Chavez"),
    ("CL-0039", "Fernando Mendoza Cevallos"),
    ("CL-0040", "Carlos Perez Rodriguez"),
    ("CL-0041", "Valentina Noboa Perez"),
    ("CL-0042", "Ana Rodriguez Gonzalez"),
    ("CL-0043", "Maria Velasco Rodriguez"),
    ("CL-0044", "Juan Zambrano Sanchez"),
    ("CL-0045", "Valentina Zambrano Perez"),
    ("CL-0046", "Luis Fernandez Fernandez"),
    ("CL-0047", "Fernando Saltos Saltos"),
    ("CL-0048", "Maria Fernandez Gonzalez"),
    ("CL-0049", "Diego Fernandez Perez"),
    ("CL-0050", "Camila Mendoza Lopez"),
]

PROV_PAGO = [
    "Cervecería Nacional (Pilsener)",
    "Arca Continental (Coca-Cola)",
    "Tesalia CBC (Pepsi)",
    "Tonicorp",
    "Snacks Frito Lay",
    "Pronaca",
    "Nestlé Ecuador",
    "Moderna Alimentos",
    "Bimbo Ecuador",
    "La Fabril",
    "Helados Pingüino",
]
PROV_SERVICIO = ["CNT", "Empresa Eléctrica"]

# Categorías de ingreso: peso, (min, max) monto
INGRESO_CATS = {
    "Abarrotes": (0.30, 5.0, 45.0),
    "Bebidas":   (0.25, 2.0, 30.0),
    "Lácteos":   (0.20, 3.0, 25.0),
    "Snacks":    (0.12, 1.0, 15.0),
    "Limpieza":  (0.08, 3.0, 30.0),
    "Otros":     (0.05, 5.0, 50.0),
}

# Factor estacional por mes (1.0 = base)
SEASON = {
    1: 0.85,   # enero lento post-fiestas
    2: 0.90,
    3: 0.95,
    4: 1.00,
    5: 1.00,
    6: 0.95,
    7: 1.05,   # vacaciones escolares julio
    8: 0.90,
    9: 0.88,   # septiembre bajo
    10: 0.95,
    11: 1.05,
    12: 1.30,  # diciembre fiestas
}

# Peso por día de la semana (0=lunes … 6=domingo en Python weekday())
DOW_WEIGHT = {0: 1.0, 1: 0.95, 2: 0.95, 3: 1.05, 4: 1.10, 5: 1.20, 6: 1.05}

# Distribución de horas para ingresos (peso relativo)
HOUR_WEIGHTS = {
    6: 0.5, 7: 1.0, 8: 2.0, 9: 1.5, 10: 1.8, 11: 1.5,
    12: 2.0, 13: 1.2, 14: 1.0, 15: 1.5, 16: 1.8, 17: 1.5,
    18: 1.8, 19: 2.0, 20: 2.2, 21: 1.0, 22: 0.3,
}
HOURS = list(HOUR_WEIGHTS.keys())
H_WEIGHTS = [HOUR_WEIGHTS[h] for h in HOURS]


# ── Helpers ───────────────────────────────────────────────────────────────────

def rand_monto(min_v: float, max_v: float) -> float:
    return round(random.uniform(min_v, max_v), 2)


def pick_category():
    cats = list(INGRESO_CATS.keys())
    weights = [INGRESO_CATS[c][0] for c in cats]
    return random.choices(cats, weights=weights, k=1)[0]


def pick_hour(max_hour: int | None = None) -> int:
    if max_hour is None:
        return random.choices(HOURS, weights=H_WEIGHTS, k=1)[0]
    valid = [(h, w) for h, w in zip(HOURS, H_WEIGHTS) if h < max_hour]
    if not valid:
        return max_hour - 1
    hs, ws = zip(*valid)
    return random.choices(list(hs), weights=list(ws), k=1)[0]


def rand_minute() -> int:
    return random.randint(0, 59)


def base_ingresos_per_day(d: date) -> float:
    """Expected number of ingreso transactions on this date for one comercio."""
    season = SEASON.get(d.month, 1.0)
    dow = DOW_WEIGHT[d.weekday()]
    # Base ≈ 5 transactions/day/comercio (2025: ~5*365=1825 ≈ 2000 with variance)
    return 5.0 * season * dow


# ── Generación ────────────────────────────────────────────────────────────────

def generate_ingresos(comercio: str, tx_counter: dict) -> list[dict]:
    rows = []
    current = START
    while current <= END:
        is_today = current == END
        expected = base_ingresos_per_day(current)
        if is_today:
            # Solo la mañana (hasta TODAY_HOUR_CUTOFF), fracción del día
            fraction = TODAY_HOUR_CUTOFF / 22.0
            expected = expected * fraction * 0.6   # mañana tranquila
        n = max(0, int(random.gauss(expected, expected * 0.3)))
        for _ in range(n):
            cat = pick_category()
            _, mn, mx = INGRESO_CATS[cat]
            monto = rand_monto(mn, mx)
            hour = pick_hour(TODAY_HOUR_CUTOFF if is_today else None)
            minute = rand_minute()
            second = random.randint(0, 59)
            ts = datetime(current.year, current.month, current.day, hour, minute, second)
            client = random.choice(CLIENTS)
            tx_counter[comercio] += 1
            tid = f"TX-{comercio}-{tx_counter[comercio]:05d}"
            rows.append({
                "transaccion_id": tid,
                "comercio_id": comercio,
                "fecha": ts.strftime("%Y-%m-%d %H:%M:%S"),
                "tipo": "Ingreso",
                "categoria": cat,
                "monto": monto,
                "cliente_id": client[0],
                "nombre_contrapartida": client[1],
            })
        current += timedelta(days=1)
    return rows


def generate_egresos_pago(comercio: str, tx_counter: dict) -> list[dict]:
    """Pagos a proveedores: una vez cada 7-14 días por proveedor principal."""
    rows = []
    # Cada proveedor tiene su propia frecuencia
    for prov in PROV_PAGO:
        freq_days = random.randint(7, 14)  # cada cuántos días
        current = START + timedelta(days=random.randint(0, freq_days - 1))
        while current <= END:
            if current == END:
                break  # no pagos a proveedor el día de corte parcial
            monto = rand_monto(50.0, 299.67)
            hour = random.randint(8, 17)
            minute = rand_minute()
            ts = datetime(current.year, current.month, current.day, hour, minute, 0)
            tx_counter[comercio] += 1
            tid = f"TX-{comercio}-{tx_counter[comercio]:05d}"
            rows.append({
                "transaccion_id": tid,
                "comercio_id": comercio,
                "fecha": ts.strftime("%Y-%m-%d %H:%M:%S"),
                "tipo": "Egreso",
                "categoria": "Pago a Proveedor",
                "monto": monto,
                "cliente_id": "",
                "nombre_contrapartida": prov,
            })
            current += timedelta(days=freq_days + random.randint(-2, 3))
    return rows


def generate_egresos_servicios(comercio: str, tx_counter: dict) -> list[dict]:
    """Servicios básicos: pago mensual."""
    rows = []
    for svc in PROV_SERVICIO:
        current = START.replace(day=random.randint(1, 10))
        while current <= END:
            if current == END:
                break
            monto = rand_monto(20.24, 150.0)
            hour = random.randint(9, 16)
            ts = datetime(current.year, current.month, current.day, hour, rand_minute(), 0)
            tx_counter[comercio] += 1
            tid = f"TX-{comercio}-{tx_counter[comercio]:05d}"
            rows.append({
                "transaccion_id": tid,
                "comercio_id": comercio,
                "fecha": ts.strftime("%Y-%m-%d %H:%M:%S"),
                "tipo": "Egreso",
                "categoria": "Servicios Básicos",
                "monto": monto,
                "cliente_id": "",
                "nombre_contrapartida": svc,
            })
            # Avanzar al siguiente mes
            month = current.month + 1 if current.month < 12 else 1
            year = current.year + (1 if current.month == 12 else 0)
            day = random.randint(1, 10)
            try:
                current = date(year, month, day)
            except ValueError:
                break
    return rows


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    all_rows: list[dict] = []
    tx_counter: dict[str, int] = defaultdict(int)

    for comercio in COMERCIOS:
        all_rows.extend(generate_ingresos(comercio, tx_counter))
        all_rows.extend(generate_egresos_pago(comercio, tx_counter))
        all_rows.extend(generate_egresos_servicios(comercio, tx_counter))

    # Ordenar por fecha
    all_rows.sort(key=lambda r: r["fecha"])

    out_path = "/Volumes/HP-P500/mi-contador/data/transacciones.csv"
    fieldnames = ["transaccion_id", "comercio_id", "fecha", "tipo", "categoria",
                  "monto", "cliente_id", "nombre_contrapartida"]

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    # Estadísticas
    ingresos = [r for r in all_rows if r["tipo"] == "Ingreso"]
    egresos  = [r for r in all_rows if r["tipo"] == "Egreso"]
    today_rows = [r for r in all_rows if r["fecha"].startswith("2026-04-18")]
    print(f"Total filas:      {len(all_rows)}")
    print(f"  Ingresos:       {len(ingresos)}")
    print(f"  Egresos:        {len(egresos)}")
    print(f"  Hoy (18-abr):   {len(today_rows)}")
    print(f"  Periodo:        {all_rows[0]['fecha'][:10]} → {all_rows[-1]['fecha'][:10]}")
    avg_i = sum(float(r["monto"]) for r in ingresos) / len(ingresos)
    avg_e = sum(float(r["monto"]) for r in egresos)  / len(egresos)
    print(f"  Avg ingreso:    ${avg_i:.2f}")
    print(f"  Avg egreso:     ${avg_e:.2f}")
    by_com = defaultdict(int)
    for r in all_rows:
        by_com[r["comercio_id"]] += 1
    for c, n in sorted(by_com.items()):
        print(f"  {c}: {n} transacciones")
    print(f"\nCSV guardado en {out_path}")


if __name__ == "__main__":
    main()
