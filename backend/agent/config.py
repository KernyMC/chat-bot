"""Configuración central de la demo — cambia aquí, se aplica en todo el proyecto."""

from __future__ import annotations

# ── Comercio activo en la demo ─────────────────────────────────────────────────
# Opciones válidas: "COM-001" | "COM-002" | "COM-003"
# Este valor se usa en:
#   - app.py           → mensajes de bienvenida rotatorios
#   - agent/nodes.py   → default cuando el usuario no especifica comercio
DEMO_COMERCIO_ID: str = "COM-001"
