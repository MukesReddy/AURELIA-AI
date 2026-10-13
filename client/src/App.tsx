import { useState, useEffect, useCallback } from 'react';
import type { ChatMessage, ExtractedPlan, PlanningSession, ServerHealth } from './types';
import { fetchServerHealth, getOrCreateUserId, sendChatMessage } from './services/api';
import { sounds } from './utils/sound';
import { parsePlanFromMarkdown } from './utils/planParser';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { ActionBoardView } from './components/ActionBoardView';
import { FrameworksView } from './components/FrameworksView';
import { PlanWizardModal } from './components/PlanWizardModal';
import { SessionDrawer } from './components/SessionDrawer';
import './App.css';

const SESSIONS_STORAGE_KEY = 'aurelia_sessions_v1';
const ACTIVE_SESSION_ID_KEY = 'aurelia_active_session_id';

function createNewSessionObject(title = 'New Planning Session'): PlanningSession {
  return {
    id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
    activePlan: undefined,
  };
}

export function App() {
  const [currentView, setCurrentView] = useState<'studio' | 'board' | 'frameworks'>('studio');
  const [sessions, setSessions] = useState<PlanningSession[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return [createNewSessionObject()];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const saved = localStorage.getItem(ACTIVE_SESSION_ID_KEY);
    return saved || sessions[0]?.id || '';
  });

  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(sounds.isEnabled());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
      localStorage.setItem(ACTIVE_SESSION_ID_KEY, activeSessionId);
    } catch {
      // Ignore
    }
  }, [sessions, activeSessionId]);

  // Check backend health
  const checkHealth = useCallback(async () => {
    const res = await fetchServerHealth();
    setHealth(res);
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30_000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Handlers for session management
  const handleNewSession = () => {
    const newSess = createNewSessionObject();
    setSessions((prev) => [newSess, ...prev]);
    setActiveSessionId(newSess.id);
    setCurrentView('studio');
    setError(null);
  };

  const handleDeleteSession = (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const fresh = createNewSessionObject();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      setSessions(remaining);
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
    }
  };

  // Update active session plan
  const handleUpdatePlan = (updatedPlan: ExtractedPlan) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, activePlan: updatedPlan, updatedAt: Date.now() } : s))
    );
  };

  // Extract plan from assistant message
  const handleExtractPlan = (plan: ExtractedPlan) => {
    handleUpdatePlan(plan);
    setCurrentView('board');
  };

  // Send message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setError(null);
    sounds.playSend();

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    // Update session title if first message
    const currentMessages = activeSession?.messages || [];
    const isFirstMessage = currentMessages.length === 0;
    const sessionTitle = isFirstMessage
      ? text.length > 38
        ? `${text.slice(0, 38)}...`
        : text
      : activeSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: sessionTitle,
              messages: [...s.messages, userMsg],
              updatedAt: Date.now(),
            }
          : s
      )
    );

    setIsLoading(true);

    try {
      const answer = await sendChatMessage(text.trim(), activeSessionId, getOrCreateUserId());
      sounds.playReceive();

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        content: answer,
        timestamp: Date.now(),
      };

      // Auto-extract into board if no active plan exists yet
      let autoPlan: ExtractedPlan | undefined = activeSession?.activePlan;
      if (!autoPlan) {
        const parsed = parsePlanFromMarkdown(answer, sessionTitle);
        if (parsed.tasks.length > 0 || parsed.schedule.length > 0) {
          autoPlan = parsed;
        }
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: [...s.messages, assistantMsg],
                activePlan: autoPlan,
                updatedAt: Date.now(),
              }
            : s
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reach Aurelia AI.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    const lastUserMsg = activeSession?.messages.filter((m) => m.role === 'user').slice(-1)[0];
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  // Count active tasks for Action Board badge
  const activeTasksCount =
    activeSession?.activePlan?.tasks.filter((t) => !t.completed).length || 0;

  return (
    <div className="app-layout">
      {/* Ambient background glow layers */}
      <div className="ambient-background" aria-hidden="true">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
        <div className="grid-overlay" />
      </div>

      {/* Main Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        health={health}
        activeTasksCount={activeTasksCount}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onNewSession={handleNewSession}
        onToggleDrawer={() => setIsDrawerOpen(true)}
        sessionCount={sessions.length}
      />

      {/* Main Content Area */}
      <main className="main-content-viewport">
        {currentView === 'studio' && (
          <ChatView
            messages={activeSession?.messages || []}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onOpenWizard={() => setIsWizardOpen(true)}
            onExtractPlan={handleExtractPlan}
            error={error}
            onRetry={handleRetry}
          />
        )}

        {currentView === 'board' && (
          <ActionBoardView
            plan={activeSession?.activePlan || null}
            onUpdatePlan={handleUpdatePlan}
            onOpenStudio={() => setCurrentView('studio')}
          />
        )}

        {currentView === 'frameworks' && (
          <FrameworksView
            onSelectFramework={(prompt) => {
              setCurrentView('studio');
              handleSendMessage(prompt);
            }}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <PlanWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSubmitPlanPrompt={(prompt) => {
          setCurrentView('studio');
          handleSendMessage(prompt);
        }}
      />

      <SessionDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setCurrentView('studio');
        }}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />
    </div>
  );
}

export default App;
