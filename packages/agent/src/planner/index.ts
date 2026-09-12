import type { TaskStep } from '@luma/shared';

/** A plan for task execution */
export interface Plan {
  goal: string;
  steps: PlanStep[];
  currentStepIndex: number;
  status: 'planning' | 'executing' | 'completed' | 'failed';
}

/** A step in a plan */
export interface PlanStep {
  id: string;
  description: string;
  toolName?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: string;
}

/** Planner — generates and manages execution plans */
export class Planner {
  private currentPlan: Plan | null = null;

  /** Create a plan from model output */
  createPlan(goal: string, steps: string[]): Plan {
    this.currentPlan = {
      goal,
      steps: steps.map((desc, i) => ({
        id: `plan_step_${i}`,
        description: desc,
        status: 'pending',
      })),
      currentStepIndex: 0,
      status: 'planning',
    };
    return this.currentPlan;
  }

  /** Get current plan */
  getPlan(): Plan | null {
    return this.currentPlan;
  }

  /** Advance to next step */
  nextStep(): PlanStep | null {
    if (!this.currentPlan) return null;
    if (this.currentPlan.currentStepIndex >= this.currentPlan.steps.length) {
      this.currentPlan.status = 'completed';
      return null;
    }
    const step = this.currentPlan.steps[this.currentPlan.currentStepIndex];
    step.status = 'running';
    return step;
  }

  /** Mark current step as completed */
  completeStep(result?: string): void {
    if (!this.currentPlan) return;
    const step = this.currentPlan.steps[this.currentPlan.currentStepIndex];
    if (step) {
      step.status = 'completed';
      step.result = result;
    }
    this.currentPlan.currentStepIndex++;
  }

  /** Mark current step as failed */
  failStep(reason?: string): void {
    if (!this.currentPlan) return;
    const step = this.currentPlan.steps[this.currentPlan.currentStepIndex];
    if (step) {
      step.status = 'failed';
      step.result = reason;
    }
  }

  /** Replan — adjust plan based on observations */
  replan(newSteps: string[]): void {
    if (!this.currentPlan) return;
    const completedSteps = this.currentPlan.steps.filter(
      (s) => s.status === 'completed' || s.status === 'failed',
    );
    const remainingSteps: PlanStep[] = newSteps.map((desc, i) => ({
      id: `plan_step_replan_${i}`,
      description: desc,
      status: 'pending',
    }));

    this.currentPlan.steps = [...completedSteps, ...remainingSteps];
    this.currentPlan.currentStepIndex = completedSteps.length;
  }

  /** Convert plan to task steps for display */
  toTaskSteps(): TaskStep[] {
    if (!this.currentPlan) return [];
    return this.currentPlan.steps.map((step) => ({
      id: step.id,
      taskId: '',
      type: 'planning' as const,
      title: step.description,
      status: step.status,
      timestamp: Date.now(),
    }));
  }
}
