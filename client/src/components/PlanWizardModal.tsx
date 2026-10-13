import React, { useState } from 'react';
import { X, Sparkles, Target, Clock, Calendar, ShieldAlert, FileText } from 'lucide-react';

interface PlanWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPlanPrompt: (promptText: string) => void;
}

export const PlanWizardModal: React.FC<PlanWizardModalProps> = ({
  isOpen,
  onClose,
  onSubmitPlanPrompt,
}) => {
  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [availableTime, setAvailableTime] = useState('');
  const [constraints, setConstraints] = useState('');
  const [planType, setPlanType] = useState<'schedule' | 'priorities' | 'breakdown' | 'study' | 'custom'>('schedule');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    let formatRequest = '';
    switch (planType) {
      case 'schedule':
        formatRequest = 'Please provide a structured daily schedule with realistic time blocks, break intervals, and estimated durations for each task.';
        break;
      case 'priorities':
        formatRequest = 'Please organize this into an Eisenhower Priority Matrix (Urgent & Important, Important not Urgent, etc.) and explain the rationale for each ranking.';
        break;
      case 'breakdown':
        formatRequest = 'Please break this project down into sequential milestones and small, manageable checklist action items.';
        break;
      case 'study':
        formatRequest = 'Please build a structured revision and study roadmap, with active recall sessions and spaced practice.';
        break;
      default:
        formatRequest = 'Please provide a clear, actionable plan with checklists and key milestones.';
    }

    const constructedPrompt = `Goal: ${goal.trim()}
Timeframe/Deadline: ${deadline.trim() || 'Flexible / As soon as practical'}
Available Time: ${availableTime.trim() || '2-3 hours per day'}
Constraints: ${constraints.trim() || 'None specified'}

${formatRequest} Ensure there are no overlapping time blocks, and make the next immediate step crystal clear.`;

    onSubmitPlanPrompt(constructedPrompt);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <Sparkles size={20} />
            </div>
            <div>
              <h3>Guided Planning Wizard</h3>
              <p className="modal-subtitle">Give Aurelia AI key context to formulate a high-precision, actionable plan.</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close Modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="wizard-form">
          <div className="form-group">
            <label htmlFor="wizard-goal">
              <Target size={15} />
              <span>What is your primary goal or objective? <strong className="required-star">*</strong></span>
            </label>
            <textarea
              id="wizard-goal"
              rows={2}
              placeholder="e.g. Complete and launch our enterprise security audit report before the executive review"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="wizard-deadline">
                <Calendar size={15} />
                <span>Target Deadline / Timeframe</span>
              </label>
              <input
                id="wizard-deadline"
                type="text"
                placeholder="e.g. Friday at 5:00 PM, or next 2 weeks"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="wizard-time">
                <Clock size={15} />
                <span>Available Time Commitment</span>
              </label>
              <input
                id="wizard-time"
                type="text"
                placeholder="e.g. 4 hours/day, weekday mornings"
                value={availableTime}
                onChange={(e) => setAvailableTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="wizard-constraints">
              <ShieldAlert size={15} />
              <span>Constraints, Fatigue Levels, or Context</span>
            </label>
            <input
              id="wizard-constraints"
              type="text"
              placeholder="e.g. Meetings on Wednesday morning, prefer deep focus sessions in bursts of 45 mins"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              <FileText size={15} />
              <span>Desired Plan Structure</span>
            </label>
            <div className="plan-type-grid">
              <button
                type="button"
                className={`plan-type-card ${planType === 'schedule' ? 'selected' : ''}`}
                onClick={() => setPlanType('schedule')}
              >
                <div className="type-title">🗓️ Daily Schedule</div>
                <div className="type-desc">Time-blocked schedule with realistic focus & rest intervals</div>
              </button>

              <button
                type="button"
                className={`plan-type-card ${planType === 'priorities' ? 'selected' : ''}`}
                onClick={() => setPlanType('priorities')}
              >
                <div className="type-title">🎯 Priority Matrix</div>
                <div className="type-desc">Urgency vs Importance (Eisenhower matrix) with reasons</div>
              </button>

              <button
                type="button"
                className={`plan-type-card ${planType === 'breakdown' ? 'selected' : ''}`}
                onClick={() => setPlanType('breakdown')}
              >
                <div className="type-title">🧩 Milestone Roadmap</div>
                <div className="type-desc">Step-by-step breakdown from initiation to delivery</div>
              </button>

              <button
                type="button"
                className={`plan-type-card ${planType === 'study' ? 'selected' : ''}`}
                onClick={() => setPlanType('study')}
              >
                <div className="type-title">📚 Study Blueprint</div>
                <div className="type-desc">Spaced revision plan with high-yield concepts</div>
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!goal.trim()}>
              <Sparkles size={16} />
              <span>Generate Tailored Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
