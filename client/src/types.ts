export type PriorityLevel = 'high' | 'medium' | 'low';

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  priority: PriorityLevel;
  category?: string;
  timeframe?: string;
}

export interface ScheduleBlock {
  id: string;
  time: string;
  title: string;
  details?: string;
  category: 'focus' | 'break' | 'admin' | 'review' | 'other';
}

export interface QuadrantItem {
  id: string;
  text: string;
  quadrant: 'do' | 'schedule' | 'delegate' | 'eliminate';
  deadline?: string;
}

export interface ExtractedPlan {
  id: string;
  title: string;
  extractedAt: number;
  rawMarkdown: string;
  tasks: TaskItem[];
  schedule: ScheduleBlock[];
  quadrants: QuadrantItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  extractedPlan?: ExtractedPlan;
}

export interface PlanningSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  activePlan?: ExtractedPlan;
}

export interface ServerHealth {
  ok: boolean;
  configured: boolean;
  missing: string[];
}
