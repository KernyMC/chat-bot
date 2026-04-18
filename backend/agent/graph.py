"""Grafo LangGraph que conecta los nodos del agente."""

from __future__ import annotations

from typing import Any

from agent.nodes import (
    AgentState,
    classify_and_map_node,
    executor_node,
    should_retry,
    sql_generator_node,
    synthesizer_node,
    validator_node,
)


_compiled_graph: Any | None = None


def create_initial_state(
    question: str,
    con: Any,
    conversation_history: list[dict[str, str]] | None = None,
) -> AgentState:
    """Construye el estado inicial que app.py inyecta al grafo."""
    return {
        "question": question,
        "comercio_id": None,
        "scope": "en_scope",
        "view_name": None,
        "params": {},
        "requires_product_disclaimer": False,
        "sql": "",
        "sql_valid": False,
        "sql_result": [],
        "sql_result_secondary": [],
        "response": "",
        "error": None,
        "retry_count": 0,
        "con": con,
        "conversation_history": conversation_history or [],
    }


def route_after_classify_and_map(state: AgentState) -> str:
    """Tras el nodo fusionado: si fuera_scope o sin vista → sintetizar directamente."""
    if state.get("scope") in {"fuera_scope", "ambiguous"} or not state.get("view_name"):
        return "synthesize"
    return "generate_sql"


def route_after_executor(state: AgentState) -> str:
    """Loop critico: Nodo 5 -> Nodo 3 si aun puede auto-corregir."""
    if should_retry(state):
        return "retry"
    return "synthesize"


def build_graph() -> Any:
    """Crea y compila el grafo LangGraph del agente."""
    from langgraph.graph import END, StateGraph

    graph = StateGraph(AgentState)

    graph.add_node("classify_and_map", classify_and_map_node)
    graph.add_node("sql_generator", sql_generator_node)
    graph.add_node("validator", validator_node)
    graph.add_node("executor", executor_node)
    graph.add_node("synthesizer", synthesizer_node)

    graph.set_entry_point("classify_and_map")
    graph.add_conditional_edges(
        "classify_and_map",
        route_after_classify_and_map,
        {
            "generate_sql": "sql_generator",
            "synthesize": "synthesizer",
        },
    )
    graph.add_edge("sql_generator", "validator")
    graph.add_edge("validator", "executor")
    graph.add_conditional_edges(
        "executor",
        route_after_executor,
        {
            "retry": "sql_generator",
            "synthesize": "synthesizer",
        },
    )
    graph.add_edge("synthesizer", END)

    return graph.compile()


def get_graph() -> Any:
    """Devuelve el grafo compilado, cacheado para no recompilar por mensaje."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


async def run_agent(
    question: str,
    con: Any,
    conversation_history: list[dict[str, str]] | None = None,
) -> AgentState:
    """Helper async para app.py: arma estado, invoca grafo y devuelve estado final."""
    graph = get_graph()
    initial_state = create_initial_state(
        question=question,
        con=con,
        conversation_history=conversation_history or [],
    )
    return await graph.ainvoke(initial_state)
