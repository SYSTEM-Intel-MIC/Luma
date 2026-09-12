import { describe, it, expect } from 'vitest';
import { Planner } from '@luma/agent';

describe('Planner', () => {
  it('should create a plan', () => {
    const planner = new Planner();
    const plan = planner.createPlan('Organize desktop', [
      'Scan desktop files',
      'Categorize files',
      'Create folders',
      'Move files',
    ]);

    expect(plan.goal).toBe('Organize desktop');
    expect(plan.steps.length).toBe(4);
    expect(plan.status).toBe('planning');
  });

  it('should advance through steps', () => {
    const planner = new Planner();
    planner.createPlan('Test', ['Step 1', 'Step 2']);

    const step1 = planner.nextStep();
    expect(step1?.description).toBe('Step 1');
    expect(step1?.status).toBe('running');

    planner.completeStep('Done');
    const step2 = planner.nextStep();
    expect(step2?.description).toBe('Step 2');
  });

  it('should return null when all steps are done', () => {
    const planner = new Planner();
    planner.createPlan('Test', ['Only step']);

    planner.nextStep();
    planner.completeStep();

    const next = planner.nextStep();
    expect(next).toBeNull();
    expect(planner.getPlan()?.status).toBe('completed');
  });

  it('should support replanning', () => {
    const planner = new Planner();
    planner.createPlan('Test', ['Step 1', 'Step 2', 'Step 3']);

    planner.nextStep();
    planner.completeStep();

    planner.replan(['New Step A', 'New Step B']);

    const plan = planner.getPlan();
    expect(plan?.steps.length).toBe(3); // 1 completed + 2 new
    expect(plan?.steps[0].status).toBe('completed');
    expect(plan?.steps[1].description).toBe('New Step A');
  });
});
