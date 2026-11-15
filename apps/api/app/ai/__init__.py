"""
AI & Autonomous Agent Layer for Piggybank Tracker.

Modules:
- agents/: Orchestration loops (LangGraph, custom state-machines) for portfolio insights & FIRE modeling.
- guardrails/: Input/output validation and prompt sanitization (Pydantic / Guardrails / NeMo).
- evals/: Evaluation test suites (DeepEval / Ragas / Promptfoo) to assess accuracy and hallucination rates.
- mcp/: Model Context Protocol client connectors for remote broker servers (e.g. Zerodha Kite MCP, IBKR).
"""
