import React, { useMemo, useRef, useState } from 'react';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import { getCurrentLocale } from '../utils/i18n';
import './AgentSystemSection.css';
import { copy, agents, pipeline, approvalRules, metrics, tabs } from '../data/agentSystemData';

const AgentSystemSection = () => {
    const sectionRef = useRef(null);
    useRevealOnScroll(sectionRef, '.reveal, .reveal-left, .reveal-right, .reveal-scale');

    const locale = getCurrentLocale();
    const lang = copy[locale] ? locale : 'de';
    const text = copy[lang];
    const [activeTab, setActiveTab] = useState('proof');
    const [activeAgentName, setActiveAgentName] = useState('Guardian');

    const activeAgent = useMemo(
        () => agents.find((agent) => agent.name === activeAgentName) || agents[0],
        [activeAgentName],
    );
    const ActiveAgentIcon = activeAgent.icon;

    return (
        <section className="agent-system-section section" id="agents" ref={sectionRef}>
            <div className="container">
                <div className="agent-system-header reveal">
                    <span className="section-label">{text.sectionLabel}</span>
                    <h2 className="section-title text-gradient">{text.title}</h2>
                    <p className="section-subtitle">{text.subtitle}</p>
                </div>

                <div className="agent-proof-grid">
                    <div className="agent-console reveal-left">
                        <div className="agent-console-topbar">
                            <span className="agent-console-dot"></span>
                            <span>{text.lastRun}</span>
                            <strong>{text.gate}: {text.gateStatus}</strong>
                        </div>

                        <div className="agent-metrics" aria-label={text.lastRun}>
                            {metrics.map((metric) => (
                                <div className="agent-metric-cell" key={metric.key}>
                                    <span className="agent-metric-value">{metric.value}</span>
                                    <span className="agent-metric-label">{text[metric.key]}</span>
                                </div>
                            ))}
                        </div>

                        <div className="agent-terminal">
                            <span className="agent-terminal-label">{text.commandLabel}</span>
                            <code>{text.command}</code>
                            <strong>{text.commandResult}</strong>
                        </div>
                    </div>

                    <div className="agent-explainer reveal-right">
                        <div className="agent-tablist" role="tablist" aria-label={text.sectionLabel}>
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        className={`agent-tab ${activeTab === tab.id ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                        role="tab"
                                        aria-selected={activeTab === tab.id}
                                    >
                                        <Icon size={17} aria-hidden="true" />
                                        <span>{text[tab.labelKey]}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {activeTab === 'proof' && (
                            <div className="agent-tab-panel" role="tabpanel">
                                <h3>{text.liveEvidence}</h3>
                                <p>{text.liveEvidenceText}</p>
                                <div className="agent-proof-lines">
                                    {[
                                        'docs/agent-system/OPERATING_MODEL.md',
                                        'docs/agent-system/job-catalog.json',
                                        'scripts/agent-audit.mjs',
                                        '.github/workflows/web-quality.yml',
                                    ].map((line) => (
                                        <span key={line}>{line}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'roles' && (
                            <div className="agent-tab-panel" role="tabpanel">
                                <h3>{text.selectedAgent}</h3>
                                <div className="agent-detail">
                                    <ActiveAgentIcon size={24} aria-hidden="true" />
                                    <div>
                                        <strong>{activeAgent.name}</strong>
                                        <span>{text.scoreLabel}: {activeAgent.score}/100</span>
                                    </div>
                                </div>
                                <p>{activeAgent.mission[lang]}</p>
                                <p>{activeAgent.proof[lang]}</p>
                                <small>{text.nextAction}: {activeAgent.next[lang]}</small>
                            </div>
                        )}

                        {activeTab === 'gates' && (
                            <div className="agent-tab-panel" role="tabpanel">
                                <h3>{text.approvalTitle}</h3>
                                <div className="agent-rule-list">
                                    {approvalRules.map((rule) => {
                                        const Icon = rule.icon;
                                        return (
                                            <div className="agent-rule" key={rule.title[lang]}>
                                                <Icon size={18} aria-hidden="true" />
                                                <div>
                                                    <strong>{rule.title[lang]}</strong>
                                                    <span>{rule.text[lang]}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="agent-roster reveal">
                    {agents.map((agent) => {
                        const Icon = agent.icon;
                        const selected = activeAgentName === agent.name;
                        return (
                            <button
                                key={agent.name}
                                type="button"
                                className={`agent-roster-item ${selected ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveAgentName(agent.name);
                                    setActiveTab('roles');
                                }}
                                aria-pressed={selected}
                            >
                                <Icon size={18} aria-hidden="true" />
                                <span>{agent.name}</span>
                                <strong>{agent.score}</strong>
                            </button>
                        );
                    })}
                </div>

                <div className="agent-loop-band reveal-scale">
                    <div className="agent-loop-heading">
                        <span>{text.pipelineTitle}</span>
                        <strong>{text.statusPass}</strong>
                    </div>
                    <div className="agent-loop-steps">
                        {pipeline.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div className="agent-loop-step" key={step.title[lang]}>
                                    <span className="agent-loop-index">{String(index + 1).padStart(2, '0')}</span>
                                    <Icon size={20} aria-hidden="true" />
                                    <strong>{step.title[lang]}</strong>
                                    <p>{step.text[lang]}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="agent-conviction reveal">
                    <h3>{text.decisionTitle}</h3>
                    <p>{text.decisionText}</p>
                </div>
            </div>
        </section>
    );
};

export default AgentSystemSection;
