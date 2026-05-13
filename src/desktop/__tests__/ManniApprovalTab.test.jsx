import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ManniApprovalTab from '../components/ManniApprovalTab.jsx';

const buildState = () => ({
  proposal: {
    metadata: {
      title: 'Manni PR Push KW 20',
      status: 'draft',
      goal: 'Instagram und Facebook organisch anschieben.',
      approval: 'Nur nach persoenlichem Go.',
    },
    executionBoundary: {
      summary: 'Kein Paid Spend.',
    },
    executionChecklist: ['Caption pruefen', 'Asset freigeben'],
    measurementWindows: [{ window: '2h', detail: 'Reach check' }],
    sourceMarkdown: '# Proposal',
  },
  summary: {
    title: 'Manni PR Push KW 20',
    status: 'draft',
    goal: 'Instagram und Facebook organisch anschieben.',
    approval: 'Nur nach persoenlichem Go.',
  },
  operations: [
    {
      id: 'OPS-IG-01',
      platform: 'Instagram',
      action: 'Reel posten',
      copyHook: 'Pressure check fuer den Peak Slot.',
      asset: 'reel-slot-1.mp4',
      targetUrl: 'https://airdox.info/music',
      timing: '18:30',
      kpiGoal: 'Profilbesuche',
      budget: '0 EUR',
      decision: { status: 'pending', notes: '' },
    },
    {
      id: 'OPS-FB-02',
      platform: 'Facebook',
      action: 'Community Post',
      copyHook: 'Full set jetzt online.',
      asset: 'community-card.png',
      targetUrl: 'https://airdox.info/epk',
      timing: '19:00',
      kpiGoal: 'Link-Klicks',
      budget: '0 EUR',
      decision: { status: 'approved', notes: 'Page ok.' },
    },
  ],
  visualAssets: [{ title: 'Assets', items: [{ label: 'Video', value: 'reel-slot-1.mp4' }] }],
  rawMarkdownPath: 'docs/agent-system/MANNI_PR_PUSH.md',
  approvalsPath: 'docs/agent-system/approvals.json',
});

describe('ManniApprovalTab', () => {
  it('renders proposal data and switches detail/preview when another operation is selected', () => {
    render(
      <ManniApprovalTab
        state={buildState()}
        busy={false}
        onRefresh={vi.fn()}
        onUpdateApproval={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Marketing Manager' })).toBeInTheDocument();
    expect(screen.getByText('Unteragentenauftrag anlegen')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Freigaben & Ausspielung/i }));

    expect(screen.getByText('Manni PR Push KW 20')).toBeInTheDocument();
    expect(screen.getAllByText('Pressure check fuer den Peak Slot.').length).toBeGreaterThan(0);
    expect(screen.getByText('Profilbesuche')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /OPS-FB-02/i }));

    expect(screen.getAllByText('Full set jetzt online.').length).toBeGreaterThan(0);
    expect(screen.getByText('Link-Klicks')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Page ok.')).toBeInTheDocument();
    expect(screen.getByText('Community Post')).toBeInTheDocument();
  }, 15000);
});
