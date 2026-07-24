import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OverviewTab from '../components/OverviewTab.jsx';

const buildSnapshot = (overrides = {}) => ({
  counts: {
    track_stats_count: 3,
    analytics_logs_count: 42,
    bookings_count: 5,
    subscribers_count: 17,
    users_count: 8,
    sessions_count: 11,
    ...overrides.counts,
  },
  topTracks: overrides.topTracks ?? [
    { id: 'warehouse-signal', plays: 1200, likes: 87, last_played_at: '2026-07-20T21:14:00.000Z' },
    { id: 'basement-pressure', plays: 600, likes: 33, last_played_at: 'invalid-date' },
  ],
  recentAnalytics: overrides.recentAnalytics ?? [
    {
      id: 91,
      event_type: 'play',
      item_id: 'warehouse-signal',
      country: 'DE',
      city: 'Berlin',
      device_type: 'desktop',
      browser: 'Chrome',
      created_at: '2026-07-21T06:30:00.000Z',
    },
    {
      id: 90,
      event_type: 'like',
      item_id: 'basement-pressure',
      country: '',
      city: null,
      device_type: '',
      browser: null,
      created_at: null,
    },
  ],
  recentUsers: [],
  recentSubscribers: [],
  recentSessions: [],
  manifestSummary: {
    totalSets: 3,
    missingStats: [],
    ...overrides.manifestSummary,
  },
});

const buildProps = (overrides = {}) => ({
  snapshot: buildSnapshot(),
  gitStatus: { branch: 'codex/orbital-flightdeck', dirty: false, summary: 'clean' },
  busy: false,
  onRefresh: vi.fn(),
  onSyncStats: vi.fn(),
  onJumpToTab: vi.fn(),
  onLoadImport: vi.fn(),
  ...overrides,
});

describe('Orbital Overview', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the disconnected state and routes to the real workspace configuration', () => {
    const onJumpToTab = vi.fn();
    render(<OverviewTab snapshot={null} gitStatus={{}} onJumpToTab={onJumpToTab} />);

    expect(screen.getByRole('heading', { name: 'Workspace verbinden' })).toBeInTheDocument();
    expect(screen.getByText(/musicSets\.js/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Workspace konfigurieren' }));
    expect(onJumpToTab).toHaveBeenCalledExactlyOnceWith('flightdeck');
  });

  it('renders a fully ready mission view from real snapshot values', () => {
    const props = buildProps();
    const { container } = render(<OverviewTab {...props} />);

    expect(screen.getByRole('heading', { name: 'Operations Overview' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '100 Prozent Systembereitschaft' })).toBeInTheDocument();
    expect(screen.getByText('GO')).toBeInTheDocument();
    expect(screen.getByText('Vollständig synchron')).toBeInTheDocument();
    expect(screen.getAllByText('Arbeitsbaum sauber').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Keine erkannten Blocker')).toBeInTheDocument();

    const pipeline = container.querySelector('.fd-orbital-pipeline');
    expect(pipeline).not.toBeNull();
    ['Import', 'Validate', 'Manifest', 'R2 Upload', 'Build', 'Deploy', 'Live'].forEach((label) => {
      expect(within(pipeline).getByText(label)).toBeInTheDocument();
    });
    expect(pipeline.querySelectorAll('.fd-orbital-pipeline-step.complete')).toHaveLength(3);
    expect(pipeline.querySelectorAll('.fd-orbital-pipeline-step.pending')).toHaveLength(4);
    expect(within(pipeline).getAllByText('Nächster Lauf')).toHaveLength(4);

    expect(screen.getByText('Sets im Manifest')).toBeInTheDocument();
    expect(screen.getByText('Analytics Events')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getAllByText('warehouse-signal')).toHaveLength(2);
    expect(screen.getAllByText('basement-pressure')).toHaveLength(2);
    expect(screen.getByText('1.200')).toBeInTheDocument();
    expect(screen.getByText('DE / Berlin')).toBeInTheDocument();
    expect(screen.getAllByText('n/a').length).toBeGreaterThanOrEqual(2);
  });

  it('executes every command-bar and pipeline interaction through its supplied callback', () => {
    const props = buildProps();
    render(<OverviewTab {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Quick Import' }));
    fireEvent.click(screen.getByRole('button', { name: 'Auswertung' }));
    fireEvent.click(screen.getByRole('button', { name: 'Assistant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stats Sync' }));
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    fireEvent.click(screen.getByRole('button', { name: /Pipeline öffnen/ }));

    expect(props.onLoadImport).toHaveBeenCalledTimes(1);
    expect(props.onSyncStats).toHaveBeenCalledTimes(1);
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
    expect(props.onJumpToTab.mock.calls).toEqual([['analytics'], ['assistant'], ['import']]);
  });

  it('falls back to the import tab when no direct quick-import handler exists', () => {
    const props = buildProps({ onLoadImport: undefined });
    render(<OverviewTab {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Quick Import' }));
    expect(props.onJumpToTab).toHaveBeenCalledExactlyOnceWith('import');
  });

  it('shows real manifest and repository blockers and executes their remediation actions', () => {
    const props = buildProps({
      snapshot: buildSnapshot({ manifestSummary: { totalSets: 3, missingStats: ['set-a', 'set-b'] } }),
      gitStatus: { branch: 'codex/work-in-progress', dirty: true, summary: '2 modified files' },
    });
    const { container } = render(<OverviewTab {...props} />);

    expect(screen.getByRole('img', { name: '50 Prozent Systembereitschaft' })).toBeInTheDocument();
    expect(screen.getByText('CHECK')).toBeInTheDocument();
    expect(screen.getByText('2 IDs fehlen')).toBeInTheDocument();
    expect(screen.getByText('2 Set-IDs ohne track_stats')).toBeInTheDocument();
    expect(screen.getByText('Repository enthält Änderungen')).toBeInTheDocument();
    expect(container.querySelector('.fd-orbital-pipeline-step.warning')).not.toBeNull();
    expect(screen.getByText('2 offen')).toBeInTheDocument();

    const blockerRegion = container.querySelector('.fd-orbital-blockers');
    fireEvent.click(within(blockerRegion).getByRole('button', { name: 'Stats Sync' }));
    fireEvent.click(within(blockerRegion).getByRole('button', { name: 'Repository öffnen' }));
    expect(props.onSyncStats).toHaveBeenCalledTimes(1);
    expect(props.onJumpToTab).toHaveBeenCalledExactlyOnceWith('flightdeck');
  });

  it('uses the singular blocker copy for one missing set statistic', () => {
    render(<OverviewTab {...buildProps({ snapshot: buildSnapshot({ manifestSummary: { missingStats: ['solo-set'] } }) })} />);
    expect(screen.getByText('1 Set-ID ohne track_stats')).toBeInTheDocument();
  });

  it('renders truthful empty and zero states without inventing data', () => {
    const snapshot = buildSnapshot({
      counts: { track_stats_count: 0, analytics_logs_count: 0, bookings_count: 0, subscribers_count: 0, users_count: 0, sessions_count: 0 },
      topTracks: [],
      recentAnalytics: [],
      manifestSummary: { totalSets: 0, missingStats: [] },
    });
    const { container } = render(<OverviewTab {...buildProps({ snapshot, gitStatus: {} })} />);

    expect(screen.getByRole('img', { name: '0 Prozent Systembereitschaft' })).toBeInTheDocument();
    expect(screen.getByText('Kein Branch erkannt')).toBeInTheDocument();
    expect(screen.getByText('0 Sets geladen')).toBeInTheDocument();
    expect(screen.getByText('Noch keine Track-Statistiken vorhanden.')).toBeInTheDocument();
    expect(screen.getByText('Noch keine Analytics-Ereignisse vorhanden.')).toBeInTheDocument();
    expect(container.querySelector('.fd-orbital-pipeline-step.ready')).not.toBeNull();
    expect(container.querySelectorAll('.fd-orbital-pipeline-step.pending')).toHaveLength(6);
    expect(screen.getByText('Keine erkannten Blocker')).toBeInTheDocument();
  });

  it('handles missing snapshot collections and malformed dates safely', () => {
    const snapshot = {
      counts: {},
      topTracks: [{ id: 'broken-clock', plays: null, likes: null, last_played_at: 'not-a-date' }],
      recentAnalytics: [{ id: 'event-x', event_type: 'open', item_id: 'broken-clock', created_at: 'bad', country: null, city: null }],
      manifestSummary: { totalSets: 1 },
    };
    render(<OverviewTab {...buildProps({ snapshot, gitStatus: { summary: 'available' } })} />);

    expect(screen.getAllByText('n/a').length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('broken-clock')).toHaveLength(2);
    expect(screen.getByRole('img', { name: '100 Prozent Systembereitschaft' })).toBeInTheDocument();
  });

  it('disables every mutating command while busy but keeps navigation available', () => {
    const props = buildProps({
      busy: true,
      snapshot: buildSnapshot({ manifestSummary: { missingStats: ['blocked-set'] } }),
      gitStatus: { branch: 'main', dirty: true, summary: 'dirty' },
    });
    render(<OverviewTab {...props} />);

    expect(screen.getByRole('button', { name: 'Quick Import' })).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Stats Sync' }).every((button) => button.disabled)).toBe(true);
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Repository öffnen' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Auswertung' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Assistant' })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Pipeline öffnen/ })).toBeEnabled();
  });

  it('cleans up the live clock interval and animated counter frames on unmount', () => {
    vi.useFakeTimers();
    let nextFrame = 0;
    const callbacks = new Map();
    const requestFrame = vi.fn((callback) => {
      nextFrame += 1;
      callbacks.set(nextFrame, callback);
      return nextFrame;
    });
    const cancelFrame = vi.fn((id) => callbacks.delete(id));
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);

    const view = render(<OverviewTab {...buildProps()} />);
    expect(requestFrame).toHaveBeenCalledTimes(4);

    act(() => {
      const first = callbacks.entries().next().value;
      first[1](performance.now() + 800);
    });
    view.unmount();

    expect(cancelFrame).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
