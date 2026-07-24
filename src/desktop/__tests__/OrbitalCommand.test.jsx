import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DesktopApp from '../DesktopApp.jsx';
import OverviewTab from '../components/OverviewTab.jsx';
import { flightDeckApi } from '../api.js';
import { mockFlightDeckApi } from '../mockApi.js';

vi.mock('../api.js', async () => {
  const actual = await vi.importActual('../api.js');
  return { ...actual, flightDeckApi: { ...actual.flightDeckApi } };
});

const NAVIGATION = [
  'Overview', 'Flight Deck', 'Set Import', 'Batch Import', 'Audio Mastering',
  'Marketing Manager', 'Design Agent', 'Analytics', 'Data Explorer',
  'Advanced Settings', 'System Monitor', 'Tutorial', 'AI Assistant',
];

describe('Orbital Command app shell', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/desktop.html');
    localStorage.clear();
    vi.spyOn(window, 'open').mockImplementation(() => null);
    Object.keys(flightDeckApi).forEach((key) => delete flightDeckApi[key]);
    Object.assign(flightDeckApi, mockFlightDeckApi);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the versioned shell, global guard, full navigation and contextual copilot', async () => {
    const { container } = render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });

    const shell = container.querySelector('.fd-orbital-shell');
    expect(shell).toHaveAttribute('data-ui-version', 'orbital-command-v1');
    expect(container.querySelector('.fd-orbital-topbar')).toBeInTheDocument();
    expect(screen.getByText('AIRDOX / ORBITAL COMMAND')).toBeInTheDocument();

    const globalHealth = screen.getByLabelText('Globaler Systemstatus');
    for (const label of ['Workspace', 'Repository', 'Datenbank', 'Queue']) {
      expect(within(globalHealth).getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('Live blockiert')).toBeInTheDocument();
    expect(screen.getByTitle(/Speichert aktuelle Settings/i)).toBeDisabled();

    const nav = screen.getByRole('navigation', { name: 'Flight Deck tabs' });
    for (const label of NAVIGATION) {
      expect(within(nav).getByRole('button', { name: label })).toBeEnabled();
    }

    const assistant = screen.getByLabelText('Operations Assistant');
    expect(within(assistant).getByRole('heading', { name: 'Operations Assistant' })).toBeInTheDocument();
    expect(within(assistant).getByLabelText('Empfohlene Aktionen')).toBeInTheDocument();
    expect(within(assistant).getByLabelText('Aktueller Kontext')).toHaveTextContent('Overview');
    expect(within(assistant).getByText(/Blocker/)).toBeInTheDocument();
  }, 30_000);

  it('opens every navigation destination and keeps context synchronized', async () => {
    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });
    const nav = screen.getByRole('navigation', { name: 'Flight Deck tabs' });

    for (const label of NAVIGATION) {
      const button = within(nav).getByRole('button', { name: label });
      fireEvent.click(button);
      await waitFor(() => expect(button).toHaveClass('active'));
      expect(screen.getByLabelText('Aktueller Kontext')).toHaveTextContent(label);
    }
  }, 60_000);

  it('unlocks the global Go-Live action only after a real draft source is loaded', async () => {
    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });
    const liveButton = screen.getByTitle(/Speichert aktuelle Settings/i);
    expect(liveButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /^Set Import$/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Demo Import/i }));
    await screen.findByDisplayValue('recording_2026_05_01');

    await waitFor(() => expect(liveButton).toBeEnabled());
    expect(screen.getByText('Live bereit')).toBeInTheDocument();
    expect(screen.getByLabelText('Aktueller Kontext')).toHaveTextContent('recording_2026_05_01');
  }, 30_000);

  it('routes every context-rail command to its working destination', async () => {
    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });
    const assistant = screen.getByLabelText('Operations Assistant');

    fireEvent.click(within(assistant).getByRole('button', { name: /Batch prüfen/i }));
    expect(within(screen.getByRole('navigation', { name: 'Flight Deck tabs' })).getByRole('button', { name: 'Batch Import' })).toHaveClass('active');
    fireEvent.click(within(assistant).getByRole('button', { name: /Performance analysieren/i }));
    await waitFor(() => expect(screen.getByLabelText('Aktueller Kontext')).toHaveTextContent('Analytics'));
    fireEvent.click(within(assistant).getByRole('button', { name: /System prüfen/i }));
    await waitFor(() => expect(screen.getByLabelText('Aktueller Kontext')).toHaveTextContent('System Monitor'));
    fireEvent.click(within(assistant).getByRole('button', { name: /Assistant vollständig öffnen/i }));
    await screen.findByRole('heading', { name: /KI Flight-Deck Assistant/i });
    expect(screen.getByLabelText('Aktueller Kontext')).toHaveTextContent('AI Assistant');
  }, 30_000);

  it('executes the orbital header and workspace shortcut controls', async () => {
    const getStateSpy = vi.fn(mockFlightDeckApi.getState);
    Object.assign(flightDeckApi, { getState: getStateSpy });

    render(<DesktopApp />);
    await screen.findByRole('heading', { name: 'Flight Deck' });
    const nav = screen.getByRole('navigation', { name: 'Flight Deck tabs' });
    const globalActions = screen.getByLabelText('Globale Aktionen');

    const refreshButton = within(globalActions).getByRole('button', { name: /^Refresh$/i });
    await waitFor(() => expect(refreshButton).toBeEnabled());
    fireEvent.click(refreshButton);
    await waitFor(() => expect(getStateSpy).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole('button', { name: /^Import$/i }));
    expect(within(nav).getByRole('button', { name: 'Set Import' })).toHaveClass('active');

    fireEvent.click(screen.getByRole('button', { name: /^Batch$/i }));
    expect(within(nav).getByRole('button', { name: 'Batch Import' })).toHaveClass('active');

    fireEvent.click(screen.getAllByRole('button', { name: /^Assistant$/i })[0]);
    expect(within(nav).getByRole('button', { name: 'AI Assistant' })).toHaveClass('active');

    fireEvent.click(screen.getByRole('button', { name: /Interaktive Tour/i }));
    await screen.findByText(/Volltour: Alle Betriebsbereiche verstehen/i);
    fireEvent.click(screen.getByRole('button', { name: /Tutorial schliessen/i }));

    fireEvent.click(screen.getByRole('button', { name: /^Overview$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Import starten$/i }));
    expect(within(nav).getByRole('button', { name: 'Set Import' })).toHaveClass('active');
  }, 60_000);
});

describe('Orbital Operations Overview', () => {
  afterEach(cleanup);

  const snapshot = {
    counts: {
      analytics_logs_count: 14,
      users_count: 5,
      sessions_count: 3,
      bookings_count: 2,
      subscribers_count: 8,
    },
    manifestSummary: { totalSets: 2, missingStats: ['set-two'] },
    topTracks: [{ id: 'set-one', plays: 42, likes: 9, last_played_at: '2026-07-20T18:30:00.000Z' }],
    recentAnalytics: [{ id: 1, event_type: 'play', item_id: 'set-one', country: 'DE', city: 'Berlin', device_type: 'desktop', browser: 'Chrome', created_at: '2026-07-20T18:30:00.000Z' }],
  };

  it('shows all KPIs, readiness, pipeline stages, data regions and actionable blockers', () => {
    const onRefresh = vi.fn();
    const onSyncStats = vi.fn();
    const onJumpToTab = vi.fn();
    const onLoadImport = vi.fn();
    const { container } = render(
      <OverviewTab
        snapshot={snapshot}
        gitStatus={{ branch: 'main', dirty: true, summary: '2 Änderungen' }}
        onRefresh={onRefresh}
        onSyncStats={onSyncStats}
        onJumpToTab={onJumpToTab}
        onLoadImport={onLoadImport}
        busy={false}
      />,
    );

    expect(container.querySelector('.fd-orbital-overview')).toBeInTheDocument();
    for (const heading of ['Operations Overview', 'System Readiness', 'Publish Pipeline', 'Top Sets', 'Git / Runtime', 'Blocker & Hinweise', 'Recent Analytics']) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
    }
    for (const label of ['Sets im Manifest', 'Analytics Events', 'User', 'Sessions']) expect(screen.getByText(label)).toBeInTheDocument();
    const pipeline = container.querySelector('.fd-orbital-pipeline');
    for (const stage of ['Import', 'Validate', 'Manifest', 'R2 Upload', 'Build', 'Deploy', 'Live']) expect(within(pipeline).getByText(stage)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Prozent Systembereitschaft/ })).toBeInTheDocument();
    expect(screen.getByText('Manifest-Statistiken unvollständig')).toBeInTheDocument();
    expect(screen.getByText('Repository enthält Änderungen')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Quick Import/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Auswertung$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Assistant$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Refresh$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Pipeline öffnen/i }));
    fireEvent.click(screen.getByRole('button', { name: /Repository öffnen/i }));
    for (const button of screen.getAllByRole('button', { name: /^Stats Sync$/i })) fireEvent.click(button);

    expect(onLoadImport).toHaveBeenCalledTimes(1);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onSyncStats).toHaveBeenCalledTimes(2);
    expect(onJumpToTab).toHaveBeenCalledWith('analytics');
    expect(onJumpToTab).toHaveBeenCalledWith('assistant');
    expect(onJumpToTab).toHaveBeenCalledWith('import');
    expect(onJumpToTab).toHaveBeenCalledWith('flightdeck');
  });

  it('renders the empty workspace path and its configuration action', () => {
    const onJumpToTab = vi.fn();
    render(<OverviewTab snapshot={null} onJumpToTab={onJumpToTab} />);
    fireEvent.click(screen.getByRole('button', { name: 'Workspace konfigurieren' }));
    expect(onJumpToTab).toHaveBeenCalledWith('flightdeck');
  });
});
