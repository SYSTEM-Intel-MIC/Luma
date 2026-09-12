# Security

## Electron Security

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- Content Security Policy
- IPC message validation
- No remote content with Node access

## API Key Protection

- Stored locally in config file
- Never logged (sanitized in all log outputs)
- Never sent to Luma servers
- Never included in error reports or history

## Shell Security

Commands pass through:
1. Command Parser
2. Risk Analyzer
3. Permission Check
4. Execution

Blocked: format, system deletion, firewall changes, credential access.

## Data Protection

- Local-first: all data stored on user's machine
- No telemetry by default
- Sensitive data excluded from history
- Files only sent to AI when user explicitly requests
