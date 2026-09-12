import React, { useState, useRef, useEffect } from 'react';

interface FloatingUIProps {
  onSendMessage: (message: string) => void;
  onOpenSettings: () => void;
}

export function FloatingUI({ onSendMessage, onOpenSettings }: FloatingUIProps): React.JSX.Element {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{
        textAlign: 'center',
        marginBottom: '16px',
      }}>
        <span style={{ fontSize: '28px', fontWeight: 300, color: 'var(--accent)' }}>✦</span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="你想让我做什么？"
          style={{
            width: '100%',
            minHeight: '48px',
            maxHeight: '120px',
            padding: '14px 48px 14px 16px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            lineHeight: '1.5',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        {/* Actions */}
        <div style={{
          position: 'absolute',
          right: '12px',
          bottom: '12px',
          display: 'flex',
          gap: '4px',
        }}>
          <button
            type="button"
            onClick={onOpenSettings}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px',
              borderRadius: '4px',
            }}
            title="设置"
          >
            ⚙
          </button>
        </div>
      </form>

      {/* Hint */}
      <div style={{
        textAlign: 'center',
        marginTop: '12px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        opacity: 0.6,
      }}>
        Ctrl+Space 唤起 · 输入目标，Luma 来完成
      </div>
    </div>
  );
}
