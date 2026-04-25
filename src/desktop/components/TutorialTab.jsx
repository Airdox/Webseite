import React from 'react';
import {
  BookOpen, CheckCircle2, Compass, ExternalLink, GraduationCap, ListChecks,
  PlayCircle, Route, ShieldAlert
} from 'lucide-react';
import {
  TUTORIAL_CHECKLIST,
  TUTORIAL_PRINCIPLES,
  TUTORIAL_SECTIONS,
  TUTORIAL_WORKFLOWS,
} from '../lib/tutorialContent.js';

const TutorialTab = ({
  checklistState = {},
  onJumpToTab = () => {},
  onStartTour = () => {},
}) => (
  <div className="fd-panel-stack">
    <section className="fd-tutorial-hero">
      <div>
        <span className="fd-eyebrow">Guided Tutorial</span>
        <h2>Flight Deck Arbeitsanleitung</h2>
        <p>
          Dieser Bereich ist das dauerhafte Handbuch im Tool. Er kombiniert
          Schnellstart, gefuehrte Szenarien und tabweise Referenzdokumentation.
        </p>
      </div>
      <div className="fd-toolbar-actions">
        <button type="button" className="fd-button" onClick={() => onStartTour({ tourId: 'full' })}>
          <PlayCircle size={16} />
          Volltour starten
        </button>
        <button type="button" className="fd-button secondary" onClick={() => onStartTour({ tourId: 'databaseAudit' })}>
          <Compass size={16} />
          Szenario 2 oeffnen
        </button>
      </div>
    </section>

    <section className="fd-surface">
      <div className="fd-section-head">
        <h3>So nutzt du dieses Tutorial</h3>
        <span><GraduationCap size={16} /></span>
      </div>
      <div className="fd-principle-list">
        {TUTORIAL_PRINCIPLES.map((item) => (
          <article key={item.title} className="fd-principle-card">
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </section>

    <div className="fd-two-column">
      <section className="fd-surface">
        <div className="fd-section-head">
          <h3>Schnellstart-Checkliste</h3>
          <span><ListChecks size={16} /></span>
        </div>
        <div className="fd-tutorial-checklist">
          {TUTORIAL_CHECKLIST.map((item) => (
            <article key={item.id} className={`fd-checklist-item ${checklistState[item.id] ? 'done' : ''}`}>
              <div className="fd-checklist-copy">
                <strong>{item.label}</strong>
                <span>{checklistState[item.id] ? 'Bereits besucht oder in einer Tour erledigt.' : 'Noch offen.'}</span>
              </div>
              <div className="fd-toolbar-actions">
                {checklistState[item.id] && <CheckCircle2 size={16} />}
                <button
                  type="button"
                  className="fd-button secondary"
                  onClick={() => onJumpToTab(item.tabId)}
                >
                  Oeffnen
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fd-surface">
        <div className="fd-section-head">
          <h3>Gefuehrte Touren</h3>
          <span><Route size={16} /></span>
        </div>
        <div className="fd-tutorial-workflows">
          {TUTORIAL_WORKFLOWS.map((workflow) => (
            <article key={workflow.id} className="fd-workflow-card">
              <div className="fd-tour-meta">
                <strong>{workflow.title}</strong>
                <span>{workflow.estimatedTime}</span>
              </div>
              <p>{workflow.description}</p>
              <div className="fd-tour-badges">
                <span className="fd-tour-badge intent">{workflow.intent}</span>
                {workflow.tabs.map((tab) => (
                  <span key={tab} className="fd-tour-badge">{tab}</span>
                ))}
              </div>
              <ol>
                {workflow.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <div className="fd-toolbar-actions">
                <button
                  type="button"
                  className="fd-button"
                  onClick={() => onStartTour({ tourId: workflow.id })}
                >
                  <BookOpen size={16} />
                  Tour starten
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>

    {TUTORIAL_SECTIONS.map((section) => (
      <section key={section.id} className="fd-surface fd-tutorial-section">
        <div className="fd-section-head">
          <div>
            <h3>{section.title}</h3>
            <span>{section.shortTitle}</span>
          </div>
          <div className="fd-toolbar-actions">
            <button
              type="button"
              className="fd-button secondary"
              onClick={() => onJumpToTab(section.tabId)}
            >
              <ExternalLink size={16} />
              Tab oeffnen
            </button>
            <button
              type="button"
              className="fd-button"
              onClick={() => onStartTour({ tourId: 'full', tabId: section.tabId })}
            >
              <BookOpen size={16} />
              Gefuehrte Schritte
            </button>
          </div>
        </div>

        <div className="fd-tutorial-grid">
          <article className="fd-tutorial-card">
            <h4>Wofuer dieser Tab da ist</h4>
            <p>{section.objective}</p>
            <h4>Wann du ihn benutzt</h4>
            <p>{section.whenToUse}</p>
            <h4>Bevor du startest</h4>
            <ul>
              {section.beforeYouStart.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>

          <article className="fd-tutorial-card">
            <h4>Kernfunktionen</h4>
            <ul>
              {section.keyFunctions.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <h4>Verwandte Tabs</h4>
            <ul>
              {section.relatedTabs.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        </div>

        <article className="fd-tutorial-card">
          <h4>Bereiche und Bedienelemente</h4>
          <div className="fd-control-list">
            {section.controls.map((control) => (
              <div key={`${section.id}-${control.name}`} className="fd-control-item">
                <div className="fd-control-head">
                  <strong>{control.name}</strong>
                  <span>{control.area}</span>
                </div>
                <p>{control.purpose}</p>
                <small>{control.howToUse}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="fd-tutorial-card">
          <h4>Schritt-fuer-Schritt</h4>
          <div className="fd-tutorial-steps">
            {section.walkthrough.map((step) => (
              <div key={step.title} className="fd-tutorial-step">
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
                <div className="fd-step-detail">
                  <span>Konkrete Aktion</span>
                  <p>{step.action}</p>
                </div>
                <div className="fd-step-detail">
                  <span>Woran du Erfolg erkennst</span>
                  <p>{step.expected}</p>
                </div>
                <div className="fd-step-detail warning">
                  <span>Worauf du achten musst</span>
                  <p>{step.warning}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <div className="fd-tutorial-grid">
          <article className="fd-tutorial-card">
            <h4>Interaktive Uebung</h4>
            <ol>
              {section.practiceTasks.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </article>

          <article className="fd-tutorial-card">
            <h4>Typische Fehler</h4>
            <div className="fd-risk-list">
              {section.commonMistakes.map((item) => (
                <div key={item} className="fd-risk-item">
                  <ShieldAlert size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="fd-tutorial-grid">
          <article className="fd-tutorial-card">
            <h4>Praxis-Hinweise</h4>
            <ul>
              {section.tips.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>

          <article className="fd-tutorial-card">
            <h4>Ergebnischeck</h4>
            <ul>
              {section.successChecks.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        </div>
      </section>
    ))}
  </div>
);

export default TutorialTab;
