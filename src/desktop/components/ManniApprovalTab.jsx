import React, { useMemo, useState } from 'react';
import {
  BadgeCheck, Check, Eye, FileText, Image as ImageIcon, Milestone,
  RefreshCw, Send, SquareChartGantt, X, WandSparkles, ClipboardList,
} from 'lucide-react';

const STATUS_META = {
  pending: { label: 'Ausstehend', tone: 'pending' },
  approved: { label: 'Freigegeben', tone: 'approved' },
  rejected: { label: 'Abgelehnt', tone: 'rejected' },
  executed: { label: 'Ausgefuehrt', tone: 'executed' },
  failed: { label: 'Fehlgeschlagen', tone: 'failed' },
};

const getStatusMeta = (status) => STATUS_META[status] || {
  label: String(status || 'Unbekannt'),
  tone: 'neutral',
};

const CAMPAIGN_STATUS_LABELS = {
  draft: 'Entwurf',
  approved_for_execution_dispatch: 'Freigegeben zur Ausfuehrung',
  pending_user_ok: 'Wartet auf Nutzerfreigabe',
  external_live: 'Live',
};

const getCampaignStatusLabel = (status) => (
  CAMPAIGN_STATUS_LABELS[String(status || '').trim().toLowerCase()]
  || String(status || 'Entwurf')
);

const summarizeOperation = (operation = {}) => (
  operation.copyHook
  || operation.action
  || operation.title
  || operation.platform
  || 'Ohne Beschreibung'
);

const flattenVisualAssets = (assets = []) => assets.flatMap((group) => {
  if (!group) return [];
  const title = group.title ? `${group.title}: ` : '';
  const itemLines = Array.isArray(group.items)
    ? group.items.map((item) => `${title}${item.label || item.key || 'Asset'} - ${item.value || ''}`.trim())
    : [];
  if (group.summary) itemLines.push(`${title}${group.summary}`);
  return itemLines;
});

const flattenMeasurementWindows = (windows = []) => windows.map((entry) => (
  entry?.detail ? `${entry.window}: ${entry.detail}` : (entry?.window || entry?.label || '')
));

const getOperationDecision = (operation = {}) => operation?.decision || operation?.approval || {};
const EMPTY_OPERATIONS = [];
const CHANNEL_OPTIONS = ['Instagram', 'Facebook', 'TikTok', 'YouTube Shorts', 'Newsletter', 'Website'];

const ApprovalButton = ({ label, tone, icon, onClick, disabled }) => {
  const ButtonIcon = icon;
  return (
  <button
    type="button"
    className={`fd-button ${tone === 'secondary' ? 'secondary' : ''} fd-manni-approval-btn ${tone}`}
    onClick={onClick}
    disabled={disabled}
  >
    <ButtonIcon size={15} />
    {label}
  </button>
  );
};

const DetailList = ({ title, items, icon }) => {
  const ItemIcon = icon;
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <section className="fd-surface fd-manni-subsection">
      <div className="fd-section-head">
        <h3>{title}</h3>
        <span>{items.length}</span>
      </div>
      <div className="fd-manni-bullet-list">
        {items.map((item, index) => (
          <div key={`${title}-${index}`} className="fd-manni-bullet-item">
            <ItemIcon size={14} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

const ManniApprovalTab = ({
  state,
  busy = false,
  onRefresh = () => {},
  onUpdateApproval = () => {},
  onCreateDraftRequest = () => {},
}) => {
  const operations = Array.isArray(state?.operations) ? state.operations : EMPTY_OPERATIONS;
  const [selectedOperationId, setSelectedOperationId] = useState('');
  const [noteDraft, setNoteDraft] = useState({ operationId: '', value: '' });
  const [viewMode, setViewMode] = useState('briefing');
  const [draftForm, setDraftForm] = useState({
    title: '',
    objective: '',
    constraints: '',
    ownerAgent: 'Manni',
    channels: ['Instagram', 'Facebook'],
  });
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState(null);

  const selectedOperation = useMemo(
    () => operations.find((entry) => entry.id === selectedOperationId) || operations[0] || null,
    [operations, selectedOperationId],
  );

  const selectedDecision = getOperationDecision(selectedOperation);
  const effectiveNoteDraft = noteDraft.operationId === selectedOperation?.id
    ? noteDraft.value
    : (selectedDecision?.notes || selectedDecision?.note || '');

  if (!state?.proposal) {
    return (
      <section className="fd-empty-state">
        <div className="fd-empty-icon">
          <SquareChartGantt size={48} />
        </div>
        <h2>Keine Manni-Kampagne gefunden</h2>
        <p>Lege zuerst ein PR-/Social-Ops-Paket im Agenten-System an oder aktualisiere die Datenquelle im Workspace.</p>
        <button type="button" className="fd-button" onClick={onRefresh} disabled={busy}>
          <RefreshCw size={16} className={busy ? 'fd-spin' : ''} />
          Manni-Daten laden
        </button>
      </section>
    );
  }

  const meta = getStatusMeta(selectedDecision?.status);
  const proposal = state.proposal;
  const proposalMeta = proposal?.metadata || {};
  const visualAssets = flattenVisualAssets(state.visualAssets);
  const executionChecklist = proposal?.executionChecklist || [];
  const measurementWindows = flattenMeasurementWindows(proposal?.measurementWindows || []);
  const draftRequests = Array.isArray(state?.draftRequests) ? state.draftRequests : [];

  const toggleChannel = (channel) => {
    setDraftForm((current) => ({
      ...current,
      channels: current.channels.includes(channel)
        ? current.channels.filter((entry) => entry !== channel)
        : [...current.channels, channel],
    }));
  };

  const submitDraftRequest = async () => {
    await onCreateDraftRequest(draftForm);
    setDraftForm((current) => ({
      ...current,
      title: '',
      objective: '',
      constraints: '',
    }));
  };

  const submitApproval = async ({ status }) => {
    if (!selectedOperation?.id) return;
    setApprovalBusy(true);
    setApprovalFeedback(null);
    try {
      const result = await onUpdateApproval({
        operationId: selectedOperation.id,
        status,
        note: effectiveNoteDraft,
      });
      if (result?.ok === false) {
        setApprovalFeedback({ tone: 'error', message: 'Aktion konnte nicht gespeichert werden.' });
        return;
      }
      const statusLabel = getStatusMeta(status).label;
      setApprovalFeedback({ tone: 'success', message: `${selectedOperation.id} wurde auf "${statusLabel}" gesetzt.` });
    } catch {
      setApprovalFeedback({ tone: 'error', message: 'Aktion konnte nicht gespeichert werden.' });
    } finally {
      setApprovalBusy(false);
    }
  };

  return (
    <div className="fd-panel-stack">
      <section className="fd-toolbar-band">
        <div>
          <h2>Marketing Manager</h2>
          <p>Kampagnenentwuerfe beauftragen und bestehende Reach-Aktionen im selben Workflow steuern.</p>
        </div>
        <div className="fd-toolbar-actions">
          <span className="fd-status-pill neutral">
            <BadgeCheck size={14} />
            {getCampaignStatusLabel(state.summary?.status || proposalMeta.status)}
          </span>
          <span className="fd-status-pill neutral">
            <Milestone size={14} />
            {operations.length} Aktionen
          </span>
          <button type="button" className="fd-button" onClick={onRefresh} disabled={busy}>
            <RefreshCw size={16} className={busy ? 'fd-spin' : ''} />
            Aktualisieren
          </button>
        </div>
      </section>

      <section className="fd-surface">
        <div className="fd-toolbar-actions">
          <button
            type="button"
            className={`fd-button ${viewMode === 'briefing' ? '' : 'secondary'}`}
            onClick={() => setViewMode('briefing')}
          >
            <WandSparkles size={15} />
            Entwurfsauftraege
          </button>
          <button
            type="button"
            className={`fd-button ${viewMode === 'approval' ? '' : 'secondary'}`}
            onClick={() => setViewMode('approval')}
          >
            <ClipboardList size={15} />
            Freigaben & Ausspielung
          </button>
        </div>
      </section>

      {viewMode === 'briefing' && (
        <div className="fd-two-column">
          <section className="fd-surface">
            <div className="fd-section-head">
              <h3>Unteragentenauftrag anlegen</h3>
              <span>Marketing-Entwurf</span>
            </div>
            <div className="fd-manni-detail-grid">
              <label className="fd-manni-copy-box">
                <small>Titel</small>
                <input
                  value={draftForm.title}
                  onChange={(event) => setDraftForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="z. B. Kampagne Booking Push Berlin Q3"
                />
              </label>
              <label className="fd-manni-copy-box">
                <small>Ziel</small>
                <textarea
                  value={draftForm.objective}
                  onChange={(event) => setDraftForm((current) => ({ ...current, objective: event.target.value }))}
                  rows={3}
                  placeholder="Welche Wirkung soll der Entwurf erzielen?"
                />
              </label>
              <label className="fd-manni-copy-box">
                <small>Rahmenbedingungen</small>
                <textarea
                  value={draftForm.constraints}
                  onChange={(event) => setDraftForm((current) => ({ ...current, constraints: event.target.value }))}
                  rows={3}
                  placeholder="Budget, Tonalitaet, No-Gos, Zeitraum ..."
                />
              </label>
              <label className="fd-manni-kv">
                <small>Owner-Agent</small>
                <input
                  value={draftForm.ownerAgent}
                  onChange={(event) => setDraftForm((current) => ({ ...current, ownerAgent: event.target.value }))}
                />
              </label>
              <div className="fd-manni-copy-box">
                <small>Kanaele</small>
                <div className="fd-toolbar-actions">
                  {CHANNEL_OPTIONS.map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      className={`fd-button ${draftForm.channels.includes(channel) ? '' : 'secondary'}`}
                      onClick={() => toggleChannel(channel)}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>
              <div className="fd-manni-approval-actions">
                <button
                  type="button"
                  className="fd-button"
                  disabled={busy || !draftForm.title.trim()}
                  onClick={submitDraftRequest}
                >
                  <Send size={15} />
                  Unteragentenauftrag speichern
                </button>
              </div>
            </div>
          </section>

          <section className="fd-surface">
            <div className="fd-section-head">
              <h3>Entwurfsauftraege</h3>
              <span>{draftRequests.length} Eintraege</span>
            </div>
            <div className="fd-manni-queue-list">
              {draftRequests.map((request) => (
                <div key={request.id} className="fd-manni-opcard active">
                  <div className="fd-manni-opcard-topline">
                    <strong>{request.id}</strong>
                    <span className="fd-manni-status-chip pending">{request.status || 'angefragt'}</span>
                  </div>
                  <div className="fd-manni-opcard-platform">{request.title}</div>
                  <p>{request.objective || 'Kein Zieltext hinterlegt.'}</p>
                  <small>{(request.channels || []).join(', ') || 'Keine Kanaele'} | {request.ownerAgent || 'Manni'}</small>
                </div>
              ))}
              {draftRequests.length === 0 && (
                <p>Noch keine Entwurfsauftraege vorhanden.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {viewMode === 'approval' && (
      <div className="fd-manni-layout">
        <section className="fd-surface fd-manni-queue">
          <div className="fd-section-head">
            <h3>Vorschlaege</h3>
            <span>{operations.length} aktiv</span>
          </div>
          <div className="fd-manni-queue-list">
            {operations.map((operation) => {
              const statusState = getStatusMeta(getOperationDecision(operation)?.status);
              return (
                <button
                  key={operation.id}
                  type="button"
                  className={`fd-manni-opcard ${selectedOperation?.id === operation.id ? 'active' : ''}`}
                  onClick={() => setSelectedOperationId(operation.id)}
                >
                  <div className="fd-manni-opcard-topline">
                    <strong>{operation.id}</strong>
                    <span className={`fd-manni-status-chip ${statusState.tone}`}>{statusState.label}</span>
                  </div>
                  <div className="fd-manni-opcard-platform">{operation.platform || 'Plattform offen'}</div>
                  <p>{summarizeOperation(operation)}</p>
                  <small>{operation.timing || operation.kpiGoal || operation.budget || 'Noch ohne Timing'}</small>
                </button>
              );
            })}
          </div>
        </section>

        <div className="fd-panel-stack fd-manni-detail-stack">
          <section className="fd-surface fd-manni-visual">
            <div className="fd-section-head">
              <h3>Visualisierung</h3>
              <span>{selectedOperation?.platform || 'Aktion'}</span>
            </div>
            {selectedOperation ? (
              <div className="fd-manni-preview-window">
                <div className="fd-manni-preview-header">
                  <span className="fd-eyebrow">MANNI VORSCHAU</span>
                  <span className={`fd-manni-status-chip ${meta.tone}`}>{meta.label}</span>
                </div>
                <div className="fd-manni-preview-surface">
                  <div className="fd-manni-preview-brand">AIRDOX</div>
                  <div className="fd-manni-preview-platform">{selectedOperation.platform || 'Social-Aktion'}</div>
                  <div className="fd-manni-preview-hook">{selectedOperation.copyHook || selectedOperation.action || 'Kein Hook hinterlegt'}</div>
                  <div className="fd-manni-preview-asset">
                    <ImageIcon size={16} />
                    <span>{selectedOperation.asset || 'Asset wird aus Queue/Designer-Pack gezogen'}</span>
                  </div>
                  <div className="fd-manni-preview-cta">{selectedOperation.targetUrl || selectedOperation.kpiGoal || selectedOperation.kpiTarget || 'Ziel-KPI noch offen'}</div>
                </div>
                <div className="fd-manni-preview-footer">
                  <span>{selectedOperation.timing || 'Timing offen'}</span>
                  <span>{selectedOperation.budget || '0 EUR'}</span>
                </div>
              </div>
            ) : (
              <div className="fd-empty-state">
                <p>Keine Operation ausgewaehlt.</p>
              </div>
            )}
          </section>

          <section className="fd-surface fd-manni-detail">
            <div className="fd-section-head">
              <h3>Freigabe</h3>
              <span>{selectedOperation?.id || 'n/a'}</span>
            </div>
            {selectedOperation ? (
              <div className="fd-manni-detail-grid">
                <div className="fd-manni-kv">
                  <small>Plattform</small>
                  <strong>{selectedOperation.platform || 'n/a'}</strong>
                </div>
                <div className="fd-manni-kv">
                  <small>Aktion</small>
                  <strong>{selectedOperation.action || 'n/a'}</strong>
                </div>
                <div className="fd-manni-kv">
                  <small>Ziel</small>
                  <strong>{selectedOperation.kpiGoal || 'n/a'}</strong>
                </div>
                <div className="fd-manni-kv">
                  <small>Budget</small>
                  <strong>{selectedOperation.budget || '0 EUR'}</strong>
                </div>
                <div className="fd-manni-copy-box">
                  <small>Copy / Hook</small>
                  <p>{selectedOperation.copyHook || 'Keine Copy hinterlegt.'}</p>
                </div>
                <div className="fd-manni-copy-box">
                  <small>Asset / Ziel-URL</small>
                  <p>{selectedOperation.asset || 'Kein Asset angegeben.'}</p>
                  <p>{selectedOperation.targetUrl || 'Keine Ziel-URL angegeben.'}</p>
                </div>
                <label className="fd-manni-note-box">
                  <span>Notiz fuer die Entscheidung</span>
                  <textarea
                    value={effectiveNoteDraft}
                    onChange={(event) => setNoteDraft({
                      operationId: selectedOperation.id,
                      value: event.target.value,
                    })}
                    rows={4}
                    placeholder="Optional: warum freigegeben, warum abgelehnt, Randbedingungen ..."
                  />
                </label>
                <div className="fd-manni-approval-actions">
                  <ApprovalButton
                    label="Freigeben"
                    tone="approve"
                    icon={Check}
                    disabled={busy || approvalBusy}
                    onClick={() => submitApproval({ status: 'approved' })}
                  />
                  <ApprovalButton
                    label="Ablehnen"
                    tone="reject"
                    icon={X}
                    disabled={busy || approvalBusy}
                    onClick={() => submitApproval({ status: 'rejected' })}
                  />
                  <ApprovalButton
                    label="Zurueck auf Ausstehend"
                    tone="secondary"
                    icon={RefreshCw}
                    disabled={busy || approvalBusy}
                    onClick={() => submitApproval({ status: 'pending' })}
                  />
                </div>
                {approvalFeedback && (
                  <p className={`fd-inline-feedback ${approvalFeedback.tone}`}>
                    {approvalFeedback.message}
                  </p>
                )}
              </div>
            ) : (
              <p>Waehle links einen Vorschlag aus.</p>
            )}
          </section>
        </div>
      </div>
      )}

      {viewMode === 'approval' && (
      <div className="fd-three-column">
        <DetailList title="Produzierte Assets" items={visualAssets} icon={ImageIcon} />
        <DetailList title="Ausfuehrungs-Checkliste" items={executionChecklist} icon={Send} />
        <DetailList title="Messfenster" items={measurementWindows} icon={Eye} />
      </div>
      )}

      {viewMode === 'approval' && (
      <section className="fd-surface fd-manni-proposal">
        <div className="fd-section-head">
          <h3>Vorschlagsfenster</h3>
          <span>{state.summary?.title || proposalMeta.title || state.summary?.goal || 'Manni Plan'}</span>
        </div>
        <div className="fd-manni-proposal-grid">
          <div className="fd-manni-copy-box">
            <small>Ziel</small>
            <p>{state.summary?.goal || proposalMeta.goal || 'Kein Zieltext gefunden.'}</p>
          </div>
          <div className="fd-manni-copy-box">
            <small>Freigabe</small>
            <p>{state.summary?.approval || proposalMeta.approval || 'Kein Freigabetext gefunden.'}</p>
          </div>
          <div className="fd-manni-copy-box">
            <small>Rahmen</small>
            <p>{proposal?.executionBoundary?.summary || 'Kein Rahmen notiert.'}</p>
          </div>
          <div className="fd-manni-copy-box">
            <small>Quelle</small>
            <p>{state.rawMarkdownPath || 'Keine Quelldatei erkannt.'}</p>
            <p>{state.approvalsPath || 'Keine Approval-Datei erkannt.'}</p>
          </div>
        </div>
        {proposal?.sourceMarkdown && (
          <div className="fd-manni-markdown-box">
            <div className="fd-section-head">
              <h3>Markdown-Auszug</h3>
              <span><FileText size={14} /> Original</span>
            </div>
            <pre>{proposal.sourceMarkdown.slice(0, 2400)}</pre>
          </div>
        )}
      </section>
      )}
    </div>
  );
};

export default ManniApprovalTab;
