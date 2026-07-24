import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { askAssistantMock, answerToolQuestionMock } = vi.hoisted(() => ({
  askAssistantMock: vi.fn(),
  answerToolQuestionMock: vi.fn(),
}));

vi.mock('../api.js', () => ({
  flightDeckApi: {
    askAssistant: (...args) => askAssistantMock(...args),
  },
}));

vi.mock('../lib/assistantEngine.js', () => ({
  answerToolQuestion: (...args) => answerToolQuestionMock(...args),
}));

import AdvancedAnalyticsTab from '../components/AdvancedAnalyticsTab.jsx';
import AssistantTab from '../components/AssistantTab.jsx';
import DesignStudioPhase from '../components/DesignStudioPhase.jsx';
import {
  EXTRA_SLIDERS,
  TOP_SLIDERS,
  getDefaultConfig,
} from '../components/designConstants.js';

const SETS = [
  { id: 'set-a', title: 'Warehouse Signal', vinylColor: '#43d9f6', bpm: 132 },
  { id: 'set-b', title: 'Basement Pressure', vinylColor: '#b7f52b', bpm: 129 },
];

const makeStudioConfig = (overrides = {}) => ({
  ...getDefaultConfig(SETS),
  mode: '5050',
  ...overrides,
  controls: {
    ...getDefaultConfig(SETS).controls,
    ...(overrides.controls || {}),
  },
});

const renderStudio = (overrides = {}) => {
  const props = {
    config: makeStudioConfig(),
    sets: SETS,
    onConfigChange: vi.fn(),
    onBack: vi.fn(),
    onRender: vi.fn(),
    isRendering: false,
    renderProgress: 0,
    ...overrides,
  };
  return { ...render(<DesignStudioPhase {...props} />), props };
};

const REAL_EVENTS = [
  { event_type: 'play', item_id: 'set-a', country: 'de', device_type: 'DESKTOP', created_at: '2026-06-01T10:00:00.000Z' },
  { event_type: 'play', item_id: 'set-a', country: 'DE', device_type: 'desktop', created_at: '2026-06-01T10:30:00.000Z' },
  { event_type: 'like', item_id: 'set-a', country: 'AT', device_type: 'mobile', created_at: '2026-06-01T18:00:00.000Z' },
  { event_type: 'view', item_id: 'set-b', country: 'US', device_type: 'tablet', created_at: '2026-06-01T20:00:00.000Z' },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  askAssistantMock.mockResolvedValue(null);
  answerToolQuestionMock.mockReturnValue({
    text: 'Lokale, handlungsorientierte Antwort.',
    source: 'local',
    actions: [],
  });
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  window.requestAnimationFrame = (callback) => setTimeout(callback, 0);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('DesignStudioPhase interactions and branches', () => {
  it('runs toolbar, compiler, clipboard, render, mark, mode and Photoshop actions', async () => {
    const { props } = renderStudio();

    fireEvent.click(screen.getByRole('button', { name: /Zurück/i }));
    fireEvent.click(screen.getByRole('button', { name: /Pipeline ausführen/i }));
    expect(props.onBack).toHaveBeenCalledTimes(1);
    expect(props.onRender).toHaveBeenCalledTimes(1);

    const previewSection = screen.getByRole('heading', { name: 'Live Preview' }).closest('section');
    const previewToggle = within(previewSection).getByRole('button');
    fireEvent.click(previewToggle);
    expect(previewToggle).toBeEnabled();

    const copyButton = () => screen.getByTitle('Code kopieren');
    fireEvent.click(copyButton());
    expect(window.navigator.clipboard.writeText).toHaveBeenLastCalledWith(expect.stringContaining('#target photoshop'));

    fireEvent.click(screen.getByRole('button', { name: 'Prompt Briefing' }));
    fireEvent.click(copyButton());
    expect(window.navigator.clipboard.writeText).toHaveBeenLastCalledWith(expect.stringContaining('Warehouse Signal'));

    fireEvent.click(screen.getByRole('button', { name: 'Manifest Specs' }));
    fireEvent.click(copyButton());
    expect(window.navigator.clipboard.writeText).toHaveBeenLastCalledWith(expect.stringContaining('"setId": "set-a"'));

    fireEvent.change(screen.getByPlaceholderText('AIRDOX'), { target: { value: 'AIRDOX BERLIN' } });
    fireEvent.click(screen.getByRole('button', { name: 'Block' }));
    fireEvent.click(screen.getByRole('button', { name: /Autopilot/i }));
    fireEvent.click(screen.getByRole('button', { name: /^JSX$/i }));

    expect(props.onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ markText: 'AIRDOX BERLIN' }));
    expect(props.onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ markStyle: 'block' }));
    expect(props.onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ mode: 'auto' }));
    expect(props.onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ photoshopAction: 'script_and_launch' }));
  });

  it('wires all twelve visible tuning sliders to numeric config updates', () => {
    const { props } = renderStudio();
    const sliders = [...TOP_SLIDERS, ...EXTRA_SLIDERS];

    sliders.forEach((slider, index) => {
      const nextValue = String(10 + index);
      fireEvent.change(screen.getByLabelText(slider.label), { target: { value: nextValue } });
      expect(props.onConfigChange).toHaveBeenCalledWith(expect.objectContaining({
        controls: expect.objectContaining({ [slider.key]: Number(nextValue) }),
      }));
    });

    expect(props.onConfigChange).toHaveBeenCalledTimes(sliders.length);
  });

  it('keeps at least one graffiti style and can add a second style', () => {
    const config = makeStudioConfig({ graffitiStyles: ['wildstyle'] });
    const { props } = renderStudio({ config });

    fireEvent.click(screen.getByText('Wildstyle'));
    expect(props.onConfigChange).toHaveBeenLastCalledWith(expect.objectContaining({
      graffitiStyles: ['wildstyle'],
      mode: '5050',
    }));

    fireEvent.click(screen.getByText('Throw-Up'));
    expect(props.onConfigChange).toHaveBeenLastCalledWith(expect.objectContaining({
      graffitiStyles: ['wildstyle', 'throwup'],
      mode: '5050',
    }));
  });

  it('resizes, collapses and restores the studio control pane', () => {
    const { container } = renderStudio();
    const splitter = container.querySelector('.fd-studio-splitter');
    expect(container.querySelector('.fd-studio-right-col')).toHaveStyle({ width: '480px' });

    fireEvent.mouseDown(splitter);
    fireEvent.mouseMove(window, { clientX: 600 });
    fireEvent.mouseUp(window);
    expect(container.querySelector('.fd-studio-right-col')).toHaveStyle({ width: '408px' });

    fireEvent.doubleClick(splitter);
    expect(container.querySelector('.fd-studio-right-col')).not.toBeInTheDocument();
    fireEvent.doubleClick(splitter);
    expect(container.querySelector('.fd-studio-right-col')).toHaveStyle({ width: '408px' });
  });

  it('renders progress and disables every destructive studio control while rendering', () => {
    const { container, props } = renderStudio({ isRendering: true, renderProgress: 42 });

    expect(screen.getByText('Video-Synthese läuft')).toBeInTheDocument();
    expect(screen.getAllByText('42%').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Render-Fortschritt').firstElementChild).toHaveStyle({ width: '42%' });
    expect(screen.getByRole('button', { name: /Zurück/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Render läuft \(42%\)/i })).toBeDisabled();
    expect(screen.getByLabelText('Motion Strength')).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Render läuft/i }));
    expect(props.onRender).not.toHaveBeenCalled();
    expect(container.querySelector('.fd-design-rendering')).toBeInTheDocument();
  });

  it.each([
    ['none', null, null],
    ['block', '.fd-design-text-mark.block', null],
    ['graffiti', null, '[aria-label="AIRDOX graffiti logo preview"]'],
  ])('renders the %s brand preview branch', (markStyle, textSelector, graffitiSelector) => {
    const { container } = renderStudio({ config: makeStudioConfig({ markStyle, markText: 'SIGNAL' }) });
    if (textSelector) expect(container.querySelector(textSelector)).toHaveTextContent('SIGNAL');
    if (graffitiSelector) expect(container.querySelector(graffitiSelector)).toBeInTheDocument();
    if (!textSelector && !graffitiSelector) {
      expect(container.querySelector('.fd-design-text-mark')).not.toBeInTheDocument();
      expect(container.querySelector('.fd-graffiti-preview-logo')).not.toBeInTheDocument();
    }
  });

  it('animates the daumenkino preview and exposes the laser frame', () => {
    vi.useFakeTimers();
    const { container } = renderStudio({ config: makeStudioConfig({ style: 'daumenkino', fps: 10 }) });
    expect(container.querySelector('.fd-daumenkino-character-svg')).toBeInTheDocument();
    expect(container.querySelector('.fd-daumenkino-lasers')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(100));
    expect(container.querySelector('.fd-daumenkino-lasers')).toBeInTheDocument();
  });

  it('falls back to the first available set when the selected id is missing', () => {
    renderStudio({ config: makeStudioConfig({ setId: 'missing-set' }) });
    expect(screen.getByRole('heading', { name: 'Warehouse Signal' })).toBeInTheDocument();
  });
});

describe('AssistantTab behavior and command routing', () => {
  const renderAssistant = (overrides = {}) => {
    const props = {
      appState: { workspaceValid: true, dbError: false },
      onJumpToTab: vi.fn(),
      onRefresh: vi.fn(),
      onLoadImport: vi.fn(),
      onSyncStats: vi.fn(),
      ...overrides,
    };
    return { ...render(<AssistantTab {...props} />), props };
  };

  const ask = async (question) => {
    const input = screen.getByPlaceholderText(/Frage stellen/i);
    fireEvent.change(input, { target: { value: question } });
    fireEvent.click(screen.getByRole('button', { name: 'Senden' }));
    await waitFor(() => expect(answerToolQuestionMock).toHaveBeenCalledWith(question, expect.anything()));
  };

  it('starts focused, reports live state and blocks empty submissions', () => {
    const { props } = renderAssistant({ appState: { workspaceValid: true, dbError: 'offline' } });
    const input = screen.getByPlaceholderText(/Frage stellen/i);
    expect(input).toHaveFocus();
    expect(screen.getByTitle('Workspace verbunden')).toBeInTheDocument();
    expect(screen.getByTitle('DB Fehler')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Senden' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Verlauf leeren/i })).toBeDisabled();
    expect(props.onJumpToTab).not.toHaveBeenCalled();
  });

  it('sends with Enter, renders formatted local content, copies it and clears history', async () => {
    const answer = [
      'Kurze Antwort mit `inline code`.',
      '```powershell',
      'npm run desktop:test',
      '```',
      'Zeile 3', 'Zeile 4', 'Zeile 5', 'Zeile 6', 'Zeile 7', 'Zeile 8', 'Zeile 9',
    ].join('\n');
    answerToolQuestionMock.mockReturnValue({ text: answer, source: 'local', actions: [] });
    const { container } = renderAssistant();

    const input = screen.getByPlaceholderText(/Frage stellen/i);
    fireEvent.change(input, { target: { value: '  Diagnose bitte  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await screen.findByText('1 Nachricht');
    expect(container.querySelector('.fd-assistant-code-block')).toHaveTextContent('npm run desktop:test');
    expect(screen.getByText('inline code')).toHaveClass('fd-assistant-inline-code');
    expect(screen.getByText('Mehr anzeigen')).toBeInTheDocument();
    expect(screen.getByText('1 Nachricht')).toBeInTheDocument();
    expect(askAssistantMock).toHaveBeenCalledWith({ question: 'Diagnose bitte' });

    fireEvent.click(screen.getAllByTitle('Kopieren').at(-1));
    await waitFor(() => expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(answer));

    fireEvent.click(screen.getByRole('button', { name: /Verlauf leeren/i }));
    expect(screen.queryByText('Diagnose bitte')).not.toBeInTheDocument();
    expect(screen.getByText('0 Nachrichten')).toBeInTheDocument();
  });

  it('routes every supported action callback from an assistant response', async () => {
    answerToolQuestionMock.mockReturnValue({
      text: 'Aktionen bereit.',
      source: 'action',
      actions: ['navigate:analytics', 'action:refresh', 'action:import', 'action:sync-stats', 'unknown-action'],
    });
    const { props } = renderAssistant();
    await ask('Welche Aktionen gibt es?');
    await screen.findByText('Aktionen bereit.');

    fireEvent.click(screen.getByRole('button', { name: /Analytics öffnen/i }));
    fireEvent.click(screen.getByRole('button', { name: /Status aktualisieren/i }));
    fireEvent.click(screen.getByRole('button', { name: /Import starten/i }));
    fireEvent.click(screen.getByRole('button', { name: /Stats synchronisieren/i }));

    expect(props.onJumpToTab).toHaveBeenCalledWith('analytics');
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
    expect(props.onLoadImport).toHaveBeenCalledTimes(1);
    expect(props.onSyncStats).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('unknown-action')).not.toBeInTheDocument();
  });

  it('uses Ollama and Wiki backend answers ahead of local answers', async () => {
    answerToolQuestionMock.mockReturnValue({ text: 'Lokale Antwort', source: 'knowledge', actions: [] });
    askAssistantMock.mockResolvedValue({ answer: { text: 'Backend-Wissen aus Ollama' }, source: 'ollama:llama3' });
    renderAssistant();
    await ask('Backend Frage');

    expect(await screen.findByText('Backend-Wissen aus Ollama')).toBeInTheDocument();
    expect(screen.getByText('KI')).toBeInTheDocument();
    expect(screen.queryByText('Lokale Antwort')).not.toBeInTheDocument();
  });

  it('uses a generic backend only for a local fallback and keeps local text on backend errors', async () => {
    answerToolQuestionMock.mockReturnValue({ text: 'Fallback lokal', source: 'fallback', actions: [] });
    askAssistantMock.mockResolvedValueOnce({ answer: { answer: 'Backend Fallback-Antwort' }, source: 'backend' });
    const first = renderAssistant();
    await ask('Unbekannte Frage');
    expect(await screen.findByText('Backend Fallback-Antwort')).toBeInTheDocument();
    first.unmount();

    answerToolQuestionMock.mockReturnValue('Lokaler String bleibt sichtbar');
    askAssistantMock.mockRejectedValueOnce(new Error('assistant offline'));
    renderAssistant();
    await ask('Offline Frage');
    expect(await screen.findByText('Lokaler String bleibt sichtbar')).toBeInTheDocument();
    expect(screen.getByText('Lokal')).toBeInTheDocument();
  });

  it('renders guide screenshots, quick steps and expandable details for matched knowledge', async () => {
    answerToolQuestionMock.mockReturnValue({
      text: 'Analytics kurz erklärt.\nSchnellweg:\n1) Zeitraum setzen',
      source: 'knowledge',
      actions: ['navigate:analytics'],
      matchId: 'analytics',
      matchTitle: 'Analytics und Filter',
    });
    renderAssistant();
    await ask('Wie funktionieren Analytics?');

    expect(await screen.findByLabelText('Passende Software-Bilder')).toBeInTheDocument();
    expect(screen.getByAltText(/AIRDOX Analytics/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Schnellweg')).toBeInTheDocument();
    expect(screen.getByText('Detaillierten Weg anzeigen')).toBeInTheDocument();
    expect(screen.getByText('Textantwort anzeigen')).toBeInTheDocument();
  });

  it('auto-executes a single explicit navigation command from a prompt chip', async () => {
    answerToolQuestionMock.mockReturnValue({
      text: 'Import wird geöffnet.',
      source: 'action',
      actions: ['navigate:import'],
    });
    const { props } = renderAssistant();
    fireEvent.click(screen.getByRole('button', { name: 'Öffne den Set Import' }));

    await screen.findByText('Import wird geöffnet.');
    await waitFor(() => expect(props.onJumpToTab).toHaveBeenCalledWith('import'), { timeout: 1500 });
  });

  it('ignores Shift+Enter and prevents duplicate sends while a request is pending', async () => {
    let resolveBackend;
    askAssistantMock.mockImplementation(() => new Promise((resolve) => { resolveBackend = resolve; }));
    renderAssistant();
    const input = screen.getByPlaceholderText(/Frage stellen/i);

    fireEvent.change(input, { target: { value: 'Noch nicht senden' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(answerToolQuestionMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Senden' }));
    expect(screen.getByRole('button', { name: 'Senden' })).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Wie stelle ich ein Set online?' })[0]).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Senden' }));
    expect(answerToolQuestionMock).toHaveBeenCalledTimes(1);

    await act(async () => resolveBackend(null));
    expect(await screen.findByText('Lokale, handlungsorientierte Antwort.')).toBeInTheDocument();
  });
});

describe('AdvancedAnalyticsTab real-data and filter behavior', () => {
  const renderAnalytics = (overrides = {}) => {
    const props = {
      analyticsData: {
        realData: true,
        source: 'database',
        sourceLabel: 'Neon PostgreSQL',
        eventLogs: REAL_EVENTS,
      },
      onExport: vi.fn(),
      onRefresh: vi.fn(),
      busy: false,
      ...overrides,
    };
    return { ...render(<AdvancedAnalyticsTab {...props} />), props };
  };

  it('derives metrics, charts, geo, devices, event types and peak hour from real events', () => {
    const { container } = renderAnalytics();
    const values = [...container.querySelectorAll('.fd-metric-value')].map((node) => node.textContent);

    expect(values).toEqual(['4', '2', '1', '50.0%']);
    expect(screen.getByText(/Echte Datenquelle aktiv/i)).toBeInTheDocument();
    expect(screen.getByText(/Neon PostgreSQL \/ 4 Roh-Events/i)).toBeInTheDocument();
    expect(screen.getByText('set-a')).toBeInTheDocument();
    expect(screen.getAllByText('DE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('tablet').length).toBeGreaterThan(1);
    expect(screen.getByText('Peak: 12:00 Uhr')).toBeInTheDocument();
    expect(screen.getAllByText('view').length).toBeGreaterThan(0);
  });

  it('applies manual dates and every dimension only when Filter anwenden is clicked', () => {
    const { props } = renderAnalytics();
    fireEvent.change(screen.getByLabelText(/Von:/i), { target: { value: '2026-05-01' } });
    fireEvent.change(screen.getByLabelText(/Bis:/i), { target: { value: '2026-06-30' } });
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'play' } });
    fireEvent.change(selects[1], { target: { value: 'mobile' } });
    fireEvent.change(selects[2], { target: { value: 'DE' } });
    expect(props.onRefresh).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: /Filter anwenden/i }).at(-1));
    expect(props.onRefresh).toHaveBeenCalledWith({
      startDate: '2026-05-01',
      endDate: '2026-06-30',
      filters: { eventType: 'play', deviceType: 'mobile', country: 'DE' },
    });
  });

  it.each([
    ['7 Tage', false],
    ['30 Tage', false],
    ['90 Tage', false],
    ['Alles', true],
  ])('applies the %s date preset and sends it through the toolbar', (label, isAll) => {
    const { props } = renderAnalytics();
    fireEvent.click(screen.getByRole('button', { name: label }));
    fireEvent.click(screen.getAllByRole('button', { name: /Filter anwenden/i })[0]);

    const payload = props.onRefresh.mock.calls.at(-1)[0];
    expect(payload.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    if (isAll) expect(payload.startDate).toBe('2000-01-01');
    else expect(payload.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('exports the analytics report and shows the explicit DB-cache reason', () => {
    const { props } = renderAnalytics({
      analyticsData: {
        realData: true,
        source: 'database-cache',
        sourceLabel: 'Letzter DB-Stand',
        cached: true,
        cacheReason: 'Neon zeitweise nicht erreichbar.',
        eventLogs: REAL_EVENTS,
      },
    });
    expect(screen.getByText('DB CACHE')).toBeInTheDocument();
    expect(screen.getByText(/Cache-Grund: Neon zeitweise nicht erreichbar/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Bericht/i }));
    expect(props.onExport).toHaveBeenCalledWith('analytics-report');
  });

  it.each([
    [{ realData: false, source: 'database', eventLogs: REAL_EVENTS }, 'NO MOCK DATA'],
    [{ realData: true, source: 'mock-api', eventLogs: REAL_EVENTS }, 'NO MOCK DATA'],
    [{ realData: true, source: 'browser-no-real-data', eventLogs: REAL_EVENTS }, 'NO MOCK DATA'],
    [{ realData: true, source: 'database', eventLogs: [] }, 'NO MOCK DATA'],
  ])('never presents non-real input as analytics results', (analyticsData, badge) => {
    const { container } = renderAnalytics({ analyticsData });
    const values = [...container.querySelectorAll('.fd-metric-value')].map((node) => node.textContent);
    expect(values).toEqual(['0', '0', '0', '0.0%']);
    expect(screen.getByText(badge)).toBeInTheDocument();
    expect(screen.getByText(/Keine echten Play-Events geladen/i)).toBeInTheDocument();
    expect(screen.getByText(/Keine echten Geo-Events geladen/i)).toBeInTheDocument();
    expect(screen.getByText(/Keine echten Device-Events geladen/i)).toBeInTheDocument();
    expect(screen.getByText('Peak: n/a')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Infinity|NaN|-1:00/);
  });

  it('provides safe fallback filter options without raw events', () => {
    renderAnalytics({ analyticsData: {} });
    const selects = screen.getAllByRole('combobox');
    expect(within(selects[1]).getByRole('option', { name: 'mobile' })).toBeInTheDocument();
    expect(within(selects[2]).getByRole('option', { name: 'DE' })).toBeInTheDocument();
  });

  it('disables both apply controls and export while an operation is busy', () => {
    const { props } = renderAnalytics({ busy: true });
    screen.getAllByRole('button', { name: /Filter anwenden/i }).forEach((button) => expect(button).toBeDisabled());
    expect(screen.getByRole('button', { name: /Bericht/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Bericht/i }));
    expect(props.onExport).not.toHaveBeenCalled();
  });
});
