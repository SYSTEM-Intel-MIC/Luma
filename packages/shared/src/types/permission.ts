/** Permission decision */
export enum PermissionDecision {
  PENDING = 'pending',
  GRANTED = 'granted',
  DENIED = 'denied',
}

/** Permission scope type */
export enum PermissionScopeType {
  ONCE = 'once',
  TASK = 'task',
  PERMANENT = 'permanent',
}

/** Permission rule */
export interface PermissionRule {
  id: string;
  toolName: string;
  action: string;
  scope: string;
  level: number;
  decision: PermissionDecision;
  scopeType: PermissionScopeType;
  taskId?: string;
  createdAt: number;
  expiresAt?: number;
}

/** Risk evaluation result */
export interface RiskEvaluation {
  riskLevel: number;
  reason: string;
  requiresApproval: boolean;
  blocked: boolean;
  details: Record<string, unknown>;
}

/** Permission request sent to UI */
export interface PermissionRequest {
  id: string;
  taskId: string;
  toolName: string;
  action: string;
  description: string;
  riskLevel: number;
  details: Record<string, unknown>;
  scope: string;
  reversible: boolean;
  timestamp: number;
}
