import React, { useRef, useEffect } from 'react';
import { useAgentStore } from '../../hooks/useAgentStore.js';

interface ChatViewProps {
  task: Record<string, unknown> | null;
  onBack: () => void;
  onOpenSettings: () => void;
}

const STATE_LABELS: Record<string, string> = {
  idle: '',
  thinking: '正在思考...',
  planning: '正在规划...',
  executing: '正在执行...',
  observing: '正在观察结果...',
  verifying: '正在验证...',
  waiting_permission: '等待你的确认...',
  paused: '已暂停',
  completed: '完成',
  failed: '出错',
  cancelled: '已取消',
};

export function ChatView({ onBack, onOpenSettings }: ChatViewProps): React.JSX.Element {
  const { messages, agentState, steps, streaming } = useAgentStore();
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    useAgentStore.getState().sendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isActive = ['thinking', 'planning', 'executing', 'observing', 'verifying', 'waiting_permission'].includes(agentState);
  const isPaused = agentState === 'paused';
  const isTerminal = ['completed', 'failed', 'cancelled'].includes(agentState);
  const stateLabel = STATE_LABELS[agentState] ?? '';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="drag-region" style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        gap: '8px',
      }}>
        <span style={{ color: 'var(--accent)', fontSize: '16px' }}>✦</span>
        <span style={{ fontSize: '14px', fontWeight: 500 }}>Luma</span>
        <div style={{ flex: 1 }} />
        {(isActive || isPaused) && (
          <span className="animate-pulse" style={{ fontSize: '12px', color: isPaused ? 'var(--warning)' : 'var(--accent)' }}>
            {stateLabel}
          </span>
        )}
        <button
          className="no-drag"
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '12px',
          }}
        >
          收起
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {messages.length === 0 && !isActive && !isPaused && (
          <div style={{
            textAlign: 'center', padding: '40px 0',
            color: 'var(--text-secondary)', fontSize: '14px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', color: 'var(--accent)' }}>✦</div>
            <p>告诉 Luma 你想做什么</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {/* Steps */}
        {steps.length > 0 && (
          <div style={{ padding: '8px 0' }}>
            {steps.map((step, i) => (
              <StepItem key={i} step={step} />
            ))}
          </div>
        )}

        {/* Streaming */}
        {streaming && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            lineHeight: '1.6',
          }}>
            {streaming}
          </div>
        )}

        {/* State indicator */}
        {isActive && !streaming && (
          <div className="animate-pulse" style={{
            padding: '10px 14px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            color: 'var(--accent)',
          }}>
            {stateLabel}
          </div>
        )}

        {/* Paused indicator */}
        {isPaused && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            color: 'var(--warning)',
          }}>
            任务已暂停。点击「继续」恢复执行。
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      {(isActive || isPaused) && (
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '8px 16px',
          borderTop: '1px solid var(--border)',
        }}>
          {isPaused ? (
            <button
              onClick={() => {
                const api = (window as unknown as { lumaAPI?: { resume?: () => Promise<void> } }).lumaAPI;
                api?.resume?.();
                useAgentStore.getState().setAgentState('thinking');
              }}
              style={controlBtnStyle}
            >
              继续
            </button>
          ) : (
            <button
              onClick={() => {
                const api = (window as unknown as { lumaAPI?: { pause?: () => Promise<void> } }).lumaAPI;
                api?.pause?.();
                useAgentStore.getState().setAgentState('paused');
              }}
              style={controlBtnStyle}
            >
              暂停
            </button>
          )}
          <button
            onClick={() => {
              const api = (window as unknown as { lumaAPI?: { cancel?: () => Promise<void> } }).lumaAPI;
              api?.cancel?.();
              useAgentStore.getState().setAgentState('cancelled');
              useAgentStore.getState().setStreaming('');
            }}
            style={{ ...controlBtnStyle, color: 'var(--error)' }}
          >
            停止
          </button>
        </div>
      )}

      {/* New chat button after terminal state */}
      {isTerminal && (
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '8px 16px',
          borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={() => {
              useAgentStore.getState().reset();
            }}
            style={{ ...controlBtnStyle, flex: 1 }}
          >
            新对话
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isActive ? '正在执行中...' : '输入消息...'}
            disabled={isActive}
            style={{
              flex: 1,
              minHeight: '40px',
              maxHeight: '80px',
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              opacity: isActive ? 0.6 : 1,
            }}
          />
          <button
            onClick={onOpenSettings}
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '16px', padding: '8px',
            }}
          >
            ⚙
          </button>
        </div>
      </div>
    </div>
  );
}

const controlBtnStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  padding: '6px 16px',
  fontSize: '13px',
};

function MessageBubble({ role, content }: { role: string; content: string }): React.JSX.Element {
  const isUser = role === 'user';
  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
    }}>
      <div style={{
        maxWidth: '85%',
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        background: isUser ? 'var(--accent)' : 'var(--bg-secondary)',
        color: isUser ? '#fff' : 'var(--text-primary)',
        fontSize: '14px',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {content}
      </div>
    </div>
  );
}

function StepItem({ step }: { step: Record<string, unknown> }): React.JSX.Element {
  const status = step.status as string;
  const icon = status === 'completed' ? '✓' : status === 'failed' ? '✗' : status === 'running' ? '●' : status === 'skipped' ? '⊘' : '○';
  const color = status === 'completed' ? 'var(--success)' : status === 'failed' ? 'var(--error)' : status === 'running' ? 'var(--accent)' : status === 'skipped' ? 'var(--warning)' : 'var(--text-secondary)';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 0',
      fontSize: '13px',
    }}>
      <span style={{ color, width: '16px', textAlign: 'center' }}>{icon}</span>
      <span style={{ color: 'var(--text-primary)' }}>{step.title as string}</span>
      {typeof step.detail === 'string' && step.detail && (
        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
          {step.detail}
        </span>
      )}
    </div>
  );
}
