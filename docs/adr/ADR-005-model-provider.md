# ADR-005: Model Provider Architecture

## Status
Accepted

## Context
Luma must support multiple AI providers without coupling the agent to any specific one.

## Decision
Abstract ModelProvider interface with:
- Unified chat/stream/vision/toolCalling API
- Provider-specific adapters (OpenAI, Anthropic, Google, DeepSeek, OpenRouter)
- Model Router for auto-selection
- OpenAI-compatible base for custom endpoints

## Rationale
- Provider-agnostic agent code
- Easy to add new providers
- Supports custom/self-hosted models
- Auto-routing optimizes cost/quality
