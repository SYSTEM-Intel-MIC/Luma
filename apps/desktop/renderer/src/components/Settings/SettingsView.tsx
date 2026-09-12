import React, { useState, useEffect } from 'react';

interface SettingsViewProps {
  onBack: () => void;
}

interface SettingsData {
  general?: { hotkey?: string; launchAtStartup?: boolean; language?: string; theme?: string };
  models?: { providers?: Array<Record<string, unknown>>; autoRoute?: boolean };
  agent?: { maxSteps?: number; maxExecutionTimeMs?: number };
  memory?: { enabled?: boolean; mode?: string };
  history?: { enabled?: boolean; retentionDays?: number };
}

export function SettingsView({ onBack }: SettingsViewProps): React.JSX.Element {
  const [settings, setSettings] = useState<SettingsData>({});
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const api = (window as unknown as { lumaAPI?: { getConfig?: () => Promise<SettingsData> } }).lumaAPI;
    api?.getConfig?.().then(setSettings).catch(() => setSettings({}));
  }, []);

  const tabs = [
    { id: 'general', label: '通用' },
    { id: 'models', label: '模型' },
    { id: 'agent', label: 'Agent' },
    { id: 'memory', label: '记忆' },
    { id: 'history', label: '历史' },
    { id: 'about', label: '关于' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="drag-region" style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <button
          className="no-drag"
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', marginRight: '12px',
          }}
        >
          ←
        </button>
        <span style={{ fontSize: '14px', fontWeight: 500 }}>设置</span>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', padding: '8px 16px', gap: '4px',
        borderBottom: '1px solid var(--border)',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {activeTab === 'general' && <GeneralSettings settings={settings} />}
        {activeTab === 'models' && <ModelSettings settings={settings} />}
        {activeTab === 'agent' && <AgentSettings settings={settings} />}
        {activeTab === 'memory' && <MemorySettings settings={settings} />}
        {activeTab === 'history' && <HistorySettings settings={settings} />}
        {activeTab === 'about' && <AboutSection />}
      </div>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '14px' }}>{label}</span>
      <div>{children}</div>
    </div>
  );
}

function GeneralSettings({ settings }: { settings: SettingsData }): React.JSX.Element {
  return (
    <div>
      <SettingRow label="快捷键">
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {settings.general?.hotkey ?? 'Control+Space'}
        </span>
      </SettingRow>
      <SettingRow label="开机启动">
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {settings.general?.launchAtStartup ? '开启' : '关闭'}
        </span>
      </SettingRow>
      <SettingRow label="语言">
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {settings.general?.language ?? 'zh-CN'}
        </span>
      </SettingRow>
      <SettingRow label="主题">
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {settings.general?.theme ?? 'system'}
        </span>
      </SettingRow>
    </div>
  );
}

function ModelSettings({ settings }: { settings: SettingsData }): React.JSX.Element {
  const providers = settings.models?.providers ?? [];
  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
        配置 AI 模型供应商。API Key 仅保存在本地。
      </p>
      {providers.length === 0 && (
        <p style={{ fontSize: '13px', color: 'var(--warning)', padding: '12px 0' }}>
          尚未配置模型。请在配置文件中添加 Provider 设置。
        </p>
      )}
      <SettingRow label="自动路由">
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {settings.models?.autoRoute ? '开启' : '关闭'}
        </span>
      </SettingRow>
    </div>
  );
}

function AgentSettings({ settings }: { settings: SettingsData }): React.JSX.Element {
  return (
    <div>
      <SettingRow label="最大执行步骤">
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {settings.agent?.maxSteps ?? 50}
        </span>
      </SettingRow>
      <SettingRow label="最大执行时间">
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {((settings.agent?.maxExecutionTimeMs ?? 300000) / 60000).toFixed(0)} 分钟
        </span>
      </SettingRow>
    </div>
  );
}

function MemorySettings({ settings }: { settings: SettingsData }): React.JSX.Element {
  return (
    <div>
      <SettingRow label="记忆功能">
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {settings.memory?.enabled ? '开启' : '关闭'}
        </span>
      </SettingRow>
      <SettingRow label="记忆模式">
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {settings.memory?.mode ?? 'ai_suggest'}
        </span>
      </SettingRow>
    </div>
  );
}

function HistorySettings({ settings }: { settings: SettingsData }): React.JSX.Element {
  return (
    <div>
      <SettingRow label="历史记录">
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {settings.history?.enabled ? '开启' : '关闭'}
        </span>
      </SettingRow>
      <SettingRow label="保存时长">
        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          {settings.history?.retentionDays ?? 90} 天
        </span>
      </SettingRow>
    </div>
  );
}

function AboutSection(): React.JSX.Element {
  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ fontSize: '32px', color: 'var(--accent)', marginBottom: '8px' }}>✦</div>
      <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>Luma</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        Your AI on Windows.
      </p>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        版本 0.1.0
      </p>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
        Developed by SYSTEM-Intel-MIC
      </p>
      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
        Licensed under GPL-3.0
      </p>
    </div>
  );
}
