# ADR-004: SQLite for Storage

## Status
Accepted

## Context
Luma needs local-first storage for config, tasks, memory, and history.

## Decision
Use SQLite via better-sqlite3.

## Rationale
- Zero configuration, single file database
- Synchronous API (simpler for Electron)
- Well-tested and stable
- GPL-compatible license
- Good performance for desktop use
