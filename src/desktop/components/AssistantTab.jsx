import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bot, ChevronRight, Copy, Check, ExternalLink, Loader2,
  MessageSquare, Send, Sparkles, Trash2, Zap,
} from 'lucide-react';
import { answerToolQuestion } from '../lib/assistantEngine.js';
import { ASSISTANT_ACTIONS } from '../lib/assistantKnowledge.js';
import { flightDeckApi } from '../api.js';

const PROMPTS = [
  { text: 'Wie stelle ich ein Set online?', icon: '🚀' },
  { text: 'Zeig mir den aktuellen Status', icon: '📊' },
  { text: 'Wie behebe ich einen Datenbankfehler?', icon: '🔧' },
  { text: 'Was muss ich vor Go Live prüfen?', icon: '✅' },
  { text: 'Erkläre den Batch Import', icon: '📦' },
  { text: 'Wie analysiere ich schwache Sets?', icon: '📈' },
  { text: 'Öffne den Set Import', icon: '📁' },
  { text: 'Was kannst du alles?', icon: '🤖' },
];

const SOURCE_LABELS = {
  'knowledge': { label: 'Wiki', color: 'var(--airdox-lime)' },
  'state': { label: 'Live Status', color: 'var(--airdox-cyan)' },
  'action': { label: 'Aktion', color: '#f97316' },
  'local': { label: 'Lokal', color: 'var(--airdox-muted)' },
  'system': { label: 'System', color: 'var(--airdox-muted)' },
  'fallback': { label: 'Experte', color: '#c084fc' },
  'mock-local': { label: 'Lokal', color: 'var(--airdox-muted)' },
  'error-fallback': { label: 'Fehler', color: 'var(--airdox-danger)' },
};

const getSourceLabel = (source = '') => {
  if (source.startsWith('ollama:')) return { label: 'KI', color: '#c084fc' };
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
      text: 'Willkommen im Flight-Deck-Assistenten! 👋\n\nIch bin dein Experte für das AIRDOX Flight Deck. Ich kann:\n\n• 📋 Alle Features erklären und Anleitungen geben\n• 🔍 Den aktuellen System-Status auswerten\n• 🚀 Aktionen ausführen (Tabs öffnen, Status aktualisieren)\n• 🔧 Fehler diagnostizieren und Lösungen vorschlagen\n\nStell mir einfach deine Frage oder wähle einen Vorschlag unten!',
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
          } else if (typeof localResult !== 'string' && localResult.source === 'fallback') {
            // Backend had something, local didn't — use backend
            finalText = backendText;
            finalSource = backendSource;
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
          {PROMPTS.map((prompt) => (
            <button
              type="button"
              key={prompt.text}
              className="fd-prompt-chip"
              onClick={() => void send(prompt.text)}
              disabled={isThinking}
            >
              <span className="fd-prompt-emoji">{prompt.icon}</span>
              {prompt.text}
            </button>
          ))}
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
                  {formatMessageText(message.text)}
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
