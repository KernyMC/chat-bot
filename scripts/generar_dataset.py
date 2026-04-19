"""
Generador de dataset sintético para Mi Contador de Bolsillo.
Periodo: 2025-01-01 → 2026-04-18 (hoy, fecha de corte)

Tres comercios con personalidades distintas:
  COM-001 — Tienda "Don Aurelio"     flujo estable, ticket medio, picos mañana/noche
  COM-002 — Fonda "Don Jorge"        volumen alto, ticket bajo, bimodal desayuno+almuerzo
  COM-003 — Salón "Belleza Total"    pocas tx, ticket alto, lunes cerrado, pico vie-sáb

El 18 de abril de 2026 solo tiene transacciones de la mañana (6am-10am),
simulando un día en curso. Esto hace que la alerta proactiva dispare
al comparar el parcial del día vs la mediana histórica de sábados.

Perfiles financieros (para productos DeUna):
  COM-001 → flujo estable → candidato a Cuenta Flex Ahorro + Adelanto Diciembre
  COM-002 → gap capital trabajo (Pronaca cada 2-4 días) → candidato a Capital Rotativo
  COM-003 → pico estacional (Mayo Día de la Madre, Diciembre) → Crédito de Temporada
"""

import csv
import random
from datetime import datetime, timedelta, date
from collections import defaultdict

random.seed(42)

# ── Constantes globales ────────────────────────────────────────────────────────

COMERCIOS = ["COM-001", "COM-002", "COM-003"]
START = date(2025, 1, 1)
END   = date(2026, 4, 18)          # fecha de corte = hoy en la demo
TODAY_HOUR_CUTOFF = 10             # transacciones de hoy solo hasta las 10am

# Pool de 50 clientes compartido entre los 3 comercios
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

# ── Configuración por comercio ─────────────────────────────────────────────────
# weekday(): 0=lunes, 1=martes, 2=miércoles, 3=jueves, 4=viernes, 5=sábado, 6=domingo
# ingreso_cats: { "Categoria": (peso, monto_min, monto_max) }
# proveedores:  [ (nombre, freq_min_dias, freq_max_dias, monto_min, monto_max) ]

COMERCIO_CONFIG = {

    # ── COM-001: Tienda de barrio "Don Aurelio" ───────────────────────────────
    # Perfil: constante, predecible. Dos picos diarios (mañana + noche).
    # Producto DeUna: Cuenta Flex Ahorro / Adelanto Diciembre.
    "COM-001": {
        "ingreso_cats": {
            "Abarrotes": (0.30, 5.0,  45.0),
            "Bebidas":   (0.25, 2.0,  30.0),
            "Lácteos":   (0.20, 3.0,  25.0),
            "Snacks":    (0.12, 1.0,  15.0),
            "Limpieza":  (0.08, 3.0,  30.0),
            "Varios":    (0.05, 5.0,  50.0),
        },
        "hour_weights": {
            6: 0.5, 7: 1.5, 8: 2.5, 9: 2.0, 10: 1.5, 11: 1.0,
            12: 1.5, 13: 1.0, 14: 0.8, 15: 1.0, 16: 1.5, 17: 2.0,
            18: 2.5, 19: 3.0, 20: 2.5, 21: 1.5, 22: 0.5,
        },
        "dow_weights": {
            0: 0.90,  # lunes
            1: 0.90,  # martes
            2: 0.95,  # miércoles
            3: 1.05,  # jueves
            4: 1.15,  # viernes
            5: 1.35,  # sábado ← mejor día
            6: 1.10,  # domingo
        },
        "base_daily_tx": 6.5,
        "season": {
            1: 0.80, 2: 0.85, 3: 0.90, 4: 0.95, 5: 1.00,
            6: 0.95, 7: 1.05, 8: 0.90, 9: 0.85, 10: 0.95,
            11: 1.05, 12: 1.35,  # diciembre +35%
        },
        "proveedores": [
            ("Cervecería Nacional (Pilsener)",  7, 12, 80.0,  280.0),
            ("Arca Continental (Coca-Cola)",    7, 12, 70.0,  250.0),
            ("Tesalia CBC (Pepsi)",            10, 16, 50.0,  200.0),
            ("Tonicorp",                       10, 18, 40.0,  180.0),
            ("Snacks Frito Lay",                8, 14, 50.0,  200.0),
            ("Nestlé Ecuador",                 10, 16, 80.0,  290.0),
            ("Moderna Alimentos",              12, 20, 60.0,  220.0),
            ("Bimbo Ecuador",                   7, 10, 40.0,  160.0),
            ("La Fabril",                      14, 21, 50.0,  180.0),
            ("Helados Pingüino",               14, 28, 30.0,  150.0),
        ],
        "servicios": ["CNT", "Empresa Eléctrica"],
    },

    # ── COM-002: Fonda "Don Jorge" ────────────────────────────────────────────
    # Perfil: alto volumen, ticket pequeño. Bimodal 7-9am (desayunos) + 12-2pm (almuerzos).
    # Lunes-viernes dominan; sábado moderado; domingo casi nada.
    # Gap capital de trabajo: Pronaca llega cada 2-4 días, antes de cobrar lo de la semana.
    # Producto DeUna: Capital Rotativo Semanal $150-200 ("te adelantamos lo de Pronaca").
    "COM-002": {
        "ingreso_cats": {
            "Almuerzos":           (0.40, 3.00,  5.50),
            "Desayunos":           (0.30, 1.50,  4.00),
            "Bebidas":             (0.15, 0.75,  2.50),
            "Snacks y Pastelería": (0.10, 1.00,  3.50),
            "Platos Especiales":   (0.05, 5.00, 12.00),
        },
        "hour_weights": {
            6: 0.2,  7: 3.5,  8: 5.0,  9: 2.5,  10: 0.4,
            11: 1.5, 12: 6.0, 13: 5.5, 14: 2.0, 15: 0.3,
            16: 0.2, 17: 0.3, 18: 0.5, 19: 0.3, 20: 0.2,
        },
        "dow_weights": {
            0: 1.15,  # lunes ← buen día (trabajadores)
            1: 1.10,  # martes
            2: 1.10,  # miércoles
            3: 1.10,  # jueves
            4: 1.20,  # viernes ← mejor día entre semana
            5: 0.85,  # sábado (menos trabajadores)
            6: 0.45,  # domingo (casi cerrado)
        },
        "base_daily_tx": 18.0,
        "season": {
            1: 0.75, 2: 0.80, 3: 0.90, 4: 0.90, 5: 1.00,
            6: 0.95, 7: 0.85, 8: 0.90, 9: 0.88, 10: 0.95,
            11: 1.00, 12: 1.15,  # diciembre leve alza
        },
        "proveedores": [
            # Pronaca: insumo perecible → llega cada 2-4 días, el gap de capital de trabajo
            ("Pronaca",                        2,  4,  55.0, 180.0),
            ("La Fabril",                      6, 10,  35.0, 130.0),
            ("Moderna Alimentos",              5,  9,  45.0, 160.0),
            ("Tonicorp",                       7, 12,  25.0, 100.0),
            # Distribuidora La Merced: verduras/frutas frescas, también muy frecuente
            ("Distribuidora La Merced",        2,  4,  20.0,  80.0),
        ],
        "servicios": ["CNT", "Empresa Eléctrica"],
    },

    # ── COM-003: Salón "Belleza Total" ────────────────────────────────────────
    # Perfil: pocas transacciones/día, ticket alto. Lunes casi cerrado (convención industria).
    # Viernes y sábado dominantes. Pico horario 2-7pm.
    # Estacionalidad marcada: mayo (Día de la Madre +50%) y diciembre (+55%).
    # Producto DeUna: Crédito de Temporada $400-600 ("stock de colorantes antes del Día de la Madre").
    "COM-003": {
        "ingreso_cats": {
            "Corte y Peinado":        (0.35,  5.0, 18.0),
            "Tinte y Coloración":     (0.25, 30.0, 65.0),
            "Tratamientos Capilares": (0.15, 20.0, 50.0),
            "Manicure y Pedicure":    (0.20,  8.0, 22.0),
            "Otros Servicios":        (0.05, 10.0, 40.0),
        },
        "hour_weights": {
            8: 0.2,  9: 0.8,  10: 1.2, 11: 1.5,
            12: 1.0, 13: 0.8, 14: 2.0, 15: 3.0,
            16: 3.5, 17: 3.5, 18: 3.0, 19: 1.5, 20: 0.5,
        },
        "dow_weights": {
            0: 0.08,  # lunes ← casi cerrado
            1: 0.55,  # martes
            2: 0.80,  # miércoles
            3: 0.90,  # jueves
            4: 1.80,  # viernes ← pico entre semana
            5: 2.50,  # sábado ← mejor día
            6: 1.40,  # domingo (muchos salones abren medio día)
        },
        "base_daily_tx": 5.0,
        "season": {
            1: 0.65, 2: 0.70, 3: 0.80, 4: 0.90,
            5: 1.50,  # Día de la Madre ← pico brutal
            6: 0.85, 7: 0.90, 8: 0.80, 9: 0.75, 10: 0.88,
            11: 1.10, 12: 1.55,  # Navidad/Fin de año ← segundo pico
        },
        "proveedores": [
            ("Distribuidora de Belleza Ecuador", 22, 32,  90.0, 320.0),
            ("L'Oréal Professional Ecuador",     28, 38, 110.0, 370.0),
            ("Wella Ecuador",                    30, 45,  80.0, 280.0),
            ("Essie Ecuador",                    30, 45,  40.0, 160.0),
        ],
        "servicios": ["CNT", "Empresa Eléctrica"],
    },
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def rand_monto(min_v: float, max_v: float) -> float:
    return round(random.uniform(min_v, max_v), 2)


# ── Generación ────────────────────────────────────────────────────────────────

def generate_ingresos(comercio: str, tx_counter: dict) -> list[dict]:
    cfg = COMERCIO_CONFIG[comercio]
    cats = list(cfg["ingreso_cats"].keys())
    cat_weights = [cfg["ingreso_cats"][c][0] for c in cats]
    hours = list(cfg["hour_weights"].keys())
    h_weights = [cfg["hour_weights"][h] for h in hours]

    rows = []
    current = START
    while current <= END:
        is_today = (current == END)
        season = cfg["season"].get(current.month, 1.0)
        dow    = cfg["dow_weights"][current.weekday()]
        expected = cfg["base_daily_tx"] * season * dow

        if is_today:
            fraction = TODAY_HOUR_CUTOFF / 22.0
            expected = expected * fraction * 0.6   # mañana tranquila

        n = max(0, int(random.gauss(expected, expected * 0.3)))

        # Horas válidas para hoy (si aplica el corte)
        if is_today:
            valid = [(h, w) for h, w in zip(hours, h_weights) if h < TODAY_HOUR_CUTOFF]
        else:
            valid = list(zip(hours, h_weights))

        if not valid:
            current += timedelta(days=1)
            continue

        hs, ws = zip(*valid)

        for _ in range(n):
            cat = random.choices(cats, weights=cat_weights, k=1)[0]
            _, mn, mx = cfg["ingreso_cats"][cat]
            monto  = rand_monto(mn, mx)
            hour   = random.choices(list(hs), weights=list(ws), k=1)[0]
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            ts     = datetime(current.year, current.month, current.day, hour, minute, second)
            client = random.choice(CLIENTS)
            tx_counter[comercio] += 1
            tid = f"TX-{comercio}-{tx_counter[comercio]:05d}"
            rows.append({
                "transaccion_id":    tid,
                "comercio_id":       comercio,
                "fecha":             ts.strftime("%Y-%m-%d %H:%M:%S"),
                "tipo":              "Ingreso",
                "categoria":         cat,
                "monto":             monto,
                "cliente_id":        client[0],
                "nombre_contrapartida": client[1],
            })
        current += timedelta(days=1)
    return rows


def generate_egresos_pago(comercio: str, tx_counter: dict) -> list[dict]:
    cfg = COMERCIO_CONFIG[comercio]
    rows = []

    for prov in cfg["proveedores"]:
        nombre, freq_min, freq_max, monto_min, monto_max = prov
        freq_days = random.randint(freq_min, freq_max)
        current   = START + timedelta(days=random.randint(0, max(freq_days - 1, 0)))

        while current <= END:
            if current == END:
                break
            monto  = rand_monto(monto_min, monto_max)
            hour   = random.randint(8, 17)
            minute = random.randint(0, 59)
            ts     = datetime(current.year, current.month, current.day, hour, minute, 0)
            tx_counter[comercio] += 1
            tid = f"TX-{comercio}-{tx_counter[comercio]:05d}"
            rows.append({
                "transaccion_id":    tid,
                "comercio_id":       comercio,
                "fecha":             ts.strftime("%Y-%m-%d %H:%M:%S"),
                "tipo":              "Egreso",
                "categoria":         "Pago a Proveedor",
                "monto":             monto,
                "cliente_id":        "",
                "nombre_contrapartida": nombre,
            })
            current += timedelta(days=freq_days + random.randint(-2, 3))
    return rows


def generate_egresos_servicios(comercio: str, tx_counter: dict) -> list[dict]:
    cfg = COMERCIO_CONFIG[comercio]
    rows = []

    for svc in cfg["servicios"]:
        current = START.replace(day=random.randint(1, 10))
        while current <= END:
            if current == END:
                break
            monto  = rand_monto(20.24, 150.0)
            hour   = random.randint(9, 16)
            minute = random.randint(0, 59)
            ts     = datetime(current.year, current.month, current.day, hour, minute, 0)
            tx_counter[comercio] += 1
            tid = f"TX-{comercio}-{tx_counter[comercio]:05d}"
            rows.append({
                "transaccion_id":    tid,
                "comercio_id":       comercio,
                "fecha":             ts.strftime("%Y-%m-%d %H:%M:%S"),
                "tipo":              "Egreso",
                "categoria":         "Servicios Básicos",
                "monto":             monto,
                "cliente_id":        "",
                "nombre_contrapartida": svc,
            })
            month = current.month + 1 if current.month < 12 else 1
            year  = current.year + (1 if current.month == 12 else 0)
            day   = random.randint(1, 10)
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

    all_rows.sort(key=lambda r: r["fecha"])

    out_path   = "/Volumes/HP-P500/mi-contador/data/transacciones.csv"
    fieldnames = [
        "transaccion_id", "comercio_id", "fecha", "tipo",
        "categoria", "monto", "cliente_id", "nombre_contrapartida",
    ]

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    # ── Estadísticas por comercio ──────────────────────────────────────────────
    ingresos  = [r for r in all_rows if r["tipo"] == "Ingreso"]
    egresos   = [r for r in all_rows if r["tipo"] == "Egreso"]
    today_rows = [r for r in all_rows if r["fecha"].startswith("2026-04-18")]

    print(f"\nTotal filas:     {len(all_rows)}")
    print(f"  Ingresos:      {len(ingresos)}")
    print(f"  Egresos:       {len(egresos)}")
    print(f"  Hoy (18-abr):  {len(today_rows)}")
    print(f"  Periodo:       {all_rows[0]['fecha'][:10]} → {all_rows[-1]['fecha'][:10]}")

    avg_i = sum(float(r["monto"]) for r in ingresos) / len(ingresos)
    avg_e = sum(float(r["monto"]) for r in egresos)  / len(egresos)
    print(f"  Avg ingreso:   ${avg_i:.2f}")
    print(f"  Avg egreso:    ${avg_e:.2f}")

    print("\nPor comercio:")
    for com in COMERCIOS:
        com_i = [r for r in ingresos if r["comercio_id"] == com]
        com_e = [r for r in egresos  if r["comercio_id"] == com]
        total_i = sum(float(r["monto"]) for r in com_i)
        total_e = sum(float(r["monto"]) for r in com_e)
        cats = {}
        for r in com_i:
            cats[r["categoria"]] = cats.get(r["categoria"], 0) + 1
        top_cat = max(cats, key=cats.get) if cats else "-"
        print(f"  {com}: {len(com_i)} ingresos (${total_i:,.0f}) | "
              f"{len(com_e)} egresos (${total_e:,.0f}) | top cat: {top_cat}")

    print(f"\nCSV guardado en {out_path}")


if __name__ == "__main__":
    main()
