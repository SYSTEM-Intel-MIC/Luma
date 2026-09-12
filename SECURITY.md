# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Luma, please report it responsibly.

**Email:** security@system-intel-mic.dev

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.

## Security Architecture

### Permission System

Luma implements a 5-level permission system:

| Level | Description | Default Behavior |
|-------|-------------|-----------------|
| NONE | Read-only information | Auto-execute |
| LOW | Low-risk operations | Auto-execute |
| MEDIUM | May modify user data | Ask user |
| HIGH | High-risk operations | Must ask |
| CRITICAL | System-critical operations | Blocked by default |

### Risk Engine

The Risk Engine independently analyzes operations before execution:
- Evaluates tool, arguments, target, scope, quantity
- Considers reversibility and system area impact
- Can block operations even if user has previously allowed similar ones

### Shell Security

All shell commands pass through:
1. Command Parser — identifies command type and arguments
2. Risk Analyzer — evaluates danger level
3. Permission Check — verifies authorization
4. Execution Sandbox — isolated execution environment

Blocked commands include: format, system deletion, firewall modification, security software tampering, and credential access.

### Electron Security

- `contextIsolation: true`
- `nodeIntegration: false`
- Content Security Policy enforced
- IPC message validation
- No remote content with Node.js access
- Browser views isolated from main process

### Data Protection

- API keys stored locally, never logged
- No telemetry by default
- Sensitive data excluded from history
- User data never uploaded without explicit consent

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |
