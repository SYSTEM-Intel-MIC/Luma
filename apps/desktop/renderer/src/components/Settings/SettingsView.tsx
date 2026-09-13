import React, { useState, useEffect, useCallback } from 'react';

interface SettingsViewProps {
  onBack: () => void;
}

interface GeneralConfig {
  hotkey: string;
  launchAtStartup: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
  autoHide: boolean;
  animations: boolean;
}

interface ProviderEntry {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  models: string[];
}

interface ModelConfig {
  providers: ProviderEntry[];
  autoRoute: boolean;
}

interface AgentCfg {
  maxSteps: number;
  maxExecutionTimeMs: number;
  toolTimeoutMs: number;
  retryLimit: number;
  tokenBudget: number;
  autoExecuteLevel: number;
}

interface MemoryConfig {
  enabled: boolean;
  mode: 'ai_suggest' | 'always_ask' | 'never';
  maxEntries: number;
}

interface HistoryConfig {
  enabled: boolean;
  retentionDays: number;
  maxEntries: number;
}

interface SettingsData {
  general?: GeneralConfig;
  models?: ModelConfig;
  agent?: AgentCfg;
  memory?: MemoryConfig;
  history?: HistoryConfig;
}

function getApi() {
  return (window as unknown as {
    lumaAPI?: {
      getConfig?: () => Promise<SettingsData>;
      setConfig?: (key: string, value: unknown) => Promise<void>;
    };
  }).lumaAPI;
}

export function SettingsView({ onBack }: SettingsViewProps): React.JSX.Element {
  const [settings, setSettings] = useState<SettingsData>({});
  const [activeTab, setActiveTab] = useState('general');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const api = getApi();
    api?.getConfig?.().then(setSettings).catch(() => {});
  }, []);

  const save = useCallback(async (key: string, value: unknown) => {
    const api = getApi();
    if (!api?.setConfig) return;
    await api.setConfig(key, value);
    setDirty(false);
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
      <div className="drag-region" style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <button
          className="no-drag"
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', marginRight: '12px', fontSize: '16px',
          }}
        >
          ←
        </button>
        <span style={{ fontSize: '14px', fontWeight: 500 }}>设置</span>
        {dirty && (
          <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--warning)' }}>
            (未保存)
          </span>
        )}
      </div>

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

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {activeTab === 'general' && (
          <GeneralSettings settings={settings.general} save={save} setDirty={setDirty} />
        )}
        {activeTab === 'models' && (
          <ModelSettings settings={settings.models} save={save} setDirty={setDirty} />
        )}
        {activeTab === 'agent' && (
          <AgentSettings settings={settings.agent} save={save} setDirty={setDirty} />
        )}
        {activeTab === 'memory' && (
          <MemorySettings settings={settings.memory} save={save} setDirty={setDirty} />
        )}
        {activeTab === 'history' && (
          <HistorySettings settings={settings.history} save={save} setDirty={setDirty} />
        )}
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

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }): React.JSX.Element {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '40px', height: '22px', borderRadius: '11px', border: 'none',
        background: checked ? 'var(--accent)' : 'var(--border)',
        cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: '3px', left: checked ? '21px' : '3px',
        width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

function NumberInput({ value, min, max, onChange }: {
  value: number; min?: number; max?: number; onChange: (v: number) => void;
}): React.JSX.Element {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => {
        const v = parseInt(e.target.value, 10);
        if (!isNaN(v)) onChange(v);
      }}
      style={{
        width: '72px', padding: '6px 10px', borderRadius: '6px',
        border: '1px solid var(--border)', background: 'var(--bg-primary)',
        color: 'var(--text-primary)', fontSize: '13px', textAlign: 'right',
      }}
    />
  );
}

function Select({ value, options, onChange }: {
  value: string; options: Array<{ label: string; value: string }>; onChange: (v: string) => void;
}): React.JSX.Element {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '6px 10px', borderRadius: '6px',
        border: '1px solid var(--border)', background: 'var(--bg-primary)',
        color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function GeneralSettings({ settings, save, setDirty }: {
  settings?: GeneralConfig;
  save: (key: string, value: unknown) => Promise<void>;
  setDirty: (v: boolean) => void;
}): React.JSX.Element {
  const g = settings ?? { hotkey: 'Control+Space', launchAtStartup: true, language: 'zh-CN', theme: 'system' as const, autoHide: true, animations: true };

  const update = async (field: string, value: unknown) => {
    setDirty(true);
    await save(`general.${field}`, value);
  };

  return (
    <div>
      <SettingRow label="快捷键">
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{g.hotkey}</span>
      </SettingRow>
      <SettingRow label="开机启动">
        <Toggle checked={g.launchAtStartup} onChange={(v) => update('launchAtStartup', v)} />
      </SettingRow>
      <SettingRow label="语言">
        <Select
          value={g.language}
          options={[
            { label: '简体中文', value: 'zh-CN' },
            { label: 'English', value: 'en' },
          ]}
          onChange={(v) => update('language', v)}
        />
      </SettingRow>
      <SettingRow label="主题">
        <Select
          value={g.theme}
          options={[
            { label: '跟随系统', value: 'system' },
            { label: '浅色', value: 'light' },
            { label: '深色', value: 'dark' },
          ]}
          onChange={(v) => update('theme', v)}
        />
      </SettingRow>
      <SettingRow label="自动隐藏">
        <Toggle checked={g.autoHide} onChange={(v) => update('autoHide', v)} />
      </SettingRow>
      <SettingRow label="动画">
        <Toggle checked={g.animations} onChange={(v) => update('animations', v)} />
      </SettingRow>
    </div>
  );
}

function ModelSettings({ settings, save, setDirty }: {
  settings?: ModelConfig;
  save: (key: string, value: unknown) => Promise<void>;
  setDirty: (v: boolean) => void;
}): React.JSX.Element {
  const [editing, setEditing] = useState<ProviderEntry | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [providerName, setProviderName] = useState('');
  const providers = settings?.providers ?? [];

  const startAdd = () => {
    setEditing({ id: Date.now().toString(), name: '', apiKey: '', baseUrl: '', models: [] });
    setApiKey('');
    setBaseUrl('');
    setProviderName('');
  };

  const saveProvider = async () => {
    if (!editing) return;
    const updated: ProviderEntry = { ...editing, name: providerName, apiKey, baseUrl };
    const newProviders = [...providers.filter((p) => p.id !== editing.id), updated];
    setDirty(true);
    await save('models.providers', newProviders);
    setEditing(null);
  };

  const deleteProvider = async (id: string) => {
    const newProviders = providers.filter((p) => p.id !== id);
    setDirty(true);
    await save('models.providers', newProviders);
  };

  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
        配置 AI 模型供应商。API Key 仅保存在本地。
      </p>

      {providers.map((p) => (
        <div key={p.id} style={{
          padding: '12px', marginBottom: '8px', borderRadius: '8px',
          border: '1px solid var(--border)', background: 'var(--bg-secondary)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{p.name || '未命名'}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setEditing(p);
                  setProviderName(p.name);
                  setApiKey(p.apiKey);
                  setBaseUrl(p.baseUrl);
                }}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent)',
                  cursor: 'pointer', fontSize: '12px',
                }}
              >
                编辑
              </button>
              <button
                onClick={() => deleteProvider(p.id)}
                style={{
                  background: 'none', border: 'none', color: 'var(--error)',
                  cursor: 'pointer', fontSize: '12px',
                }}
              >
                删除
              </button>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {p.baseUrl || '默认地址'}
          </p>
        </div>
      ))}

      {editing && (
        <div style={{
          padding: '16px', marginTop: '8px', borderRadius: '8px',
          border: '1px solid var(--accent)', background: 'var(--bg-secondary)',
        }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>名称</label>
            <input
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="例如: OpenAI"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '6px',
                border: '1px solid var(--border)', background: 'var(--bg-primary)',
                color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '6px',
                border: '1px solid var(--border)', background: 'var(--bg-primary)',
                color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Base URL（可选）</label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '6px',
                border: '1px solid var(--border)', background: 'var(--bg-primary)',
                color: 'var(--text-primary)', fontSize: '13px', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setEditing(null)}
              style={{
                padding: '6px 16px', borderRadius: '6px',
                border: '1px solid var(--border)', background: 'var(--bg-primary)',
                color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px',
              }}
            >
              取消
            </button>
            <button
              onClick={saveProvider}
              style={{
                padding: '6px 16px', borderRadius: '6px',
                border: 'none', background: 'var(--accent)',
                color: '#fff', cursor: 'pointer', fontSize: '13px',
              }}
            >
              保存
            </button>
          </div>
        </div>
      )}

      {!editing && (
        <button
          onClick={startAdd}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px',
            border: '1px dashed var(--border)', background: 'transparent',
            color: 'var(--accent)', cursor: 'pointer', fontSize: '13px', marginTop: '8px',
          }}
        >
          + 添加供应商
        </button>
      )}

      <div style={{ marginTop: '16px' }}>
        <SettingRow label="自动路由">
          <Toggle
            checked={settings?.autoRoute ?? true}
            onChange={(v) => { setDirty(true); save('models.autoRoute', v); }}
          />
        </SettingRow>
      </div>
    </div>
  );
}

function AgentSettings({ settings, save, setDirty }: {
  settings?: AgentCfg;
  save: (key: string, value: unknown) => Promise<void>;
  setDirty: (v: boolean) => void;
}): React.JSX.Element {
  const a = settings ?? { maxSteps: 50, maxExecutionTimeMs: 300000, toolTimeoutMs: 30000, retryLimit: 3, tokenBudget: 128000, autoExecuteLevel: 1 };

  const update = async (field: string, value: unknown) => {
    setDirty(true);
    await save(`agent.${field}`, value);
  };

  return (
    <div>
      <SettingRow label="最大执行步骤">
        <NumberInput
          value={a.maxSteps}
          min={1}
          max={200}
          onChange={(v) => update('maxSteps', v)}
        />
      </SettingRow>
      <SettingRow label="最大执行时间（分钟）">
        <NumberInput
          value={Math.round(a.maxExecutionTimeMs / 60000)}
          min={1}
          max={60}
          onChange={(v) => update('maxExecutionTimeMs', v * 60000)}
        />
      </SettingRow>
      <SettingRow label="工具超时（秒）">
        <NumberInput
          value={Math.round(a.toolTimeoutMs / 1000)}
          min={5}
          max={300}
          onChange={(v) => update('toolTimeoutMs', v * 1000)}
        />
      </SettingRow>
      <SettingRow label="重试次数">
        <NumberInput
          value={a.retryLimit}
          min={0}
          max={10}
          onChange={(v) => update('retryLimit', v)}
        />
      </SettingRow>
      <SettingRow label="Token 预算">
        <NumberInput
          value={a.tokenBudget}
          min={1000}
          max={1000000}
          onChange={(v) => update('tokenBudget', v)}
        />
      </SettingRow>
      <SettingRow label="自动执行级别">
        <Select
          value={String(a.autoExecuteLevel)}
          options={[
            { label: '全部询问', value: '0' },
            { label: '低风险自动', value: '1' },
            { label: '中低风险自动', value: '2' },
            { label: '全部自动', value: '3' },
          ]}
          onChange={(v) => update('autoExecuteLevel', parseInt(v, 10))}
        />
      </SettingRow>
    </div>
  );
}

function MemorySettings({ settings, save, setDirty }: {
  settings?: MemoryConfig;
  save: (key: string, value: unknown) => Promise<void>;
  setDirty: (v: boolean) => void;
}): React.JSX.Element {
  const m = settings ?? { enabled: true, mode: 'ai_suggest' as const, maxEntries: 1000 };

  return (
    <div>
      <SettingRow label="记忆功能">
        <Toggle
          checked={m.enabled}
          onChange={(v) => { setDirty(true); save('memory.enabled', v); }}
        />
      </SettingRow>
      <SettingRow label="记忆模式">
        <Select
          value={m.mode}
          options={[
            { label: 'AI 建议', value: 'ai_suggest' },
            { label: '每次询问', value: 'always_ask' },
            { label: '从不', value: 'never' },
          ]}
          onChange={(v) => { setDirty(true); save('memory.mode', v); }}
        />
      </SettingRow>
      <SettingRow label="最大条目数">
        <NumberInput
          value={m.maxEntries}
          min={10}
          max={50000}
          onChange={(v) => { setDirty(true); save('memory.maxEntries', v); }}
        />
      </SettingRow>
    </div>
  );
}

function HistorySettings({ settings, save, setDirty }: {
  settings?: HistoryConfig;
  save: (key: string, value: unknown) => Promise<void>;
  setDirty: (v: boolean) => void;
}): React.JSX.Element {
  const h = settings ?? { enabled: true, retentionDays: 90, maxEntries: 10000 };

  return (
    <div>
      <SettingRow label="历史记录">
        <Toggle
          checked={h.enabled}
          onChange={(v) => { setDirty(true); save('history.enabled', v); }}
        />
      </SettingRow>
      <SettingRow label="保存时长（天）">
        <NumberInput
          value={h.retentionDays}
          min={1}
          max={365}
          onChange={(v) => { setDirty(true); save('history.retentionDays', v); }}
        />
      </SettingRow>
      <SettingRow label="最大条目数">
        <NumberInput
          value={h.maxEntries}
          min={100}
          max={100000}
          onChange={(v) => { setDirty(true); save('history.maxEntries', v); }}
        />
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
