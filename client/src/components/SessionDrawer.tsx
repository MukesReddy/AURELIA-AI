import React from 'react';
import { X, MessageSquare, Trash2, Plus, Calendar, Clock } from 'lucide-react';
import type { PlanningSession } from '../types';

interface SessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: PlanningSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

export const SessionDrawer: React.FC<SessionDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}) => {
  if (!isOpen) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer-panel glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title-group">
            <MessageSquare size={18} className="text-accent" />
            <h3>Planning Sessions</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close Drawer">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-action-bar">
          <button
            className="btn btn-primary btn-sm btn-full-width"
            onClick={() => {
              onNewSession();
              onClose();
            }}
          >
            <Plus size={15} />
            <span>Start New Session</span>
          </button>
        </div>

        <div className="drawer-sessions-list">
          {sessions.length === 0 ? (
            <div className="drawer-empty-state">
              <p>No saved sessions yet.</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              const dateStr = new Date(sess.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });
              const timeStr = new Date(sess.updatedAt).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={sess.id}
                  className={`session-item-card ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelectSession(sess.id);
                    onClose();
                  }}
                >
                  <div className="session-item-content">
                    <div className="session-title-line">
                      <span className="session-title-text">{sess.title}</span>
                    </div>
                    <div className="session-meta-row">
                      <span className="session-time">
                        <Calendar size={11} /> {dateStr} <Clock size={11} /> {timeStr}
                      </span>
                      <span className="session-msg-badge">
                        {sess.messages.length} msg{sess.messages.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>

                  <button
                    className="session-delete-btn"
                    title="Delete session"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this planning session?')) {
                        onDeleteSession(sess.id);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};
