# ADR-003: Permission System

## Status
Accepted

## Context
AI agent operations can have real consequences on the user's computer. Some operations need human approval.

## Decision
5-level permission system with independent Risk Engine:
- NONE, LOW, MEDIUM, HIGH, CRITICAL
- Risk Engine evaluates independently of tool self-declaration
- Protected directories always blocked
- User decisions persisted with scope limits

## Rationale
- Minimum privilege principle
- Independent risk analysis prevents tool from underreporting risk
- Scope-limited permissions prevent escalation
