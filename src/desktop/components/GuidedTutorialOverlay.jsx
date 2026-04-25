import React from 'react';
import {
  CheckCircle2, ChevronLeft, ChevronRight, ListChecks, Route, TriangleAlert, X
} from 'lucide-react';
import {
  TUTORIAL_CHECKLIST,
  getTutorialSection,
} from '../lib/tutorialContent.js';

const GuidedTutorialOverlay = ({
  isOpen = false,
  tour = null,
  step = null,
  stepIndex = 0,
  totalSteps = 0,
  checklistState = {},
  onClose = () => {},
  onPrevious = () => {},
  onNext = () => {},
  onJumpToTab = () => {},
}) => {
  if (!isOpen || !step) return null;

  const section = getTutorialSection(step.tabId);
  const progress = totalSteps > 1 ? ((stepIndex + 1) / totalSteps) * 100 : 100;
  const controlPreview = section?.controls?.slice(0, 4) || [];

  return (
    <div className="fd-tutorial-overlay" role="dialog" aria-modal="true" aria-label="Interaktive Flight Deck Tour">
      <div className="fd-tutorial-backdrop" onClick={onClose} />
      <section className="fd-tutorial-modal">
        <div className="fd-tutorial-progress">
          <div className="fd-tour-meta">
            <span>{tour?.title || 'Gefuehrte Tour'}</span>
            <span>{tour?.estimatedTime || 'Schrittweise'}</span>
          </div>
          <span>Schritt {stepIndex + 1} / {totalSteps}</span>
          <div className="fd-progress-bar-large">
            <div className="fd-progress-fill-large" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="fd-section-head">
          <div>
            <h3>{step.title}</h3>
            <span>{section?.title || tour?.intent || 'Tour'}</span>
          </div>
          <button type="button" className="fd-icon-button" onClick={onClose} aria-label="Tutorial schliessen">
            <X size={16} />
          </button>
        </div>

        <div className="fd-tutorial-modal-grid">
          <article className="fd-tutorial-card">
            <h4>Was du in diesem Schritt lernst</h4>
            <p>{step.description}</p>
            {step.actions?.length > 0 && (
              <>
                <h4>Was du jetzt konkret tun solltest</h4>
                <ol>
                  {step.actions.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </>
            )}
            {step.warning && (
              <div className="fd-inline-alert">
                <TriangleAlert size={16} />
                <div>
                  <strong>Achte auf Folgendes</strong>
                  <p>{step.warning}</p>
                </div>
              </div>
            )}
          </article>

          <article className="fd-tutorial-card">
            <div className="fd-section-head">
              <h4>Tour-Checkliste</h4>
              <span><ListChecks size={16} /></span>
            </div>
            <div className="fd-tutorial-mini-checklist">
              {TUTORIAL_CHECKLIST.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`fd-mini-check ${checklistState[item.id] ? 'done' : ''}`}
                  onClick={() => onJumpToTab(item.tabId)}
                >
                  <CheckCircle2 size={14} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </article>
        </div>

        <div className="fd-tutorial-modal-grid">
          <article className="fd-tutorial-card">
            <div className="fd-section-head">
              <h4>Woran du Erfolg erkennst</h4>
              <span><Route size={16} /></span>
            </div>
            <ul>
              {(step.expectedResults || section?.successChecks || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          {controlPreview.length > 0 && (
            <article className="fd-tutorial-card">
              <h4>Wichtige Elemente in diesem Tab</h4>
              <div className="fd-control-list compact">
                {controlPreview.map((control) => (
                  <div key={control.name} className="fd-control-item">
                    <div className="fd-control-head">
                      <strong>{control.name}</strong>
                      <span>{control.area}</span>
                    </div>
                    <small>{control.howToUse}</small>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>

        {section && section.walkthrough?.length > 0 && (
          <article className="fd-tutorial-card">
            <h4>Vertiefung fuer diesen Tab</h4>
            <div className="fd-tutorial-steps">
              {section.walkthrough.slice(0, 3).map((item) => (
                <div key={item.title} className="fd-tutorial-step">
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
          </article>
        )}

        <div className="fd-toolbar-actions">
          {step.tabId && (
            <button
              type="button"
              className="fd-button secondary"
              onClick={() => onJumpToTab(step.tabId)}
            >
              Diesen Tab oeffnen
            </button>
          )}
          <div className="fd-toolbar-actions">
            <button
              type="button"
              className="fd-button secondary"
              onClick={onPrevious}
              disabled={stepIndex === 0}
            >
              <ChevronLeft size={16} />
              Zurueck
            </button>
            <button type="button" className="fd-button" onClick={onNext}>
              Weiter
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GuidedTutorialOverlay;
