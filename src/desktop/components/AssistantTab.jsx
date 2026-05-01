import React, { useState } from 'react';
import { Bot, Send } from 'lucide-react';
import { answerToolQuestion } from '../lib/assistantEngine.js';
import { flightDeckApi } from '../api.js';

const AssistantTab = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Ich bin dein Flight-Deck-Experte. Frag mich alles zu Workspace, Import, Analytics, Deploy, DB-Fehlern und Monitoring.',
    },
  ]);

  const send = async () => {
    const question = input.trim();
    if (!question) return;
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    let reply = answerToolQuestion(question);
    try {
      if (typeof flightDeckApi.askAssistant === 'function') {
        const result = await flightDeckApi.askAssistant({ question });
        if (result?.answer) {
          reply = `${result.answer}\n\nQuelle: ${result.source || 'assistant'}`;
        }
      }
    } catch {
      // Keep local fallback reply
    }
    setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    setInput('');
  };

  return (
    <div className="fd-panel-stack">
      <section className="fd-toolbar-band">
        <div>
          <h2>KI Sprachassistent</h2>
          <p>Tool-Experte für Flight Deck / Windtool mit direkter Lösungshilfe.</p>
        </div>
      </section>

      <section className="fd-surface">
        <div className="fd-assistant-chat">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`fd-assistant-msg ${message.role}`}>
              {message.role === 'assistant' && <Bot size={14} />}
              <pre>{message.text}</pre>
            </div>
          ))}
        </div>
        <div className="fd-assistant-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Frage stellen, z.B. Wie behebe ich einen Datenbankfehler?"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void send();
            }}
          />
          <button type="button" className="fd-button" onClick={() => void send()}>
            <Send size={16} />
            Senden
          </button>
        </div>
      </section>
    </div>
  );
};

export default AssistantTab;
