import React from 'react';

interface PermissionDialogProps {
  request: Record<string, unknown>;
  onRespond: (decision: string) => void;
}

export function PermissionDialog({ request, onRespond }: PermissionDialogProps): React.JSX.Element {
  const riskLevel = request.riskLevel as number;
  const riskLabels: Record<number, string> = {
    0: '安全', 1: '低风险', 2: '中风险', 3: '高风险', 4: '危险',
  };
  const riskColors: Record<number, string> = {
    0: 'var(--success)', 1: 'var(--success)', 2: 'var(--warning)', 3: 'var(--error)', 4: 'var(--error)',
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>需要你的确认</span>
        </div>

        <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '12px' }}>
          {request.description as string}
        </p>

        <div style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: '4px',
          background: riskColors[riskLevel] ?? 'var(--text-secondary)',
          color: '#fff',
          fontSize: '12px',
          marginBottom: '20px',
        }}>
          {riskLabels[riskLevel] ?? '未知风险'}
        </div>

        {request.reversible === false && (
          <p style={{ fontSize: '13px', color: 'var(--warning)', marginBottom: '16px' }}>
            此操作不可撤销。
          </p>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onRespond('denied')}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            取消
          </button>
          <button
            onClick={() => onRespond('granted')}
            style={{
              padding: '8px 20px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            允许
          </button>
        </div>
      </div>
    </div>
  );
}
