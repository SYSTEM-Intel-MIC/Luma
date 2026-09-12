import type {
  Task,
  TaskStep,
  ChatMessage,
  ModelResponse,
  AgentConfig,
  StreamChunk,
  PermissionRequest,
} from '@luma/shared';
import {
  AgentState,
  TaskStatus,
  MessageRole,
  PermissionDecision,
  PermissionScopeType,
  AgentError,
  ErrorCodes,
  generateId,
  sleep,
  sanitizeForLog,
} from '@luma/shared';
import { ModelRouter } from '@luma/models';
import { ToolRegistry } from '@luma/tools';
import { PermissionManager, RiskEngine } from '@luma/permissions';
import { MemoryManager } from '@luma/memory';
import { TaskStore, HistoryStore } from '@luma/storage';
import { Planner, type Plan } from './planner/index.js';
import { ContextManager } from './context/index.js';
import { SystemPromptBuilder } from './system-prompt.js';

/** Agent state change event */
export interface AgentEvent {
  type: 'state' | 'step' | 'stream' | 'permission_request' | 'complete' | 'error';
  data: unknown;
}

/** Agent runtime — the core execution engine */
export class AgentRuntime {
  private config: AgentConfig;
  private modelRouter: ModelRouter;
  private toolRegistry: ToolRegistry;
  private permissionManager: PermissionManager;
  private riskEngine: RiskEngine;
  private memoryManager: MemoryManager;
  private taskStore: TaskStore;
  private historyStore: HistoryStore;
  private planner: Planner;
  private contextManager: ContextManager;
  private systemPromptBuilder: SystemPromptBuilder;

  private currentTask: Task | null = null;
  private aborted = false;
  private paused = false;
  private stepCount = 0;
  private startTime = 0;
  private recentActions: string[] = [];

  constructor(options: {
    config: AgentConfig;
    modelRouter: ModelRouter;
    toolRegistry: ToolRegistry;
    permissionManager: PermissionManager;
    riskEngine: RiskEngine;
    memoryManager: MemoryManager;
    taskStore: TaskStore;
    historyStore: HistoryStore;
  }) {
    this.config = options.config;
    this.modelRouter = options.modelRouter;
    this.toolRegistry = options.toolRegistry;
    this.permissionManager = options.permissionManager;
    this.riskEngine = options.riskEngine;
    this.memoryManager = options.memoryManager;
    this.taskStore = options.taskStore;
    this.historyStore = options.historyStore;

    this.planner = new Planner();
    this.contextManager = new ContextManager();
    this.systemPromptBuilder = new SystemPromptBuilder(this.toolRegistry);
  }

  /** Get current task */
  getCurrentTask(): Task | null {
    return this.currentTask;
  }

  /** Start a new task */
  async run(
    userPrompt: string,
    onEvent: (event: AgentEvent) => void,
  ): Promise<Task> {
    this.aborted = false;
    this.paused = false;
    this.stepCount = 0;
    this.startTime = Date.now();
    this.recentActions = [];

    // Create task
    const task = this.taskStore.create(userPrompt);
    this.currentTask = task;
    this.taskStore.updateStatus(task.id, TaskStatus.RUNNING, AgentState.THINKING);

    // Save user message to history
    this.historyStore.add(task.id, 'user', userPrompt);

    // Emit initial state
    onEvent({ type: 'state', data: { state: AgentState.THINKING, taskId: task.id } });

    try {
      // Build initial context
      const memories = await this.memoryManager.getContextMemories();
      const systemPrompt = this.systemPromptBuilder.build(memories);
      const messages: ChatMessage[] = [
        { role: MessageRole.SYSTEM, content: systemPrompt },
        { role: MessageRole.USER, content: userPrompt },
      ];

      // Get model provider
      const provider = this.modelRouter.getProvider();
      if (!provider) {
        throw new AgentError({
          code: ErrorCodes.MODEL_UNAVAILABLE,
          message: 'No model provider configured',
          userMessage: '请先在设置中配置 AI 模型。',
        });
      }

      // Agent loop
      while (!this.aborted && this.stepCount < this.config.maxSteps) {
        // Check timeout
        if (Date.now() - this.startTime > this.config.maxExecutionTimeMs) {
          throw new AgentError({
            code: ErrorCodes.AGENT_TIMEOUT,
            message: 'Agent execution timeout',
            userMessage: '任务执行时间过长，已自动停止。',
          });
        }

        // Check for loop detection
        if (this.isLoopDetected()) {
          throw new AgentError({
            code: ErrorCodes.AGENT_LOOP_DETECTED,
            message: 'Agent loop detected',
            userMessage: '检测到重复操作，已自动停止。请重新描述你的需求。',
          });
        }

        // Handle pause
        while (this.paused && !this.aborted) {
          this.taskStore.updateStatus(task.id, TaskStatus.PAUSED, AgentState.PAUSED);
          onEvent({ type: 'state', data: { state: AgentState.PAUSED } });
          await sleep(500);
        }

        if (this.aborted) break;

        this.stepCount++;

        // Build context
        const contextMessages = this.contextManager.buildContext(messages, this.config.tokenBudget);

        // Get tool definitions
        const toolDefs = this.toolRegistry.getToolDefinitions();

        // Call model
        this.taskStore.updateStatus(task.id, TaskStatus.RUNNING, AgentState.THINKING);
        onEvent({ type: 'state', data: { state: AgentState.THINKING } });

        const response: ModelResponse = await provider.chat(contextMessages, toolDefs);

        // Add assistant response to messages
        messages.push({
          role: MessageRole.ASSISTANT,
          content: response.content,
          toolCalls: response.toolCalls,
        });

        // Save assistant response to history
        if (response.content) {
          this.historyStore.add(task.id, 'assistant', response.content);
        }

        // Stream response content to UI
        if (response.content) {
          onEvent({ type: 'stream', data: { content: response.content } });
        }

        // If no tool calls, the agent has completed its response
        if (!response.toolCalls || response.toolCalls.length === 0) {
          // Task complete
          this.taskStore.updateStatus(task.id, TaskStatus.COMPLETED, AgentState.COMPLETED);
          this.taskStore.updateResult(task.id, response.content);
          onEvent({ type: 'state', data: { state: AgentState.COMPLETED } });
          onEvent({ type: 'complete', data: { result: response.content } });
          break;
        }

        // Execute tool calls
        for (const toolCall of response.toolCalls) {
          if (this.aborted) break;

          const toolName = toolCall.function.name;
          let toolInput: Record<string, unknown> = {};

          try {
            toolInput = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
          } catch {
            // If arguments can't be parsed, send error back to model
            messages.push({
              role: MessageRole.TOOL,
              content: JSON.stringify({ error: 'Invalid tool arguments' }),
              toolCallId: toolCall.id,
            });
            continue;
          }

          // Add step
          const step: TaskStep = {
            id: generateId("step"),
            taskId: task.id,
            type: 'tool_call',
            title: this.getToolDisplayName(toolName),
            detail: this.formatToolDetail(toolName, toolInput),
            status: 'running',
            timestamp: Date.now(),
          };
          this.taskStore.addStep(step);
          onEvent({ type: 'step', data: step });

          // Risk evaluation
          this.taskStore.updateStatus(task.id, TaskStatus.RUNNING, AgentState.EXECUTING);
          const riskEval = this.riskEngine.evaluate({
            toolName,
            action: (toolInput['action'] as string) ?? '',
            arguments: toolInput,
            targetPath: (toolInput['path'] as string) ?? undefined,
          });

          // Permission check
          if (riskEval.requiresApproval || riskEval.blocked) {
            if (riskEval.blocked) {
              messages.push({
                role: MessageRole.TOOL,
                content: JSON.stringify({
                  error: `Operation blocked: ${riskEval.reason}`,
                  userMessage: riskEval.reason,
                }),
                toolCallId: toolCall.id,
              });
              step.status = 'failed';
              step.detail = `已阻止: ${riskEval.reason}`;
              this.taskStore.addStep({ ...step, timestamp: Date.now() });
              continue;
            }

            // Request permission
            const permRequest: PermissionRequest = {
              id: generateId('perm'),
              taskId: task.id,
              toolName,
              action: (toolInput['action'] as string) ?? 'execute',
              description: `${this.getToolDisplayName(toolName)}: ${this.formatToolDetail(toolName, toolInput)}`,
              riskLevel: riskEval.riskLevel,
              details: toolInput,
              scope: (toolInput['path'] as string) ?? '*',
              reversible: true,
              timestamp: Date.now(),
            };

            this.taskStore.updateStatus(task.id, TaskStatus.WAITING_PERMISSION, AgentState.WAITING_PERMISSION);
            onEvent({ type: 'permission_request', data: permRequest });

            const decision = await this.permissionManager.requestPermission(permRequest);

            if (decision === PermissionDecision.DENIED) {
              messages.push({
                role: MessageRole.TOOL,
                content: JSON.stringify({
                  error: 'User denied permission',
                  userMessage: '用户拒绝了此操作。',
                }),
                toolCallId: toolCall.id,
              });
              step.status = 'skipped';
              step.detail = '用户拒绝';
              this.taskStore.addStep({ ...step, timestamp: Date.now() });
              continue;
            }
          }

          // Execute tool
          onEvent({ type: 'state', data: { state: AgentState.EXECUTING } });
          const toolResult = await this.toolRegistry.execute(toolName, toolInput);

          // Record action for loop detection
          this.recentActions.push(`${toolName}:${JSON.stringify(toolInput).slice(0, 100)}`);
          if (this.recentActions.length > 20) {
            this.recentActions.shift();
          }

          // Send result back to model
          messages.push({
            role: MessageRole.TOOL,
            content: JSON.stringify({
              success: toolResult.success,
              data: toolResult.data,
              error: toolResult.error,
              userMessage: toolResult.userMessage,
            }),
            toolCallId: toolCall.id,
          });

          // Update step
          step.status = toolResult.success ? 'completed' : 'failed';
          step.detail = toolResult.userMessage;
          step.duration = Date.now() - step.timestamp;
          this.taskStore.addStep({ ...step, timestamp: Date.now() });

          onEvent({
            type: 'step',
            data: { ...step, status: step.status },
          });
        }

        // After tool execution, observe and continue
        this.taskStore.updateStatus(task.id, TaskStatus.RUNNING, AgentState.OBSERVING);
        onEvent({ type: 'state', data: { state: AgentState.OBSERVING } });
      }

      // Check if we hit max steps
      if (this.stepCount >= this.config.maxSteps && !this.aborted) {
        throw new AgentError({
          code: ErrorCodes.AGENT_MAX_STEPS,
          message: `Agent reached maximum steps: ${this.config.maxSteps}`,
          userMessage: `已达到最大执行步骤 (${this.config.maxSteps})，任务停止。`,
        });
      }

      // Handle abort
      if (this.aborted) {
        this.taskStore.updateStatus(task.id, TaskStatus.CANCELLED, AgentState.CANCELLED);
        this.taskStore.updateResult(task.id, '任务已被取消。');
        onEvent({ type: 'state', data: { state: AgentState.CANCELLED } });
      }

      return this.taskStore.get(task.id) ?? task;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const userMessage = err instanceof AgentError ? err.userMessage : '任务执行出错，请稍后重试。';
      this.taskStore.updateStatus(task.id, TaskStatus.FAILED, AgentState.FAILED);
      this.taskStore.updateResult(task.id, '', error.message);
      onEvent({ type: 'error', data: { error: userMessage, detail: sanitizeForLog(error.message) } });
      return this.taskStore.get(task.id) ?? task;
    }
  }

  /** Pause the current task */
  pause(): void {
    this.paused = true;
  }

  /** Resume the current task */
  resume(): void {
    this.paused = false;
  }

  /** Cancel the current task */
  cancel(): void {
    this.aborted = true;
    this.paused = false;
  }

  /** Interrupt with new user message */
  async interrupt(message: string): Promise<void> {
    this.paused = true;
    // The message will be handled as a new task or appended to current
    if (this.currentTask) {
      this.historyStore.add(this.currentTask.id, 'user', message);
    }
    this.paused = false;
  }

  /** Detect if the agent is in a loop */
  private isLoopDetected(): boolean {
    if (this.recentActions.length < 6) return false;
    const lastThree = this.recentActions.slice(-3);
    const prevThree = this.recentActions.slice(-6, -3);
    return JSON.stringify(lastThree) === JSON.stringify(prevThree);
  }

  /** Get human-readable tool name */
  private getToolDisplayName(name: string): string {
    const names: Record<string, string> = {
      'filesystem': '文件操作',
      'shell.execute': '执行命令',
      'windows.system': '系统信息',
      'network': '网络诊断',
      'process': '进程管理',
      'system': '系统工具',
    };
    return names[name] ?? name;
  }

  /** Format tool detail for display */
  private formatToolDetail(toolName: string, input: Record<string, unknown>): string {
    const action = input['action'] as string | undefined;
    const path = input['path'] as string | undefined;
    const command = input['command'] as string | undefined;

    if (command) return command;
    if (action && path) return `${action}: ${path}`;
    if (action) return action;
    if (path) return path;
    return JSON.stringify(input).slice(0, 100);
  }
}
