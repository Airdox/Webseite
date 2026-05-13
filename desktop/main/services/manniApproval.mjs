import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureDirectory, fileExists, getAgentSystemPaths } from './workspace.mjs';

const PROPOSAL_FILENAME = 'MANNI_PR_SOCIAL_REACH_OPS_2026-05-13.md';
const APPROVAL_STATE_FILENAME = 'manni-approval-state.json';
const DRAFT_REQUESTS_FILENAME = 'marketing-draft-requests.json';
const VALID_STATUSES = new Set(['pending', 'approved', 'rejected', 'executed', 'failed']);

const stripMarkdownCode = (value = '') => String(value).replace(/^`|`$/g, '').trim();

const normalizeWhitespace = (value = '') => String(value).replace(/\s+/g, ' ').trim();

const splitMarkdownRow = (line = '') => line
  .trim()
  .replace(/^\||\|$/g, '')
  .split('|')
  .map((cell) => cell.trim());

const readIfExists = async (targetPath) => {
  if (!(await fileExists(targetPath))) return '';
  return fs.readFile(targetPath, 'utf8');
};

const extractSection = (markdown, heading) => {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headingMatch = markdown.match(new RegExp(`^## ${escaped}\\r?\\n`, 'm'));
  if (headingMatch?.index === undefined) return '';

  const sectionStart = headingMatch.index + headingMatch[0].length;
  const rest = markdown.slice(sectionStart);
  const nextHeadingMatch = rest.match(/^## .+\r?\n/m);
  const sectionEnd = nextHeadingMatch?.index >= 0 ? sectionStart + nextHeadingMatch.index : markdown.length;
  return markdown.slice(sectionStart, sectionEnd).trim();
};

const extractSectionFirst = (markdown, headings = []) => {
  for (const heading of headings) {
    const section = extractSection(markdown, heading);
    if (section) return section;
  }
  return '';
};

const parseMetadata = (markdown) => {
  const metadata = {};
  for (const match of markdown.matchAll(/^([A-Za-z][A-Za-z /_-]+):\s*(.+)$/gm)) {
    const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
    if (key.startsWith('##')) continue;
    metadata[key] = match[2].trim();
  }
  return metadata;
};

const parseBulletList = (sectionText = '') => sectionText
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => /^[-*]\s+/.test(line))
  .map((line) => line.replace(/^[-*]\s+/, '').trim());

const parseNumberedList = (sectionText = '') => sectionText
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => /^\d+\.\s+/.test(line))
  .map((line) => line.replace(/^\d+\.\s+/, '').trim());

const parseKeyValueBullet = (line = '') => {
  const value = line.replace(/^[-*]\s+/, '').trim();
  const separatorIndex = value.indexOf(':');
  if (separatorIndex === -1) return null;
  const key = value.slice(0, separatorIndex).trim().toLowerCase().replace(/[^\w]+/g, '_');
  return {
    key,
    label: value.slice(0, separatorIndex).trim(),
    value: stripMarkdownCode(value.slice(separatorIndex + 1).trim()),
  };
};

const parsePlatformOperations = (sectionText = '') => {
  const lines = sectionText.split(/\r?\n/).filter(Boolean);
  const tableLines = lines.filter((line) => /^\|/.test(line.trim()));
  if (tableLines.length < 3) return [];

  const headers = splitMarkdownRow(tableLines[0]).map((header) => header.toLowerCase());
  return tableLines.slice(2).map((line) => {
    const cells = splitMarkdownRow(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = stripMarkdownCode(cells[index] || '');
    });
    return {
      id: row.id || '',
      platform: row.plattform || row.platform || '',
      action: row.aktion || row.action || '',
      copyHook: row['copy/hook'] || '',
      asset: row.asset || '',
      targetUrl: row['ziel-url'] || row['target-url'] || '',
      timing: row.timing || '',
      kpiGoal: row['kpi-ziel'] || row.kpi || '',
      budget: row.budget || '',
    };
  }).filter((operation) => operation.id);
};

const parseProducedAssets = (sectionText = '') => {
  const groups = [];
  let currentGroup = null;

  for (const rawLine of sectionText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (!line.startsWith('-') && line.endsWith(':')) {
      currentGroup = {
        title: line.slice(0, -1).trim(),
        items: [],
        summary: '',
      };
      groups.push(currentGroup);
      continue;
    }

    if (!currentGroup) {
      currentGroup = {
        title: 'Allgemein',
        items: [],
        summary: '',
      };
      groups.push(currentGroup);
    }

    if (line.startsWith('- ')) {
      const parsed = parseKeyValueBullet(line);
      if (parsed) {
        currentGroup.items.push(parsed);
      } else {
        currentGroup.items.push({ key: 'note', label: 'Note', value: line.replace(/^- /, '').trim() });
      }
    } else {
      currentGroup.summary = currentGroup.summary
        ? `${currentGroup.summary} ${normalizeWhitespace(line)}`
        : normalizeWhitespace(line);
    }
  }

  return groups;
};

const parseMeasurementWindows = (sectionText = '') => parseBulletList(sectionText).map((entry) => {
  const separatorIndex = entry.indexOf(':');
  if (separatorIndex === -1) {
    return { label: entry, window: entry, detail: '' };
  }
  return {
    label: entry,
    window: entry.slice(0, separatorIndex).trim(),
    detail: entry.slice(separatorIndex + 1).trim(),
  };
});

const parseDispatchResult = (sectionText = '') => {
  const dispatchedMatch = sectionText.match(/Dispatched:\s*(.+)/i);
  const commandMatch = sectionText.match(/```[a-zA-Z]*\r?\n([\s\S]*?)```/m);
  return {
    dispatchedAt: dispatchedMatch?.[1]?.trim() || '',
    command: commandMatch?.[1]?.trim() || '',
    runnerNotes: parseBulletList(sectionText),
  };
};

const buildDefaultState = (operationIds = [], proposalPath = '') => {
  const operations = {};
  const timestamp = new Date().toISOString();
  for (const operationId of operationIds) {
    operations[operationId] = {
      status: 'pending',
      notes: '',
      updatedAt: timestamp,
      decisionAt: '',
      decidedBy: '',
    };
  }
  return {
    version: 1,
    proposalSource: proposalPath,
    createdAt: timestamp,
    updatedAt: timestamp,
    operations,
  };
};

const mergeStateWithOperations = (state, operationIds) => {
  const merged = { ...state, operations: { ...(state?.operations || {}) } };
  let changed = false;
  for (const operationId of operationIds) {
    if (!merged.operations[operationId]) {
      merged.operations[operationId] = {
        status: 'pending',
        notes: '',
        updatedAt: new Date().toISOString(),
        decisionAt: '',
        decidedBy: '',
      };
      changed = true;
    }
  }
  return { state: merged, changed };
};

const writeApprovalState = async (statePath, state) => {
  await ensureDirectory(path.dirname(statePath));
  const nextState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(statePath, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8');
  return nextState;
};

const readDraftRequests = async (workspaceRoot) => {
  const { approvalStatePath } = getAgentSystemPaths(workspaceRoot, {
    approvalStateFile: DRAFT_REQUESTS_FILENAME,
  });
  if (!(await fileExists(approvalStatePath))) return [];
  try {
    const raw = await fs.readFile(approvalStatePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeDraftRequests = async (workspaceRoot, requests) => {
  const { approvalStatePath } = getAgentSystemPaths(workspaceRoot, {
    approvalStateFile: DRAFT_REQUESTS_FILENAME,
  });
  await ensureDirectory(path.dirname(approvalStatePath));
  await fs.writeFile(approvalStatePath, `${JSON.stringify(requests, null, 2)}\n`, 'utf8');
  return requests;
};

export const readManniApprovalState = async (workspaceRoot, operationIds = []) => {
  const { approvalStatePath, proposalPath } = getAgentSystemPaths(workspaceRoot, {
    proposalFile: PROPOSAL_FILENAME,
    approvalStateFile: APPROVAL_STATE_FILENAME,
  });

  if (!(await fileExists(approvalStatePath))) {
    const initialState = buildDefaultState(operationIds, proposalPath);
    return writeApprovalState(approvalStatePath, initialState);
  }

  const raw = await fs.readFile(approvalStatePath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = buildDefaultState(operationIds, proposalPath);
  }

  const { state, changed } = mergeStateWithOperations(parsed, operationIds);
  if (changed || state.proposalSource !== proposalPath) {
    state.proposalSource = proposalPath;
    return writeApprovalState(approvalStatePath, state);
  }

  return state;
};

const readProposalBundle = async (workspaceRoot) => {
  const { proposalPath, approvalStatePath } = getAgentSystemPaths(workspaceRoot, {
    proposalFile: PROPOSAL_FILENAME,
    approvalStateFile: APPROVAL_STATE_FILENAME,
  });
  const markdown = await readIfExists(proposalPath);
  if (!markdown) {
    throw new Error(`Manni-Vorschlagsdokument nicht gefunden: ${proposalPath}`);
  }

  const metadata = parseMetadata(markdown);
  const executionBoundary = extractSectionFirst(markdown, ['Ausfuehrungsrahmen', 'Execution Boundary']);
  const platformOperations = parsePlatformOperations(extractSectionFirst(markdown, ['Plattform-Aktionen', 'Platform Operations']));
  const approvalState = await readManniApprovalState(workspaceRoot, platformOperations.map((entry) => entry.id));
  const producedAssets = parseProducedAssets(extractSectionFirst(markdown, ['Produzierte Assets', 'Produced Assets']));
  const executionChecklist = parseNumberedList(extractSectionFirst(markdown, ['Ausfuehrungs-Checkliste', 'Execution Checklist']));
  const measurementWindows = parseMeasurementWindows(extractSectionFirst(markdown, ['Messfenster', 'Measurement Windows']));
  const dispatchResult = parseDispatchResult(extractSectionFirst(markdown, ['Dispatch-Ergebnis', 'Dispatch Result']));

  return {
    metadata: {
      title: markdown.split(/\r?\n/)[0]?.replace(/^#\s*/, '').trim() || 'Manni Vorschlag',
      status: metadata.status || '',
      owner: metadata.owner || '',
      goal: metadata.goal || '',
      approval: metadata.approval || '',
      proposalPath,
      approvalStatePath,
    },
    executionBoundary: {
      summary: normalizeWhitespace(executionBoundary.split(/\r?\n\r?\n/)[0] || ''),
      rules: parseBulletList(executionBoundary),
    },
    operations: platformOperations.map((operation) => ({
      ...operation,
      decision: approvalState.operations?.[operation.id] || {
        status: 'pending',
        notes: '',
        updatedAt: '',
        decisionAt: '',
        decidedBy: '',
      },
    })),
    producedAssets,
    executionChecklist,
    measurementWindows,
    dispatchResult,
    approvalState,
    source: {
      markdown,
      proposalPath,
    },
  };
};

const toCampaignState = (bundle, draftRequests = []) => ({
  proposal: {
    metadata: bundle.metadata,
    executionBoundary: bundle.executionBoundary,
    producedAssets: bundle.producedAssets,
    executionChecklist: bundle.executionChecklist,
    measurementWindows: bundle.measurementWindows,
    dispatchResult: bundle.dispatchResult,
    sourceMarkdown: bundle.source.markdown,
  },
  approvals: bundle.approvalState,
  operations: bundle.operations,
  summary: {
    title: bundle.metadata.title,
    status: bundle.metadata.status,
    owner: bundle.metadata.owner,
    goal: bundle.metadata.goal,
    approval: bundle.metadata.approval,
    operationCount: bundle.operations.length,
    approvedCount: bundle.operations.filter((entry) => entry.decision?.status === 'approved').length,
    rejectedCount: bundle.operations.filter((entry) => entry.decision?.status === 'rejected').length,
    pendingCount: bundle.operations.filter((entry) => !entry.decision?.status || entry.decision?.status === 'pending').length,
  },
  visualAssets: bundle.producedAssets,
  draftRequests,
  rawMarkdownPath: bundle.metadata.proposalPath,
  approvalsPath: bundle.metadata.approvalStatePath,
});

export const getManniCampaignState = async (workspaceRoot) => {
  const bundle = await readProposalBundle(workspaceRoot);
  const draftRequests = await readDraftRequests(workspaceRoot);
  return toCampaignState(bundle, draftRequests);
};

export const updateManniOperationApproval = async (workspaceRoot, payload = {}) => {
  const operationId = String(payload.operationId || '').trim();
  const status = String(payload.status || '').trim().toLowerCase();

  if (!operationId) {
    throw new Error('operationId ist erforderlich');
  }
  if (!VALID_STATUSES.has(status)) {
    throw new Error(`Ungueltiger Status "${status}". Erwartet: ${Array.from(VALID_STATUSES).join(', ')}`);
  }

  const proposal = await readProposalBundle(workspaceRoot);
  const knownIds = new Set(proposal.operations.map((entry) => entry.id));
  if (!knownIds.has(operationId)) {
    throw new Error(`Unbekannte Manni-operationId "${operationId}"`);
  }

  const { approvalStatePath } = getAgentSystemPaths(workspaceRoot, {
    proposalFile: PROPOSAL_FILENAME,
    approvalStateFile: APPROVAL_STATE_FILENAME,
  });
  const state = await readManniApprovalState(workspaceRoot, [...knownIds]);
  const timestamp = new Date().toISOString();
  state.operations[operationId] = {
    ...state.operations[operationId],
    status,
    notes: String(payload.note || payload.notes || '').trim(),
    decidedBy: String(payload.decidedBy || payload.actor || '').trim(),
    decisionAt: timestamp,
    updatedAt: timestamp,
  };

  const nextState = await writeApprovalState(approvalStatePath, state);
  const refreshed = await getManniCampaignState(workspaceRoot);
  return {
    ...refreshed,
    approvals: nextState,
  };
};

export const createMarketingDraftRequest = async (workspaceRoot, payload = {}) => {
  const title = String(payload.title || '').trim();
  if (!title) {
    throw new Error('Titel fuer Entwurfsauftrag ist erforderlich');
  }
  const now = new Date().toISOString();
  const requests = await readDraftRequests(workspaceRoot);
  const nextRequest = {
    id: `MRQ-${Date.now()}`,
    title,
    channels: Array.isArray(payload.channels) ? payload.channels : [],
    objective: String(payload.objective || '').trim(),
    constraints: String(payload.constraints || '').trim(),
    ownerAgent: String(payload.ownerAgent || 'Manni').trim(),
    status: 'angefragt',
    createdAt: now,
  };
  requests.unshift(nextRequest);
  await writeDraftRequests(workspaceRoot, requests);
  return getManniCampaignState(workspaceRoot);
};
