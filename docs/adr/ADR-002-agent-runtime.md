# ADR-002: Agent Runtime Architecture

## Status
Accepted

## Context
The agent must support a full loop: understand → plan → execute → observe → verify → complete.

## Decision
Implement a dedicated AgentRuntime class with:
- State machine for execution flow
- Maximum step/time/token limits
- Loop detection
- Error recovery with replanning

## Rationale
- Prevents infinite loops
- Provides clear execution boundaries
- Supports pause/resume/cancel
- Enables UI observation of agent state
