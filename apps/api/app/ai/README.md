# AI & MCP Engineering Layer

This module houses the AI architecture for the **Piggybank** tracker:

```
app/ai/
├── agents/         # Multi-turn agents (FIRE projections, portfolio balance advisor)
├── guardrails/     # Input sanitization and Pydantic response guardrails
├── evals/          # Automated test suites to measure prompt & agent performance
└── mcp/            # Model Context Protocol clients (Zerodha https://mcp.kite.trade/mcp, IBKR)
```

### Planned Integrations (Phase 3 & 4):
1. **Free Inference:** Google Gemini 1.5 Flash via Google AI Studio (`google-genai` SDK) & Groq (`groq-python`).
2. **Kite MCP Client:** Connects to Zerodha's official remote server via SSE / stdio to call `get_holdings` and `get_margins`.
3. **Evals:** Test suite verifying calculations, currency normalizations, and zero hallucinated equity prices.
