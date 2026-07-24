import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createMarketingDraftRequest,
  getManniCampaignState,
  readManniApprovalState,
  updateManniOperationApproval,
} from '../../../desktop/main/services/manniApproval.mjs';

const proposalMarkdown = `# Manni Reach Paket
Status: draft
Owner: Manni
Goal: Mehr Gig-Anfragen
Approval: Nutzerfreigabe erforderlich

## Ausfuehrungsrahmen
Nur organisch ausspielen.

- Keine Paid Ads
- Kein Repost ohne Freigabe

## Plattform-Aktionen
| ID | Plattform | Aktion | Copy/Hook | Asset | Ziel-URL | Timing | KPI-Ziel | Budget |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OPS-IG-01 | Instagram | Reel posten | Full set ist online | reel.mp4 | https://airdox.info | 19:00 | 100 Plays | 0 EUR |
| OPS-FB-02 | Facebook | Link teilen | Berlin Booking Push | cover.jpg | https://airdox.info/book | 20:00 | 5 Leads | 0 EUR |

## Produzierte Assets
Reels:
- Datei: reel.mp4
- Hook: Full set ist online
Cover:
Ein statisches Cover liegt bereit.

## Ausfuehrungs-Checkliste
1. Copy pruefen
2. Asset pruefen

## Messfenster
- 24h: Plays und Likes pruefen
- 7d: Booking-Anfragen pruefen

## Dispatch-Ergebnis
Dispatched: 2026-05-13T10:00:00.000Z

\`\`\`powershell
npm run social:auto
\`\`\`

- Dry run erfolgreich
`;

describe('desktop Manni approval service', () => {
  let workspaceRoot;

  beforeEach(async () => {
    workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'airdox-manni-service-'));
    await fs.mkdir(path.join(workspaceRoot, 'docs', 'agent-system'), { recursive: true });
    await fs.writeFile(
      path.join(workspaceRoot, 'docs', 'agent-system', 'MANNI_PR_SOCIAL_REACH_OPS_2026-05-13.md'),
      proposalMarkdown,
      'utf8',
    );
  });

  afterEach(async () => {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  });

  it('parses campaign markdown, initializes approvals and persists decisions', async () => {
    const state = await getManniCampaignState(workspaceRoot);

    expect(state.summary).toMatchObject({
      title: 'Manni Reach Paket',
      status: 'draft',
      owner: 'Manni',
      goal: 'Mehr Gig-Anfragen',
      pendingCount: 2,
    });
    expect(state.operations).toHaveLength(2);
    expect(state.operations[0]).toMatchObject({
      id: 'OPS-IG-01',
      platform: 'Instagram',
      action: 'Reel posten',
      decision: { status: 'pending' },
    });
    expect(state.visualAssets[0].items[0]).toMatchObject({ key: 'datei', value: 'reel.mp4' });
    expect(state.proposal.measurementWindows[0]).toMatchObject({ window: '24h', detail: 'Plays und Likes pruefen' });
    expect(state.proposal.dispatchResult.command).toContain('npm run social:auto');

    const updated = await updateManniOperationApproval(workspaceRoot, {
      operationId: 'OPS-FB-02',
      status: 'approved',
      note: 'Freigegeben fuer 20 Uhr',
      decidedBy: 'FlightDeck',
    });

    const approved = updated.operations.find((entry) => entry.id === 'OPS-FB-02');
    expect(approved.decision).toMatchObject({
      status: 'approved',
      notes: 'Freigegeben fuer 20 Uhr',
      decidedBy: 'FlightDeck',
    });
    expect(updated.summary.approvedCount).toBe(1);
  });

  it('recovers invalid approval JSON, validates inputs and records draft requests', async () => {
    const approvalPath = path.join(workspaceRoot, 'docs', 'agent-system', 'manni-approval-state.json');
    await fs.writeFile(approvalPath, '{broken', 'utf8');

    const approvalState = await readManniApprovalState(workspaceRoot, ['OPS-IG-01']);
    expect(approvalState.operations['OPS-IG-01']).toMatchObject({ status: 'pending' });

    await expect(updateManniOperationApproval(workspaceRoot, { status: 'approved' }))
      .rejects.toThrow(/operationId/);
    await expect(updateManniOperationApproval(workspaceRoot, { operationId: 'OPS-IG-01', status: 'invalid' }))
      .rejects.toThrow(/Ungueltiger Status/);
    await expect(updateManniOperationApproval(workspaceRoot, { operationId: 'OPS-X', status: 'approved' }))
      .rejects.toThrow(/Unbekannte/);

    const withDraft = await createMarketingDraftRequest(workspaceRoot, {
      title: 'Booking Push Berlin',
      objective: 'Mehr Anfragen',
      constraints: 'Nur organisch',
      ownerAgent: 'Manni',
      channels: ['Instagram', 'Facebook'],
    });

    expect(withDraft.draftRequests[0]).toMatchObject({
      title: 'Booking Push Berlin',
      objective: 'Mehr Anfragen',
      constraints: 'Nur organisch',
      ownerAgent: 'Manni',
      channels: ['Instagram', 'Facebook'],
      status: 'angefragt',
    });
    await expect(createMarketingDraftRequest(workspaceRoot, { title: '' }))
      .rejects.toThrow(/Titel/);
  });

  it('reports a missing proposal document as a real error', async () => {
    await fs.rm(path.join(workspaceRoot, 'docs', 'agent-system', 'MANNI_PR_SOCIAL_REACH_OPS_2026-05-13.md'));

    await expect(getManniCampaignState(workspaceRoot)).rejects.toThrow(/nicht gefunden/);
  });
});
