# Permission System

## Levels

| Level | Description | Default |
|-------|-------------|---------|
| NONE | Read-only info | Auto-execute |
| LOW | Low-risk ops | Auto-execute |
| MEDIUM | May modify data | Ask user |
| HIGH | High-risk ops | Must ask |
| CRITICAL | System-critical | Blocked |

## Risk Engine

Independent risk analysis considering:
- Tool type and action
- Target path (protected directories blocked)
- Scope (number of items affected)
- Reversibility
- System area impact

## Permission Flow

1. Tool declares risk level
2. Risk Engine independently evaluates
3. If approval needed, PermissionRequest sent to UI
4. User decides: grant once / for task / permanently / deny
5. Decision recorded and enforced
