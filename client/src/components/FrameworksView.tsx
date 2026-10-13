import React from 'react';
import {
  Clock,
  Grid,
  CheckCircle,
  BookOpen,
  Zap,
  Split,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface FrameworksViewProps {
  onSelectFramework: (prompt: string) => void;
}

export const FrameworksView: React.FC<FrameworksViewProps> = ({ onSelectFramework }) => {
  const frameworks = [
    {
      id: 'timeblocking',
      title: 'Time-Blocking & Deep Work',
      badge: '🗓️ Scheduling',
      icon: <Clock className="fw-icon text-accent" size={24} />,
      desc: 'Allocate dedicated, non-overlapping blocks for high-friction cognitive work, administrative batches, and regenerative breaks.',
      samplePrompt: 'Build me an optimized daily time-block schedule for tomorrow. I need 4 hours of deep focus on my primary deliverable, 1 hour for communications, and realistic transition intervals.',
    },
    {
      id: 'eisenhower',
      title: 'Eisenhower Decision Matrix',
      badge: '🎯 Prioritization',
      icon: <Grid className="fw-icon text-accent" size={24} />,
      desc: 'Separate the urgent from the truly important. Prevent fires from consuming your day by allocating time to proactive, high-leverage milestones.',
      samplePrompt: 'Here is my messy to-do list. Please categorize each item into the 4 Eisenhower quadrants (Do First, Schedule, Delegate, Eliminate) and give a 1-sentence rationale for each.',
    },
    {
      id: 'milestones',
      title: 'Project Decomposition (WBS)',
      badge: '🧩 Breakdown',
      icon: <Split className="fw-icon text-accent" size={24} />,
      desc: 'Transform ambiguous or overwhelming projects into phased milestones and bite-sized, checkable action items with clear immediate next steps.',
      samplePrompt: 'I have a major project due in 3 weeks. Break it down into 3 weekly milestones, followed by specific daily action items for week 1 so I know exactly what to do first.',
    },
    {
      id: 'study',
      title: 'Active Recall & Spaced Revision',
      badge: '📚 Study Planning',
      icon: <BookOpen className="fw-icon text-accent" size={24} />,
      desc: 'Scientifically backed revision schedules based on Ebbinghaus forgetting curves, high-yield practice, and retention testing.',
      samplePrompt: 'Design a 10-day study roadmap for an upcoming technical exam. Include spaced review intervals, practice question blocks, and rest days.',
    },
    {
      id: 'energy',
      title: 'Circadian Energy Matching',
      badge: '⚡ Peak Performance',
      icon: <Zap className="fw-icon text-accent" size={24} />,
      desc: 'Schedule cognitively demanding problem solving during your natural peak mental alertness, reserving low-energy troughs for mindless admin.',
      samplePrompt: 'Help me plan my week around my energy levels: I have high mental clarity between 8:30 AM and 12:00 PM, an afternoon dip from 2:00 PM to 4:00 PM, and creative bursts in the evening.',
    },
    {
      id: 'braindump',
      title: 'Brain Dump to Action Checklist',
      badge: '✅ Organization',
      icon: <CheckCircle className="fw-icon text-accent" size={24} />,
      desc: 'Empty your head of scattered thoughts, unorganized notes, and open loops. Aurelia will synthesize them into an organized, prioritized action checklist.',
      samplePrompt: 'Here is a brain dump of all the thoughts running through my head right now. Please organize them into prioritized categories and tell me the top 3 items to complete today.',
    },
  ];

  return (
    <div className="frameworks-container animate-fade-in">
      <div className="frameworks-hero glass-card">
        <div className="frameworks-hero-text">
          <div className="hero-pill">
            <Sparkles size={14} className="text-accent" />
            <span>Structured Methodologies</span>
          </div>
          <h2>Productivity & Planning Frameworks</h2>
          <p>
            Choose a proven methodology below to instantly launch Aurelia AI with a battle-tested
            planning template.
          </p>
        </div>
      </div>

      <div className="frameworks-grid">
        {frameworks.map((fw) => (
          <div key={fw.id} className="framework-card glass-card glass-card-hover">
            <div className="fw-header-row">
              <div className="fw-icon-box">{fw.icon}</div>
              <span className="status-pill status-pill-accent">{fw.badge}</span>
            </div>
            <h3 className="fw-title">{fw.title}</h3>
            <p className="fw-desc">{fw.desc}</p>
            <div className="fw-prompt-preview">
              <span className="preview-label">Prompt Template:</span>
              <p className="preview-text">"{fw.samplePrompt}"</p>
            </div>
            <button
              className="btn btn-primary btn-sm btn-full-width"
              onClick={() => onSelectFramework(fw.samplePrompt)}
            >
              <span>Apply Framework</span>
              <ArrowRight size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
