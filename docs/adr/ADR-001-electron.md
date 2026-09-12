# ADR-001: Electron as Desktop Framework

## Status
Accepted

## Context
Luma needs a cross-platform desktop framework that provides:
- Native window management (frameless, always-on-top)
- System tray integration
- Global shortcuts
- File system access
- IPC between UI and backend

## Decision
Use Electron as the desktop framework.

## Rationale
- Mature ecosystem with strong Windows support
- Large community and extensive documentation
- React/TypeScript compatibility
- Native API access for tray, shortcuts, window management
- Well-established security model (contextIsolation, sandbox)

## Consequences
- Larger app size (~150MB)
- Higher memory usage than native apps
- Requires careful security configuration
