import React, { useState, useCallback } from 'react';
import { FloatingUI } from './components/FloatingUI/FloatingUI.js';
import { ChatView } from './components/Chat/ChatView.js';
import { PermissionDialog } from './components/Permission/PermissionDialog.js';
import { SettingsView } from './components/Settings/SettingsView.js';
import { useAgentStore } from './hooks/useAgentStore.js';

type View = 'idle' | 'chat' | 'settings' | 'permission';

export function App(): React.JSX.Element {
  const [view, setView] = useState<View>('idle');
  const { currentTask, permissionRequest } = useAgentStore();

  const handleSendMessage = useCallback((message: string) => {
    setView('chat');
    useAgentStore.getState().sendMessage(message);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setView('settings');
  }, []);

  const handleBack = useCallback(() => {
    setView('idle');
  }, []);

  const handlePermissionRequest = useCallback((requestId: string) => {
    setView('permission');
  }, []);

  // Listen for permission requests from main process
  React.useEffect(() => {
    const api = (window as unknown as { lumaAPI?: { onPermissionRequest?: (cb: (req: unknown) => void) => void } }).lumaAPI;
    if (api?.onPermissionRequest) {
      api.onPermissionRequest((request: unknown) => {
        useAgentStore.getState().setPermissionRequest(request as Record<string, unknown>);
        setView('permission');
      });
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--bg-primary)', borderRadius: 'var(--radius)' }}>
      {view === 'idle' && (
        <FloatingUI
          onSendMessage={handleSendMessage}
          onOpenSettings={handleOpenSettings}
        />
      )}
      {view === 'chat' && (
        <ChatView
          task={currentTask}
          onBack={handleBack}
          onOpenSettings={handleOpenSettings}
        />
      )}
      {view === 'settings' && (
        <SettingsView onBack={handleBack} />
      )}
      {view === 'permission' && permissionRequest && (
        <PermissionDialog
          request={permissionRequest}
          onRespond={(decision: string) => {
            useAgentStore.getState().respondToPermission(permissionRequest.id as string, decision);
            setView('chat');
          }}
        />
      )}
    </div>
  );
}
