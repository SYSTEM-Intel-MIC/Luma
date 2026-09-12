import {
  PermissionDecision,
  PermissionScopeType,
  type PermissionRule,
  type PermissionRequest,
  type RiskEvaluation,
} from '@luma/shared';
import { generateId } from '@luma/shared';

/** Permission manager — manages permission rules and decisions */
export class PermissionManager {
  private rules: PermissionRule[] = [];
  private pendingRequests: Map<string, {
    resolve: (decision: PermissionDecision) => void;
  }> = new Map();
  private autoExecuteLevel: number;

  constructor(autoExecuteLevel = 1) {
    this.autoExecuteLevel = autoExecuteLevel;
  }

  /** Set auto-execute level */
  setAutoExecuteLevel(level: number): void {
    this.autoExecuteLevel = level;
  }

  /** Check if an action requires permission */
  checkPermission(
    toolName: string,
    action: string,
    scope: string,
    riskLevel: number,
  ): PermissionDecision {
    // Auto-execute if risk level is below threshold
    if (riskLevel <= this.autoExecuteLevel) {
      return PermissionDecision.GRANTED;
    }

    // Check existing rules
    const rule = this.findMatchingRule(toolName, action, scope);
    if (rule) {
      if (rule.expiresAt && rule.expiresAt < Date.now()) {
        this.removeRule(rule.id);
      } else {
        return rule.decision;
      }
    }

    return PermissionDecision.PENDING;
  }

  /** Request permission from user — returns a promise that resolves with the decision */
  async requestPermission(request: PermissionRequest): Promise<PermissionDecision> {
    return new Promise<PermissionDecision>((resolve) => {
      this.pendingRequests.set(request.id, { resolve });
      // Emit event for UI to show
      this.onPermissionRequest?.(request);
    });
  }

  /** Respond to a permission request */
  respondToPermission(
    requestId: string,
    decision: PermissionDecision,
    scopeType: PermissionScopeType = PermissionScopeType.ONCE,
  ): void {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      pending.resolve(decision);
      this.pendingRequests.delete(requestId);
    }

    // Store rule if not one-time
    if (scopeType !== PermissionScopeType.ONCE && decision !== PermissionDecision.PENDING) {
      this.addRule({
        id: generateId('perm'),
        toolName: '',
        action: '',
        scope: '',
        level: 0,
        decision,
        scopeType,
        createdAt: Date.now(),
      });
    }
  }

  /** Add a permission rule */
  addRule(rule: PermissionRule): void {
    this.rules.push(rule);
  }

  /** Remove a permission rule */
  removeRule(id: string): void {
    this.rules = this.rules.filter((r) => r.id !== id);
  }

  /** Get all rules */
  getRules(): PermissionRule[] {
    return [...this.rules];
  }

  /** Clear all rules */
  clearRules(): void {
    this.rules = [];
  }

  /** Find a matching rule */
  private findMatchingRule(
    toolName: string,
    action: string,
    scope: string,
  ): PermissionRule | undefined {
    return this.rules.find(
      (r) =>
        r.toolName === toolName &&
        r.action === action &&
        (r.scope === scope || r.scope === '*') &&
        r.decision !== PermissionDecision.PENDING,
    );
  }

  /** Callback for permission requests — set by UI layer */
  onPermissionRequest?: (request: PermissionRequest) => void;
}
