import type { Database } from './database.js';
import type { Task, TaskStep, TaskStatus } from '@luma/shared';
import { AgentState, createTaskId, TaskStatus as TS } from '@luma/shared';

interface TaskRow {
  id: string;
  user_prompt: string;
  status: string;
  agent_state: string;
  result: string | null;
  error: string | null;
  model: string | null;
  duration: number | null;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
}

interface TaskStepRow {
  id: string;
  task_id: string;
  type: string;
  title: string;
  detail: string | null;
  status: string;
  metadata: string | null;
  timestamp: number;
  duration: number | null;
}

/** Task store backed by SQLite */
export class TaskStore {
  constructor(private db: Database) {}

  /** Create a new task */
  create(userPrompt: string): Task {
    const id = createTaskId();
    const now = Date.now();
    this.db.run(
      `INSERT INTO tasks (id, user_prompt, status, agent_state, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id, userPrompt, TS.PENDING, AgentState.IDLE, now, now
    );
    return {
      id,
      userPrompt,
      status: TS.PENDING,
      agentState: AgentState.IDLE,
      createdAt: now,
      updatedAt: now,
      steps: [],
      toolCalls: [],
      permissions: [],
    };
  }

  /** Get a task by ID */
  get(id: string): Task | undefined {
    const row = this.db.get<TaskRow>('SELECT * FROM tasks WHERE id = ?', id);
    if (!row) return undefined;
    const steps = this.getSteps(id);
    return this.rowToTask(row, steps);
  }

  /** Get recent tasks */
  getRecent(limit = 50): Task[] {
    const rows = this.db.all<TaskRow>(
      'SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?',
      limit
    );
    return rows.map((row) => this.rowToTask(row, this.getSteps(row.id)));
  }

  /** Update task status */
  updateStatus(id: string, status: TaskStatus, agentState?: AgentState): void {
    const now = Date.now();
    const completedAt = [TS.COMPLETED, TS.FAILED, TS.CANCELLED].includes(status) ? now : null;
    this.db.run(
      `UPDATE tasks SET status = ?, agent_state = ?, updated_at = ?, completed_at = ?
       WHERE id = ?`,
      status,
      agentState ?? AgentState.IDLE,
      now,
      completedAt,
      id
    );
  }

  /** Update task result */
  updateResult(id: string, result: string, error?: string): void {
    const now = Date.now();
    const duration = this.calculateDuration(id, now);
    this.db.run(
      `UPDATE tasks SET result = ?, error = ?, duration = ?, updated_at = ? WHERE id = ?`,
      result,
      error ?? null,
      duration,
      now,
      id
    );
  }

  /** Add a step to a task */
  addStep(step: TaskStep): void {
    this.db.run(
      `INSERT INTO task_steps (id, task_id, type, title, detail, status, metadata, timestamp, duration)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      step.id,
      step.taskId,
      step.type,
      step.title,
      step.detail ?? null,
      step.status,
      step.metadata ? JSON.stringify(step.metadata) : null,
      step.timestamp,
      step.duration ?? null
    );
  }

  /** Delete a task and its steps */
  delete(id: string): void {
    this.db.run('DELETE FROM tasks WHERE id = ?', id);
  }

  /** Clear all task history */
  clearAll(): void {
    this.db.run('DELETE FROM task_steps');
    this.db.run('DELETE FROM tasks');
  }

  /** Get steps for a task */
  private getSteps(taskId: string): TaskStep[] {
    const rows = this.db.all<TaskStepRow>(
      'SELECT * FROM task_steps WHERE task_id = ? ORDER BY timestamp ASC',
      taskId
    );
    return rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      type: row.type as TaskStep['type'],
      title: row.title,
      detail: row.detail ?? undefined,
      status: row.status as TaskStep['status'],
      metadata: row.metadata ? JSON.parse(row.metadata) as Record<string, unknown> : undefined,
      timestamp: row.timestamp,
      duration: row.duration ?? undefined,
    }));
  }

  /** Convert a database row to a Task */
  private rowToTask(row: TaskRow, steps: TaskStep[]): Task {
    return {
      id: row.id,
      userPrompt: row.user_prompt,
      status: row.status as TaskStatus,
      agentState: row.agent_state as AgentState,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at ?? undefined,
      steps,
      toolCalls: [],
      permissions: [],
      result: row.result ?? undefined,
      error: row.error ?? undefined,
      duration: row.duration ?? undefined,
      model: row.model ?? undefined,
    };
  }

  /** Calculate task duration */
  private calculateDuration(taskId: string, now: number): number | null {
    const task = this.db.get<TaskRow>('SELECT created_at FROM tasks WHERE id = ?', taskId);
    if (!task) return null;
    return now - task.created_at;
  }
}
