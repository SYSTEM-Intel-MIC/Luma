# Agent Runtime

## Agent Loop

The agent loop is the core execution engine:

1. **Context Assembly** — Build system prompt + conversation history + memory
2. **Model Call** — Send to AI model for reasoning
3. **Intent Understanding** — Parse model response
4. **Planning** — Determine next actions
5. **Tool Selection** — Choose appropriate tools
6. **Risk Evaluation** — Independent risk analysis
7. **Permission Check** — Request user approval if needed
8. **Tool Execution** — Run the selected tools
9. **Observation** — Analyze tool results
10. **Verification** — Confirm results match expectations
11. **Replanning** — Adjust plan based on observations
12. **Continue or Complete** — Loop or finish

## Safety Guards

- Maximum steps (default: 50)
- Maximum execution time (default: 5 minutes)
- Tool timeout (default: 30 seconds)
- Retry limit (default: 3)
- Token budget (default: 128K)
- Loop detection (repeated actions)
- Duplicate action detection

## State Machine

```
IDLE → THINKING → PLANNING → WAITING_PERMISSION → EXECUTING
→ OBSERVING → VERIFYING → THINKING → COMPLETED

Exceptional: FAILED, CANCELLED, PAUSED, WAITING_USER
```

## Error Recovery

When a tool fails:
1. Analyze the error
2. Try alternative approaches
3. Replan if necessary
4. Report to user if unrecoverable
