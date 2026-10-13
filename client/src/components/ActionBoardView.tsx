import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Clock,
  ListTodo,
  Grid,
  Download,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import type { ExtractedPlan, PriorityLevel, TaskItem } from '../types';
import { sounds } from '../utils/sound';

interface ActionBoardViewProps {
  plan: ExtractedPlan | null;
  onUpdatePlan: (updated: ExtractedPlan) => void;
  onOpenStudio: () => void;
}

export const ActionBoardView: React.FC<ActionBoardViewProps> = ({
  plan,
  onUpdatePlan,
  onOpenStudio,
}) => {
  const [boardTab, setBoardTab] = useState<'tasks' | 'schedule' | 'matrix'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<PriorityLevel>('medium');
  const [copied, setCopied] = useState(false);

  // If no plan is active yet, show an empty state prompting extraction
  if (!plan || (plan.tasks.length === 0 && plan.schedule.length === 0 && plan.quadrants.length === 0)) {
    return (
      <div className="action-board-empty glass-card animate-fade-in">
        <div className="empty-board-icon">
          <ListTodo size={42} className="text-accent" />
        </div>
        <h2>No Active Action Board Yet</h2>
        <p>
          Generate a plan with Aurelia AI in the <strong>Planning Studio</strong>, then click{' '}
          <span className="badge-inline">Extract to Action Board</span> to turn the advice into interactive tasks,
          time-blocks, and priority matrices.
        </p>
        <button className="btn btn-primary btn-lg" onClick={onOpenStudio}>
          <Sparkles size={18} />
          <span>Go to Planning Studio</span>
        </button>
      </div>
    );
  }

  // Stats calculation
  const totalTasks = plan.tasks.length;
  const completedTasks = plan.tasks.filter((t) => t.completed).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Toggle Task Completion
  const toggleTask = (taskId: string) => {
    const nextTasks = plan.tasks.map((task) => {
      if (task.id === taskId) {
        const nextState = !task.completed;
        if (nextState) {
          sounds.playTaskComplete();
          // Trigger confetti
          try {
            confetti({
              particleCount: 40,
              spread: 60,
              origin: { y: 0.8 },
              colors: ['#8b5cf6', '#38bdf8', '#10b981', '#f59e0b'],
            });
          } catch {
            // Ignore confetti fallback
          }
        }
        return { ...task, completed: nextState };
      }
      return task;
    });

    onUpdatePlan({
      ...plan,
      tasks: nextTasks,
    });
  };

  // Add Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: newTaskText.trim(),
      completed: false,
      priority: newTaskPriority,
      category: 'General',
    };

    onUpdatePlan({
      ...plan,
      tasks: [newTask, ...plan.tasks],
    });
    setNewTaskText('');
  };

  // Delete Task
  const deleteTask = (taskId: string) => {
    onUpdatePlan({
      ...plan,
      tasks: plan.tasks.filter((t) => t.id !== taskId),
    });
  };

  // Copy Plan as Markdown
  const handleCopyMarkdown = () => {
    let md = `# ${plan.title}\n\n`;
    if (plan.tasks.length > 0) {
      md += `## Action Items\n`;
      plan.tasks.forEach((t) => {
        md += `- [${t.completed ? 'x' : ' '}] [${t.priority.toUpperCase()}] ${t.text}\n`;
      });
      md += `\n`;
    }
    if (plan.schedule.length > 0) {
      md += `## Schedule\n`;
      plan.schedule.forEach((s) => {
        md += `- **${s.time}**: ${s.title}${s.details ? ` (${s.details})` : ''}\n`;
      });
      md += `\n`;
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Markdown file
  const handleDownloadMarkdown = () => {
    let md = `# ${plan.title}\n\n*Created with Aurelia AI on ${new Date(plan.extractedAt).toLocaleString()}*\n\n`;
    if (plan.tasks.length > 0) {
      md += `## Action Checklist\n`;
      plan.tasks.forEach((t) => {
        md += `- [${t.completed ? 'x' : ' '}] [${t.priority.toUpperCase()}] ${t.text}\n`;
      });
      md += `\n`;
    }
    if (plan.schedule.length > 0) {
      md += `## Time Schedule\n`;
      plan.schedule.forEach((s) => {
        md += `- **${s.time}**: ${s.title}${s.details ? ` (${s.details})` : ''}\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_plan.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered tasks
  const filteredTasks = plan.tasks.filter((t) => {
    if (taskFilter === 'active') return !t.completed;
    if (taskFilter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="action-board-container animate-fade-in">
      {/* Board Top Header */}
      <div className="board-top-card glass-card">
        <div className="board-title-col">
          <div className="board-title-badge">
            <Sparkles size={14} className="text-accent" />
            <span>Active Action Blueprint</span>
          </div>
          <h2>{plan.title}</h2>
          <p className="board-date-subtitle">
            Extracted {new Date(plan.extractedAt).toLocaleDateString()} at{' '}
            {new Date(plan.extractedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Progress summary & actions */}
        <div className="board-progress-col">
          <div className="progress-metrics-row">
            <span className="progress-label">Completion Status</span>
            <span className="progress-value">
              {completedTasks} / {totalTasks} ({completionPercentage}%)
            </span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="board-quick-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleCopyMarkdown}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy MD'}</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleDownloadMarkdown}>
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Board Navigation Tabs */}
      <div className="board-nav-row">
        <div className="board-tabs-group">
          <button
            className={`board-tab-btn ${boardTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setBoardTab('tasks')}
          >
            <ListTodo size={16} />
            <span>Tasks Checklist ({plan.tasks.length})</span>
          </button>
          <button
            className={`board-tab-btn ${boardTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setBoardTab('schedule')}
          >
            <Clock size={16} />
            <span>Schedule Blocks ({plan.schedule.length})</span>
          </button>
          <button
            className={`board-tab-btn ${boardTab === 'matrix' ? 'active' : ''}`}
            onClick={() => setBoardTab('matrix')}
          >
            <Grid size={16} />
            <span>Priority Matrix</span>
          </button>
        </div>

        {boardTab === 'tasks' && (
          <div className="filter-chips-row">
            <Filter size={13} className="text-muted" />
            <button
              className={`filter-chip ${taskFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTaskFilter('all')}
            >
              All ({plan.tasks.length})
            </button>
            <button
              className={`filter-chip ${taskFilter === 'active' ? 'active' : ''}`}
              onClick={() => setTaskFilter('active')}
            >
              Active ({plan.tasks.filter((t) => !t.completed).length})
            </button>
            <button
              className={`filter-chip ${taskFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setTaskFilter('completed')}
            >
              Done ({plan.tasks.filter((t) => t.completed).length})
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: TASKS CHECKLIST */}
      {boardTab === 'tasks' && (
        <div className="tasks-tab-view">
          {/* Add Task Input Bar */}
          <form onSubmit={handleAddTask} className="add-task-form glass-card">
            <input
              type="text"
              placeholder="Add an actionable next step or milestone..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="add-task-input"
            />
            <div className="add-task-controls">
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as PriorityLevel)}
                className="priority-select"
                aria-label="Task Priority"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium</option>
                <option value="low">Low Priority</option>
              </select>
              <button type="submit" className="btn btn-primary btn-sm" disabled={!newTaskText.trim()}>
                <Plus size={16} />
                <span>Add Step</span>
              </button>
            </div>
          </form>

          {/* Task list items */}
          <div className="tasks-items-list">
            {filteredTasks.length === 0 ? (
              <div className="empty-tasks-placeholder glass-card">
                <p>No tasks match your current filter.</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-row-card glass-card ${task.completed ? 'task-completed' : ''}`}
                >
                  <button
                    className="task-checkbox-btn"
                    onClick={() => toggleTask(task.id)}
                    aria-label={`Mark task as ${task.completed ? 'incomplete' : 'completed'}`}
                  >
                    {task.completed ? (
                      <CheckCircle2 size={20} className="check-icon-done" />
                    ) : (
                      <Circle size={20} className="check-icon-pending" />
                    )}
                  </button>

                  <div className="task-body">
                    <span className="task-text">{task.text}</span>
                    <div className="task-tags-row">
                      <span className={`priority-tag priority-${task.priority}`}>
                        {task.priority.toUpperCase()}
                      </span>
                      {task.category && (
                        <span className="category-tag">{task.category}</span>
                      )}
                    </div>
                  </div>

                  <button
                    className="task-delete-btn"
                    onClick={() => deleteTask(task.id)}
                    title="Delete task"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULE BLOCKS */}
      {boardTab === 'schedule' && (
        <div className="schedule-tab-view">
          {plan.schedule.length === 0 ? (
            <div className="empty-schedule-card glass-card">
              <Clock size={36} className="text-muted" />
              <h3>No Schedule Blocks Detected</h3>
              <p>Ask Aurelia AI to generate a "Daily Schedule" with specific hours to populate this view.</p>
              <button className="btn btn-secondary btn-sm" onClick={onOpenStudio}>
                <span>Ask Aurelia for a Daily Schedule</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="schedule-timeline">
              {plan.schedule.map((block) => (
                <div key={block.id} className="timeline-item">
                  <div className="timeline-time-badge">
                    <Calendar size={13} />
                    <span>{block.time}</span>
                  </div>

                  <div className="timeline-card glass-card">
                    <div className="timeline-card-header">
                      <h4>{block.title}</h4>
                      <span className={`schedule-category-badge cat-${block.category}`}>
                        {block.category.toUpperCase()}
                      </span>
                    </div>
                    {block.details && block.details !== block.title && (
                      <p className="timeline-card-desc">{block.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EISENHOWER MATRIX */}
      {boardTab === 'matrix' && (
        <div className="matrix-tab-view">
          <div className="eisenhower-grid">
            {/* Q1: Do First */}
            <div className="matrix-quadrant quad-do glass-card">
              <div className="quad-header">
                <span className="quad-badge badge-q1">DO FIRST</span>
                <h4>Urgent & Important</h4>
                <p>Execute immediately. Critical deadlines & blockers.</p>
              </div>
              <div className="quad-items-list">
                {plan.quadrants
                  .filter((q) => q.quadrant === 'do')
                  .concat(
                    plan.tasks
                      .filter((t) => t.priority === 'high' && !t.completed)
                      .map((t) => ({ id: t.id, text: t.text, quadrant: 'do' }))
                  )
                  .slice(0, 8)
                  .map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="quad-item-card">
                      <span>{item.text}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Q2: Schedule */}
            <div className="matrix-quadrant quad-schedule glass-card">
              <div className="quad-header">
                <span className="quad-badge badge-q2">SCHEDULE</span>
                <h4>Important, Not Urgent</h4>
                <p>High leverage & long-term goals. Reserve deep work time.</p>
              </div>
              <div className="quad-items-list">
                {plan.quadrants
                  .filter((q) => q.quadrant === 'schedule')
                  .concat(
                    plan.tasks
                      .filter((t) => t.priority === 'medium' && !t.completed)
                      .map((t) => ({ id: t.id, text: t.text, quadrant: 'schedule' }))
                  )
                  .slice(0, 8)
                  .map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="quad-item-card">
                      <span>{item.text}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Q3: Delegate */}
            <div className="matrix-quadrant quad-delegate glass-card">
              <div className="quad-header">
                <span className="quad-badge badge-q3">DELEGATE</span>
                <h4>Urgent, Not Important</h4>
                <p>Interruptions or administrative tasks. Automate or offload.</p>
              </div>
              <div className="quad-items-list">
                {plan.quadrants
                  .filter((q) => q.quadrant === 'delegate')
                  .slice(0, 8)
                  .map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="quad-item-card">
                      <span>{item.text}</span>
                    </div>
                  ))}
                {plan.quadrants.filter((q) => q.quadrant === 'delegate').length === 0 && (
                  <div className="quad-empty-tip">No delegated tasks identified.</div>
                )}
              </div>
            </div>

            {/* Q4: Eliminate */}
            <div className="matrix-quadrant quad-eliminate glass-card">
              <div className="quad-header">
                <span className="quad-badge badge-q4">ELIMINATE</span>
                <h4>Neither Urgent Nor Important</h4>
                <p>Time wasters or low-value requests. Say no or remove.</p>
              </div>
              <div className="quad-items-list">
                {plan.quadrants
                  .filter((q) => q.quadrant === 'eliminate')
                  .concat(
                    plan.tasks
                      .filter((t) => t.priority === 'low' && !t.completed)
                      .map((t) => ({ id: t.id, text: t.text, quadrant: 'eliminate' }))
                  )
                  .slice(0, 8)
                  .map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="quad-item-card">
                      <span>{item.text}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
