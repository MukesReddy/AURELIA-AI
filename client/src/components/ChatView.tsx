import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  User,
  Copy,
  Check,
  CheckSquare,
  Mic,
  MicOff,
  Wand2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import type { ChatMessage, ExtractedPlan } from '../types';
import { MarkdownView } from './MarkdownView';
import { parsePlanFromMarkdown } from '../utils/planParser';
import { sounds } from '../utils/sound';

interface ChatViewProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onOpenWizard: () => void;
  onExtractPlan: (plan: ExtractedPlan) => void;
  error: string | null;
  onRetry: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onOpenWizard,
  onExtractPlan,
  error,
  onRetry,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [extractedId, setExtractedId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Adjust textarea height dynamically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const text = inputText.trim();
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExtractMessage = (id: string, content: string) => {
    const plan = parsePlanFromMarkdown(content);
    onExtractPlan(plan);
    setExtractedId(id);
    sounds.playTaskComplete();
    setTimeout(() => setExtractedId(null), 2500);
  };

  // Speech Recognition (Web Speech API)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. You can type your request directly.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as any)();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  // Kickstarter quick prompts
  const kickstarters = [
    {
      title: '🗓️ Build Today’s Schedule',
      prompt: 'Build a realistic daily schedule for today. I have 5 hours available. Help me block time for deep work, admin tasks, and breaks without overlap.',
    },
    {
      title: '🎯 Prioritize Messy To-Dos',
      prompt: 'Here are tasks on my plate: finish report, answer 20 emails, review contract, prepare presentation, schedule doctor visit. Organize them by urgency and importance with an explanation.',
    },
    {
      title: '🧩 Break Down a Big Project',
      prompt: 'I need to launch a new product feature in 2 weeks. Break this down into phased milestones and an immediate checklist for this week.',
    },
    {
      title: '📚 14-Day Study Plan',
      prompt: 'Create a 14-day study schedule for an upcoming exam. I can study 2 hours a day. Include active recall reviews and mock test sessions.',
    },
  ];

  return (
    <div className="chat-view-container animate-fade-in">
      {/* Messages Scroll Area */}
      <div className="messages-scroll-area">
        {messages.length === 0 ? (
          <div className="chat-welcome-hero glass-card animate-fade-in">
            <div className="welcome-avatar-orb">
              <Sparkles size={32} className="sparkle-pulse" />
            </div>
            <h2>Meet Aurelia AI</h2>
            <p className="welcome-tagline">
              Your autonomous planning and productivity intelligence. Turn goals, ideas, and chaotic
              task lists into clear, realistic plans you can execute right away.
            </p>

            <div className="kickstarters-section">
              <span className="kickstarters-label">Kickstart with a proven template:</span>
              <div className="kickstarters-grid">
                {kickstarters.map((item, idx) => (
                  <button
                    key={idx}
                    className="kickstarter-card glass-card glass-card-hover"
                    onClick={() => onSendMessage(item.prompt)}
                  >
                    <div className="ks-title">{item.title}</div>
                    <div className="ks-arrow">
                      <ArrowRight size={14} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="wizard-cta-banner">
              <div className="cta-icon-box">
                <Wand2 size={20} className="text-accent" />
              </div>
              <div className="cta-text">
                <strong>Need a custom tailored plan?</strong>
                <span>Use the Guided Planning Wizard to supply your goal, deadline, hours, and constraints.</span>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={onOpenWizard}>
                Launch Wizard
              </button>
            </div>
          </div>
        ) : (
          <div className="messages-thread">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-row ${msg.role === 'user' ? 'message-user' : 'message-assistant'}`}
              >
                <div className="message-avatar">
                  {msg.role === 'user' ? (
                    <User size={18} />
                  ) : (
                    <div className="avatar-ai-glow">
                      <Sparkles size={16} />
                    </div>
                  )}
                </div>

                <div className="message-bubble glass-card">
                  <div className="message-header-bar">
                    <span className="sender-name">
                      {msg.role === 'user' ? 'You' : 'Aurelia AI'}
                    </span>
                    <span className="message-timestamp">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="message-body">
                    {msg.role === 'user' ? (
                      <p className="user-message-text">{msg.content}</p>
                    ) : (
                      <MarkdownView content={msg.content} />
                    )}
                  </div>

                  {msg.role === 'assistant' && (
                    <div className="message-actions-bar">
                      <button
                        className="msg-action-btn"
                        onClick={() => handleExtractMessage(msg.id, msg.content)}
                        title="Extract tasks, schedule, and priority matrix into interactive Action Board"
                      >
                        {extractedId === msg.id ? (
                          <>
                            <Check size={14} className="text-emerald" />
                            <span className="text-emerald">Extracted to Board!</span>
                          </>
                        ) : (
                          <>
                            <CheckSquare size={14} />
                            <span>Extract to Action Board</span>
                          </>
                        )}
                      </button>

                      <button
                        className="msg-action-btn"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        title="Copy raw markdown to clipboard"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check size={14} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message-row message-assistant animate-fade-in">
                <div className="message-avatar">
                  <div className="avatar-ai-glow">
                    <Sparkles size={16} />
                  </div>
                </div>
                <div className="message-bubble glass-card loading-bubble">
                  <div className="typing-indicator">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                  <span className="typing-label">Aurelia AI is formulating your plan...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="chat-error-banner glass-card animate-fade-in">
                <div className="error-icon-box">
                  <AlertTriangle size={18} />
                </div>
                <div className="error-text-content">
                  <strong>Plan formulation failed</strong>
                  <p>{error}</p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={onRetry}>
                  <RotateCcw size={14} />
                  <span>Retry</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Dock Area */}
      <div className="chat-input-dock">
        <div className="input-dock-container glass-card">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask Aurelia to build a schedule, prioritize tasks, or break down a project..."
            disabled={isLoading}
            maxLength={4000}
            className="chat-textarea"
            id="chat-user-input"
          />

          <div className="input-dock-footer">
            <div className="dock-left-tools">
              <button
                type="button"
                className="dock-tool-btn"
                onClick={onOpenWizard}
                title="Open Guided Planning Wizard"
              >
                <Wand2 size={16} />
                <span className="hide-on-mobile">Guided Wizard</span>
              </button>

              <button
                type="button"
                className={`dock-tool-btn ${isRecording ? 'recording-active' : ''}`}
                onClick={toggleSpeechRecognition}
                title={isRecording ? 'Stop Voice Recording' : 'Voice Input (Speech-to-Text)'}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                <span className="hide-on-mobile">{isRecording ? 'Listening...' : 'Voice'}</span>
              </button>

              <span className="char-count-text">
                {inputText.length} / 4000
              </span>
            </div>

            <div className="dock-right-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm btn-send"
                onClick={() => handleSubmit()}
                disabled={!inputText.trim() || isLoading}
                id="btn-send-chat"
                aria-label="Send message"
              >
                <span>Send</span>
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
