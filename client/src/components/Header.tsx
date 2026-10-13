import React from 'react';
import {
  Sparkles,
  CheckSquare,
  Compass,
  Volume2,
  VolumeX,
  Plus,
  Layers,
  Activity,
  AlertCircle
} from 'lucide-react';
import type { ServerHealth } from '../types';
import { sounds } from '../utils/sound';

interface HeaderProps {
  currentView: 'studio' | 'board' | 'frameworks';
  setCurrentView: (view: 'studio' | 'board' | 'frameworks') => void;
  health: ServerHealth | null;
  activeTasksCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onNewSession: () => void;
  onToggleDrawer: () => void;
  sessionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  health,
  activeTasksCount,
  soundEnabled,
  setSoundEnabled,
  onNewSession,
  onToggleDrawer,
  sessionCount,
}) => {
  const toggleSound = () => {
    const next = !soundEnabled;
    sounds.setEnabled(next);
    setSoundEnabled(next);
    if (next) sounds.playSend();
  };

  return (
    <header className="header-container" id="main-header">
      <div className="header-left">
        <button
          className="brand-badge-btn"
          onClick={() => setCurrentView('studio')}
          title="Aurelia AI Planning Studio"
        >
          <div className="brand-icon-wrapper">
            <Sparkles className="brand-sparkle-icon" size={18} />
          </div>
          <div className="brand-text-block">
            <div className="brand-title-row">
              <span className="brand-name">AURELIA</span>
              <span className="brand-badge-ai">AI</span>
            </div>
            <span className="brand-subtitle">Planning & Productivity Intelligence</span>
          </div>
        </button>

        {/* Health status pill */}
        <div className="health-status-container">
          {health?.ok && health?.configured ? (
            <span className="status-pill status-pill-success" title="Connected to Lyzr AI Agent">
              <span className="status-dot status-dot-active status-dot-pulse" />
              <span>Agent Connected</span>
            </span>
          ) : health?.ok && !health?.configured ? (
            <span className="status-pill status-pill-warning" title="Missing Lyzr credentials in server/.env">
              <AlertCircle size={12} />
              <span>Config Pending</span>
            </span>
          ) : (
            <span className="status-pill status-pill-error" title="Checking server connection...">
              <Activity size={12} />
              <span>Connecting...</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="header-nav-tabs" aria-label="Main Navigation">
        <button
          id="nav-tab-studio"
          className={`nav-tab-btn ${currentView === 'studio' ? 'active' : ''}`}
          onClick={() => setCurrentView('studio')}
        >
          <Sparkles size={16} />
          <span>Planning Studio</span>
        </button>

        <button
          id="nav-tab-board"
          className={`nav-tab-btn ${currentView === 'board' ? 'active' : ''}`}
          onClick={() => setCurrentView('board')}
        >
          <CheckSquare size={16} />
          <span>Action Board</span>
          {activeTasksCount > 0 && (
            <span className="nav-counter-badge">{activeTasksCount}</span>
          )}
        </button>

        <button
          id="nav-tab-frameworks"
          className={`nav-tab-btn ${currentView === 'frameworks' ? 'active' : ''}`}
          onClick={() => setCurrentView('frameworks')}
        >
          <Compass size={16} />
          <span>Frameworks</span>
        </button>
      </nav>

      {/* Header Right Actions */}
      <div className="header-right-actions">
        <button
          id="btn-toggle-sound"
          className="btn-icon"
          onClick={toggleSound}
          title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          aria-label="Toggle Sound"
        >
          {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>

        <button
          id="btn-session-history"
          className="btn-secondary btn-sm"
          onClick={onToggleDrawer}
          title="Session History"
        >
          <Layers size={15} />
          <span className="hide-on-mobile">Sessions</span>
          <span className="session-count-tag">{sessionCount}</span>
        </button>

        <button
          id="btn-new-plan-session"
          className="btn-primary btn-sm"
          onClick={onNewSession}
          title="Start fresh planning session"
        >
          <Plus size={16} />
          <span>New Session</span>
        </button>
      </div>
    </header>
  );
};
