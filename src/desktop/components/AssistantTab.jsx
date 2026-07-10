import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bot, ChevronRight, Copy, Check, ExternalLink, Loader2,
  MessageSquare, Send, Sparkles, Trash2, Zap,
  Rocket, BarChart3, Wrench, CheckCircle2, Package, TrendingUp,
  FolderOpen, HelpCircle,
} from 'lucide-react';
import { answerToolQuestion } from '../lib/assistantEngine.js';
import { ASSISTANT_ACTIONS } from '../lib/assistantKnowledge.js';
import { ASSISTANT_GUIDES } from '../lib/assistantGuides.js';
import { flightDeckApi } from '../api.js';

const PROMPTS = [
  { text: 'Wie stelle ich ein Set online?', icon: Rocket },
  { text: 'Zeig mir den aktuellen Status', icon: BarChart3 },
  { text: 'Wie behebe ich einen Datenbankfehler?', icon: Wrench },
  { text: 'Was muss ich vor Go Live prüfen?', icon: CheckCircle2 },
  { text: 'Erkläre den Batch Import', icon: Package },
  { text: 'Wie analysiere ich schwache Sets?', icon: TrendingUp },
  { text: 'Öffne den Set Import', icon: FolderOpen },
  { text: 'Was kannst du alles?', icon: HelpCircle },
];

const SHARED_SCREENSHOTS = {
  workbench: {
    src: '/assistant-screenshots/flightdeck-workbench.png',
    alt: 'AIRDOX Flight Deck Hauptansicht mit linker Navigation und Statuskarten',
    caption: 'Hauptansicht: erst links den Bereich wählen, dann oben Status und Blocker lesen.',
  },
  dataExplorer: {
    src: '/assistant-screenshots/data-explorer.png',
    alt: 'AIRDOX Data Explorer mit Tabellenansicht und Export-Buttons',
    caption: 'Data Explorer: Tabelle wählen, Ergebnis prüfen, danach CSV oder JSON exportieren.',
  },
  analytics: {
    src: '/assistant-screenshots/analytics-filter.png',
    alt: 'AIRDOX Analytics mit gesetztem Event-Filter',
    caption: 'Analytics: Zeitraum und Event-Filter zuerst setzen, erst danach Zahlen bewerten.',
  },
  assistant: {
    src: '/assistant-screenshots/assistant.png',
    alt: 'AIRDOX KI Assistant im Windows Tool',
    caption: 'Assistant: Frage stellen oder einen Einstieg oben wählen; Aktionen öffnen direkt den passenden Tab.',
  },
  approval: {
    src: '/assistant-screenshots/approval-desk.png',
    alt: 'AIRDOX Marketing Manager mit Freigabe-Desk',
    caption: 'Marketing Manager: Operation, Copy, Asset und Budget einzeln prüfen, dann freigeben oder ablehnen.',
  },
};

const ASSISTANT_SCREENSHOTS = {
  'online-publish': [SHARED_SCREENSHOTS.workbench],
  workspace: [SHARED_SCREENSHOTS.workbench],
  import: [SHARED_SCREENSHOTS.workbench],
  publish: [SHARED_SCREENSHOTS.workbench],
  analytics: [SHARED_SCREENSHOTS.analytics],
  'analytics-terms': [SHARED_SCREENSHOTS.analytics],
  'db-error': [SHARED_SCREENSHOTS.workbench],
  explorer: [SHARED_SCREENSHOTS.dataExplorer],
  'data-model': [SHARED_SCREENSHOTS.dataExplorer],
  'export-data': [SHARED_SCREENSHOTS.dataExplorer],
  'subscriber-management': [SHARED_SCREENSHOTS.dataExplorer],
  'user-admin': [SHARED_SCREENSHOTS.dataExplorer],
  monitor: [SHARED_SCREENSHOTS.workbench],
  batch: [SHARED_SCREENSHOTS.workbench],
  'design-agent': [SHARED_SCREENSHOTS.workbench],
  'flightdeck-map': [SHARED_SCREENSHOTS.workbench],
  'go-live-preflight': [SHARED_SCREENSHOTS.workbench],
  glossary: [SHARED_SCREENSHOTS.workbench],
  'publish-pipeline': [SHARED_SCREENSHOTS.workbench],
  'settings-toggles': [SHARED_SCREENSHOTS.workbench],
  'agent-system': [SHARED_SCREENSHOTS.approval],
  'marketing-manager': [SHARED_SCREENSHOTS.approval],
  'tutorial-workflows': [SHARED_SCREENSHOTS.workbench],
  settings: [SHARED_SCREENSHOTS.workbench],
  tutorial: [SHARED_SCREENSHOTS.workbench],
  'git-status': [SHARED_SCREENSHOTS.workbench],
  'r2-upload': [SHARED_SCREENSHOTS.workbench],
  'tracklist-editor': [SHARED_SCREENSHOTS.workbench],
  'vinyl-cover': [SHARED_SCREENSHOTS.workbench],
  'overview-dashboard': [SHARED_SCREENSHOTS.workbench],
  'keyboard-shortcuts': [SHARED_SCREENSHOTS.assistant],
  troubleshooting: [SHARED_SCREENSHOTS.workbench],
  'safe-mode': [SHARED_SCREENSHOTS.workbench],
  'assistant-help': [SHARED_SCREENSHOTS.assistant, SHARED_SCREENSHOTS.workbench],
  'first-set': [SHARED_SCREENSHOTS.workbench],
};

const SOURCE_LABELS = {
  'knowledge': { label: 'Wiki', color: 'var(--airdox-lime)' },
  'state': { label: 'Live Status', color: 'var(--airdox-cyan)' },
  'action': { label: 'Aktion', color: 'var(--airdox-warning)' },
  'local': { label: 'Lokal', color: 'var(--airdox-muted)' },
  'system': { label: 'System', color: 'var(--airdox-muted)' },
  'fallback': { label: 'Experte', color: 'var(--airdox-lime)' },
  'mock-local': { label: 'Lokal', color: 'var(--airdox-muted)' },
  'error-fallback': { label: 'Fehler', color: 'var(--airdox-danger)' },
};

const getSourceLabel = (source = '') => {
  if (source.startsWith('ollama:')) return { label: 'KI', color: 'var(--airdox-lime)' };
  return SOURCE_LABELS[source] || { label: source || 'Lokal', color: 'var(--airdox-muted)' };
};

const normalizeAssistantText = (value) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    if (typeof value.text === 'string') return value.text;
    if (typeof value.answer === 'string') return value.answer;
  }
  return String(value ?? '');
};

const getCompactText = (text = '') => normalizeAssistantText(text)
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => !/^Schnellweg:|^Detaillierter Weg:/i.test(line))
  .filter((line) => !/^\d+\)/.test(line))
  .slice(0, 2)
  .join('\n');

const truncateText = (text = '', max = 260) => {
  const value = String(text || '').trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max).replace(/\s+\S*$/, '')}...`;
};

const formatMessageText = (text = '') => {
  const safeText = normalizeAssistantText(text);
  // Split into segments: code blocks, inline code, and regular text
  const parts = [];
  let remaining = safeText;
  let key = 0;

  // Handle code blocks (```)
  while (remaining.includes('```')) {
    const start = remaining.indexOf('```');
    if (start > 0) {
      parts.push({ type: 'text', content: remaining.slice(0, start), key: key++ });
    }
    const end = remaining.indexOf('```', start + 3);
    if (end === -1) break;
    parts.push({ type: 'code', content: remaining.slice(start + 3, end).trim(), key: key++ });
    remaining = remaining.slice(end + 3);
  }

  if (remaining) {
    parts.push({ type: 'text', content: remaining, key: key++ });
  }

  if (parts.length === 0) {
    parts.push({ type: 'text', content: safeText, key: 0 });
  }

  return parts.map((part) => {
    if (part.type === 'code') {
      return (
        <pre key={part.key} className="fd-assistant-code-block">
          {part.content}
        </pre>
      );
    }

    // Handle inline code (`) and line breaks
    const lines = part.content.split('\n');
    return (
      <div key={part.key} className="fd-assistant-text-block">
        {lines.map((line, lineIndex) => {
          // Handle inline code
          const segments = line.split(/`([^`]+)`/);
          return (
            <React.Fragment key={lineIndex}>
              {lineIndex > 0 && <br />}
              {segments.map((segment, segIndex) => (
                segIndex % 2 === 1
                  ? <code key={segIndex} className="fd-assistant-inline-code">{segment}</code>
                  : <span key={segIndex}>{segment}</span>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    );
  });
};

const TypingIndicator = () => (
  <div className="fd-assistant-msg assistant fd-typing-msg">
    <div className="fd-assistant-avatar">
      <Bot size={16} />
    </div>
    <div className="fd-assistant-bubble">
      <div className="fd-typing-dots">
        <span className="fd-typing-dot" />
        <span className="fd-typing-dot" />
        <span className="fd-typing-dot" />
      </div>
    </div>
  </div>
);

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };
  return (
    <button type="button" className="fd-assistant-action-icon" onClick={handleCopy} title="Kopieren">
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
};

const ActionButton = ({ actionId, onAction }) => {
  const config = ASSISTANT_ACTIONS[actionId];
  if (!config) return null;
  return (
    <button
      type="button"
      className="fd-assistant-action-btn"
      onClick={() => onAction(actionId)}
    >
      <ChevronRight size={14} />
      {config.label}
    </button>
  );
};

const AssistantVisualAnswer = ({ message }) => {
  const guide = message.matchId ? ASSISTANT_GUIDES[message.matchId] : null;
  const screenshots = message.matchId ? (ASSISTANT_SCREENSHOTS[message.matchId] || []) : [];
  const compactText = truncateText(getCompactText(message.text), 320);

  if (!guide) {
    const lines = normalizeAssistantText(message.text).split('\n');
    const visibleLines = lines.slice(0, 8).join('\n');
    const hiddenLines = lines.slice(8).join('\n');

    return (
      <div className="fd-assistant-compact-answer">
        {formatMessageText(visibleLines)}
        {hiddenLines.trim() && (
          <details className="fd-assistant-details">
            <summary>Mehr anzeigen</summary>
            {formatMessageText(hiddenLines)}
          </details>
        )}
      </div>
    );
  }

  return (
    <div className="fd-assistant-visual-answer">
      {compactText && (
        <p className="fd-assistant-brief">{compactText}</p>
      )}
      {screenshots.length > 0 && (
        <div className="fd-assistant-screenshot-grid" aria-label="Passende Software-Bilder">
          {screenshots.slice(0, 2).map((shot) => (
            <figure key={shot.src} className="fd-assistant-screenshot-card">
              <img src={shot.src} alt={shot.alt} loading="lazy" />
              <figcaption>{shot.caption}</figcaption>
            </figure>
          ))}
        </div>
      )}
      <div className="fd-assistant-flow" aria-label="Schnellweg">
        {guide.quick.slice(0, 5).map((step, index) => (
          <div key={`${message.id}-quick-${step}`} className="fd-assistant-flow-step">
            <span className="fd-assistant-flow-index">{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
      <details className="fd-assistant-details">
        <summary>Detaillierten Weg anzeigen</summary>
        <ol className="fd-assistant-detail-list">
          {guide.detailed.map((step) => (
            <li key={`${message.id}-detail-${step}`}>{step}</li>
          ))}
        </ol>
      </details>
      <details className="fd-assistant-details muted">
        <summary>Textantwort anzeigen</summary>
        {formatMessageText(message.text)}
      </details>
    </div>
  );
};

const AssistantTab = ({
  appState = null,
  onJumpToTab = () => {},
  onRefresh = () => {},
  onLoadImport = () => {},
  onSyncStats = () => {},
}) => {
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Bereit. Frag mich nach einem Ziel oder wähle oben einen Einstieg. Ich zeige zuerst kurze Schritte; Details bleiben einklappbar.',
      source: 'system',
      actions: [],
      timestamp: Date.now(),
    },
  ]);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatRef.current) {
      const chat = chatRef.current;
      requestAnimationFrame(() => {
        chat.scrollTop = chat.scrollHeight;
      });
    }
  }, [messages, isThinking]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAction = useCallback((actionId) => {
    const config = ASSISTANT_ACTIONS[actionId];
    if (!config) return;

    if (config.tabId) {
      onJumpToTab(config.tabId);
    } else if (config.action === 'refresh') {
      onRefresh();
    } else if (config.action === 'import') {
      onLoadImport();
    } else if (config.action === 'syncStats') {
      onSyncStats();
    }
  }, [onJumpToTab, onRefresh, onLoadImport, onSyncStats]);

  const send = useCallback(async (preset = '') => {
    const question = (preset || input).trim();
    if (!question || isThinking) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: question,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Get local answer first (with state context)
    const localResult = answerToolQuestion(question, appState);

    let finalText = typeof localResult === 'string' ? localResult : localResult.text;
    let finalSource = typeof localResult === 'string' ? 'local' : (localResult.source || 'local');
    let finalActions = typeof localResult === 'string' ? [] : (localResult.actions || []);
    let finalMatchId = typeof localResult === 'string' ? '' : (localResult.matchId || '');
    let finalMatchTitle = typeof localResult === 'string' ? '' : (localResult.matchTitle || '');

    // Try backend assistant (Wiki + Ollama)
    try {
      if (typeof flightDeckApi.askAssistant === 'function') {
        const result = await flightDeckApi.askAssistant({ question });
        if (result?.answer) {
          // Merge: Backend answer + local actions
          const backendSource = result.source || 'backend';
          const backendText = normalizeAssistantText(result.answer);
          if (backendSource.startsWith('ollama:') || backendSource === 'wiki') {
            finalText = backendText;
            finalSource = backendSource;
            finalMatchId = '';
            finalMatchTitle = '';
          } else if (typeof localResult !== 'string' && localResult.source === 'fallback') {
            // Backend had something, local didn't — use backend
            finalText = backendText;
            finalSource = backendSource;
            finalMatchId = '';
            finalMatchTitle = '';
          }
        }
      }
    } catch {
      // Keep local answer
    } finally {
      setIsThinking(false);
    }

    const assistantMsg = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      text: finalText,
      source: finalSource,
      actions: finalActions,
      matchId: finalMatchId,
      matchTitle: finalMatchTitle,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMsg]);

    // Auto-execute navigation actions
    if (finalActions.length === 1) {
      const singleAction = finalActions[0];
      if (singleAction.startsWith('navigate:') && /(?:öffne|zeig|geh|navigiere|wechsel)/i.test(question)) {
        setTimeout(() => handleAction(singleAction), 500);
      }
    }
  }, [input, isThinking, appState, handleAction]);

  const clearHistory = () => {
    setMessages((prev) => prev.slice(0, 1));
    inputRef.current?.focus();
  };

  const messageCount = messages.filter((m) => m.role === 'user').length;

  return (
    <div className="fd-panel-stack fd-assistant-panel">
      <section className="fd-toolbar-band">
        <div>
          <h2>
            <Bot size={22} style={{ verticalAlign: 'text-bottom', marginRight: '8px' }} />
            KI Flight-Deck Assistant
          </h2>
          <p>
            Experte für Workspace, Import, Analytics, Deploy, DB und Monitoring
            {appState?.workspaceValid && (
              <span className="fd-assistant-status-dot ok" title="Workspace verbunden" />
            )}
            {appState?.dbError && (
              <span className="fd-assistant-status-dot danger" title="DB Fehler" />
            )}
          </p>
        </div>
        <div className="fd-toolbar-actions">
          <span className="fd-assistant-msg-count">
            <MessageSquare size={14} />
            {messageCount} {messageCount === 1 ? 'Nachricht' : 'Nachrichten'}
          </span>
          <button
            type="button"
            className="fd-button secondary"
            onClick={clearHistory}
            disabled={messages.length <= 1 || isThinking}
          >
            <Trash2 size={16} />
            Verlauf leeren
          </button>
        </div>
      </section>

      <section className="fd-surface fd-assistant-container">
        {/* Prompt Suggestions */}
        <div className="fd-assistant-prompts" aria-label="Vorschläge">
          {PROMPTS.map((prompt) => {
            const PromptIcon = prompt.icon;
            return (
              <button
                type="button"
                key={prompt.text}
                className="fd-prompt-chip"
                onClick={() => void send(prompt.text)}
                disabled={isThinking}
              >
                <PromptIcon size={14} className="fd-prompt-icon" aria-hidden="true" />
                {prompt.text}
              </button>
            );
          })}
        </div>

        {/* Chat Messages */}
        <div className="fd-assistant-chat" ref={chatRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`fd-assistant-msg ${message.role} fd-msg-enter`}
            >
              {message.role === 'assistant' && (
                <div className="fd-assistant-avatar">
                  <Bot size={16} />
                </div>
              )}
                <div className="fd-assistant-bubble">
                  <div className="fd-assistant-bubble-content">
                  {message.role === 'assistant'
                    ? <AssistantVisualAnswer message={message} />
                    : formatMessageText(message.text)}
                </div>
                {message.role === 'assistant' && (
                  <div className="fd-assistant-meta">
                    {message.source && (
                      <span
                        className="fd-assistant-source-badge"
                        style={{ '--badge-color': getSourceLabel(message.source).color }}
                      >
                        <Zap size={10} />
                        {getSourceLabel(message.source).label}
                      </span>
                    )}
                    <CopyButton text={message.text} />
                    <span className="fd-assistant-time">
                      {message.timestamp
                        ? new Date(message.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                )}
                {message.actions?.length > 0 && (
                  <div className="fd-assistant-actions">
                    {message.actions.map((actionId) => (
                      <ActionButton
                        key={actionId}
                        actionId={actionId}
                        onAction={handleAction}
                      />
                    ))}
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="fd-assistant-avatar user">
                  <span>Du</span>
                </div>
              )}
            </div>
          ))}
          {isThinking && <TypingIndicator />}
        </div>

        {/* Input */}
        <div className="fd-assistant-input">
          <div className="fd-assistant-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Frage stellen... z.B. &quot;Wie importiere ich ein Set?&quot;"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              disabled={isThinking}
            />
            {input.trim() && (
              <span className="fd-assistant-input-hint">Enter ↵</span>
            )}
          </div>
          <button
            type="button"
            className="fd-button fd-assistant-send-btn"
            aria-label="Senden"
            onClick={() => void send()}
            disabled={isThinking || !input.trim()}
          >
            {isThinking ? (
              <Loader2 size={16} className="fd-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </section>
    </div>
  );
};

export default AssistantTab;
