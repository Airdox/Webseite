import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TutorialTab from '../components/TutorialTab.jsx';
import GuidedTutorialOverlay from '../components/GuidedTutorialOverlay.jsx';
import DesignSetupPhase from '../components/DesignSetupPhase.jsx';
import DesignExportPhase from '../components/DesignExportPhase.jsx';
import {
  BACKGROUND_STILL_OPTIONS, CREATIVE_PRESETS, FORMAT_OPTIONS, getDefaultConfig,
} from '../components/designConstants.js';
import {
  TUTORIAL_CHECKLIST, TUTORIAL_SECTIONS, TUTORIAL_WORKFLOWS,
} from '../lib/tutorialContent.js';

const sets = [
  { id: 'set-alpha', title: 'Alpha Pressure', bpm: 132 },
  { id: 'set-beta', title: 'Beta Signal' },
];

const buildConfig = (overrides = {}) => ({
  ...getDefaultConfig(sets),
  setId: 'set-alpha',
  mode: '5050',
  ...overrides,
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete window.flightDeckApi;
});

describe('TutorialTab behavior', () => {
  it('renders documentation, reflects checklist state, and executes every visible action', () => {
    const onJumpToTab = vi.fn();
    const onStartTour = vi.fn();
    const checklistState = Object.fromEntries(TUTORIAL_CHECKLIST.map((item, index) => [item.id, index % 2 === 0]));
    const { container } = render(<TutorialTab checklistState={checklistState} onJumpToTab={onJumpToTab} onStartTour={onStartTour} />);

    expect(screen.getByRole('heading', { name: 'Flight Deck Arbeitsanleitung' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Schnellstart-Checkliste' })).toBeInTheDocument();
    expect(container.querySelectorAll('.fd-checklist-item.done')).toHaveLength(Math.ceil(TUTORIAL_CHECKLIST.length / 2));
    expect(screen.getAllByText('Bereits besucht oder in einer Tour erledigt.')).toHaveLength(Math.ceil(TUTORIAL_CHECKLIST.length / 2));
    expect(screen.getAllByText('Noch offen.')).toHaveLength(Math.floor(TUTORIAL_CHECKLIST.length / 2));

    fireEvent.click(screen.getByRole('button', { name: 'Volltour starten' }));
    fireEvent.click(screen.getByRole('button', { name: 'Szenario 2 oeffnen' }));
    screen.getAllByRole('button', { name: 'Tour starten' }).forEach((button) => fireEvent.click(button));
    expect(onStartTour.mock.calls.slice(0, 2)).toEqual([[{ tourId: 'full' }], [{ tourId: 'databaseAudit' }]]);
    expect(onStartTour.mock.calls.slice(2)).toEqual(TUTORIAL_WORKFLOWS.map((workflow) => [{ tourId: workflow.id }]));

    screen.getAllByRole('button', { name: 'Oeffnen' }).forEach((button) => fireEvent.click(button));
    screen.getAllByRole('button', { name: 'Tab oeffnen' }).forEach((button) => fireEvent.click(button));
    expect(onJumpToTab.mock.calls).toEqual([
      ...TUTORIAL_CHECKLIST.map((item) => [item.tabId]),
      ...TUTORIAL_SECTIONS.map((section) => [section.tabId]),
    ]);

    screen.getAllByRole('button', { name: 'Gefuehrte Schritte' }).forEach((button) => fireEvent.click(button));
    expect(onStartTour.mock.calls.slice(-TUTORIAL_SECTIONS.length)).toEqual(
      TUTORIAL_SECTIONS.map((section) => [{ tourId: 'full', tabId: section.tabId }]),
    );
    expect(screen.getAllByText('Schritt-fuer-Schritt')).toHaveLength(TUTORIAL_SECTIONS.length);
    expect(screen.getAllByText('Typische Fehler')).toHaveLength(TUTORIAL_SECTIONS.length);
  });

  it('keeps its default no-op callback contract usable', () => {
    render(<TutorialTab />);
    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Volltour starten' }));
      fireEvent.click(screen.getAllByRole('button', { name: 'Oeffnen' })[0]);
    }).not.toThrow();
  });
});

describe('GuidedTutorialOverlay behavior', () => {
  const richStep = {
    title: 'Overview kontrollieren',
    tabId: 'overview',
    description: 'Prüfe den operativen Zustand.',
    actions: ['Workspace lesen', 'Stats prüfen'],
    expectedResults: ['Workspace ist verbunden.'],
    warning: 'Nicht im falschen Branch arbeiten.',
  };

  it('stays closed unless both open state and a step are supplied', () => {
    const { rerender } = render(<GuidedTutorialOverlay isOpen={false} step={richStep} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<GuidedTutorialOverlay isOpen step={null} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a section-backed step and executes close, checklist, tab and navigation controls', () => {
    const onClose = vi.fn();
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const onJumpToTab = vi.fn();
    const { container } = render(
      <GuidedTutorialOverlay
        isOpen
        tour={{ title: 'Operations Tour', estimatedTime: '4 Min', intent: 'Kontrolle' }}
        step={richStep}
        stepIndex={1}
        totalSteps={4}
        checklistState={{ overview: true, analytics: false }}
        onClose={onClose}
        onPrevious={onPrevious}
        onNext={onNext}
        onJumpToTab={onJumpToTab}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Interaktive Flight Deck Tour' })).toBeInTheDocument();
    expect(screen.getByText('Schritt 2 / 4')).toBeInTheDocument();
    expect(container.querySelector('.fd-progress-fill-large')).toHaveStyle({ width: '50%' });
    expect(screen.getByText('Was du jetzt konkret tun solltest')).toBeInTheDocument();
    expect(screen.getByText('Nicht im falschen Branch arbeiten.')).toBeInTheDocument();
    expect(screen.getByText('Wichtige Elemente in diesem Tab')).toBeInTheDocument();
    expect(screen.getByText('Vertiefung fuer diesen Tab')).toBeInTheDocument();
    expect(container.querySelector('.fd-mini-check.done')).not.toBeNull();

    fireEvent.click(container.querySelector('.fd-tutorial-backdrop'));
    fireEvent.click(screen.getByRole('button', { name: 'Tutorial schliessen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zurueck' }));
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Diesen Tab oeffnen' }));
    const checklistButtons = container.querySelectorAll('.fd-mini-check');
    checklistButtons.forEach((button) => fireEvent.click(button));

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onJumpToTab.mock.calls).toEqual([
      ['overview'],
      ...TUTORIAL_CHECKLIST.map((item) => [item.tabId]),
    ]);
  });

  it('covers first-step navigation and all content fallbacks for an unknown tab', () => {
    const onNext = vi.fn();
    const { container } = render(
      <GuidedTutorialOverlay
        isOpen
        step={{ title: 'Freier Schritt', description: 'Ohne bekannte Sektion.', actions: [], expectedResults: [], tabId: '' }}
        stepIndex={0}
        totalSteps={1}
        onNext={onNext}
      />,
    );

    expect(screen.getByText('Gefuehrte Tour')).toBeInTheDocument();
    expect(screen.getByText('Schrittweise')).toBeInTheDocument();
    expect(screen.getByText('Schritt 1 / 1')).toBeInTheDocument();
    expect(container.querySelector('.fd-progress-fill-large')).toHaveStyle({ width: '100%' });
    expect(screen.getByText('Tour')).toBeInTheDocument();
    expect(screen.queryByText('Was du jetzt konkret tun solltest')).not.toBeInTheDocument();
    expect(screen.queryByText('Achte auf Folgendes')).not.toBeInTheDocument();
    expect(screen.queryByText('Wichtige Elemente in diesem Tab')).not.toBeInTheDocument();
    expect(screen.queryByText('Vertiefung fuer diesen Tab')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Diesen Tab oeffnen' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zurueck' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('falls back to section success checks when the step has no expected-result collection', () => {
    render(<GuidedTutorialOverlay isOpen step={{ title: 'Analytics', tabId: 'analytics', description: 'Lesen' }} totalSteps={0} />);
    const successHeading = screen.getByRole('heading', { name: 'Woran du Erfolg erkennst' });
    expect(successHeading.closest('article').querySelectorAll('li').length).toBeGreaterThan(0);
  });
});

describe('DesignSetupPhase behavior', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('changes set, every format and every preset and opens both next destinations', () => {
    const onConfigChange = vi.fn();
    const onNext = vi.fn();
    const onOpenStudio = vi.fn();
    const config = buildConfig();
    render(<DesignSetupPhase config={config} sets={sets} onConfigChange={onConfigChange} onNext={onNext} onOpenStudio={onOpenStudio} />);

    expect(screen.getByText('Alpha Pressure')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Musik-Set' }), { target: { value: 'set-beta' } });
    FORMAT_OPTIONS.forEach((format) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${format.label}`) })));
    CREATIVE_PRESETS.forEach((preset) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${preset.label}`) })));
    fireEvent.click(screen.getByRole('button', { name: 'Studio öffnen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zum Studio' }));

    expect(onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ setId: 'set-beta' }));
    FORMAT_OPTIONS.forEach((format) => expect(onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ format: format.id })));
    CREATIVE_PRESETS.forEach((preset) => expect(onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ presetId: preset.id, style: preset.style, controls: preset.controls })));
    expect(onOpenStudio).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('remixes deterministically through the next real preset, format and non-custom background', () => {
    const onConfigChange = vi.fn();
    const config = buildConfig({ presetId: 'signal_system', format: 'square', bgSource: 'cover', seed: 100 });
    render(<DesignSetupPhase config={config} sets={sets} onConfigChange={onConfigChange} onNext={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remix' }));

    expect(onConfigChange).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      presetId: 'club_still_parallax',
      style: 'liquid',
      format: 'reel',
      bgSource: 'vinyl',
      customBgPath: '',
      seed: 237,
    }));
    expect(onConfigChange.mock.calls[0][0].controls).toEqual(CREATIVE_PRESETS[1].controls);
  });

  it('uses first options as remix anchors when current values are unknown and wraps last values', () => {
    const unknownChange = vi.fn();
    const { unmount } = render(<DesignSetupPhase config={buildConfig({ presetId: 'unknown', format: 'unknown', bgSource: 'unknown' })} sets={sets} onConfigChange={unknownChange} onNext={vi.fn()} />);
    expect(screen.getAllByText('Signal System')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Remix' }));
    expect(unknownChange).toHaveBeenCalledWith(expect.objectContaining({ presetId: 'club_still_parallax', format: 'reel', bgSource: 'vinyl' }));
    unmount();

    const wrappedChange = vi.fn();
    const remixBackgrounds = BACKGROUND_STILL_OPTIONS.filter((option) => option.id !== 'custom');
    render(<DesignSetupPhase config={buildConfig({ presetId: CREATIVE_PRESETS.at(-1).id, format: FORMAT_OPTIONS.at(-1).id, bgSource: remixBackgrounds.at(-1).id })} sets={sets} onConfigChange={wrappedChange} onNext={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remix' }));
    expect(wrappedChange).toHaveBeenCalledWith(expect.objectContaining({ presetId: CREATIVE_PRESETS[0].id, format: FORMAT_OPTIONS[0].id, bgSource: remixBackgrounds[0].id }));
  });

  it('selects a custom background through the window API and ignores an empty selection', async () => {
    const onConfigChange = vi.fn();
    window.flightDeckApi = { pickImportFiles: vi.fn().mockResolvedValue(['D:\\shots\\club.jpg']) };
    const { rerender } = render(<DesignSetupPhase config={buildConfig()} sets={sets} onConfigChange={onConfigChange} onNext={vi.fn()} />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /^Eigenes Bild/ })));
    expect(window.flightDeckApi.pickImportFiles).toHaveBeenCalledTimes(1);
    expect(onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ bgSource: 'custom', customBgPath: 'D:\\shots\\club.jpg' }));

    onConfigChange.mockClear();
    window.flightDeckApi.pickImportFiles.mockResolvedValue([]);
    rerender(<DesignSetupPhase config={buildConfig()} sets={sets} onConfigChange={onConfigChange} onNext={vi.fn()} />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /^Eigenes Bild/ })));
    expect(onConfigChange).not.toHaveBeenCalled();
  });

  it('uses the supplied API when no window bridge exists', async () => {
    const onConfigChange = vi.fn();
    const flightDeckApi = { pickImportFiles: vi.fn().mockResolvedValue(['D:\\media\\fallback.png']) };
    render(<DesignSetupPhase config={buildConfig()} sets={sets} onConfigChange={onConfigChange} onNext={vi.fn()} flightDeckApi={flightDeckApi} />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /^Eigenes Bild/ })));
    expect(flightDeckApi.pickImportFiles).toHaveBeenCalledTimes(1);
    expect(onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ customBgPath: 'D:\\media\\fallback.png' }));
  });

  it('uses prompt fallback for a custom path and safely handles cancellation', async () => {
    const onConfigChange = vi.fn();
    const prompt = vi.spyOn(window, 'prompt').mockReturnValueOnce('D:\\assets\\manual.jpg').mockReturnValueOnce('');
    render(<DesignSetupPhase config={buildConfig()} sets={sets} onConfigChange={onConfigChange} onNext={vi.fn()} />);

    await act(async () => fireEvent.click(screen.getByRole('button', { name: /^Eigenes Bild/ })));
    expect(prompt).toHaveBeenCalledWith('Absoluten Bildpfad eingeben:', 'D:\\assets\\back.jpg');
    expect(onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ customBgPath: 'D:\\assets\\manual.jpg' }));
    onConfigChange.mockClear();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /^Eigenes Bild/ })));
    expect(onConfigChange).not.toHaveBeenCalled();
  });

  it('renders custom filename and fallback selections, applies normal backgrounds, and guards next without a set', () => {
    const onConfigChange = vi.fn();
    const { rerender } = render(<DesignSetupPhase config={buildConfig({ bgSource: 'custom', customBgPath: 'D:\\art\\hero.png' })} sets={sets} onConfigChange={onConfigChange} onNext={vi.fn()} />);
    expect(screen.getAllByText('hero.png').length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByRole('button', { name: /^Vinyl Still/ }));
    expect(onConfigChange).toHaveBeenCalledWith(expect.objectContaining({ bgSource: 'vinyl' }));

    rerender(<DesignSetupPhase config={buildConfig({ setId: '', bgSource: 'unlisted', presetId: 'unlisted', format: 'unlisted' })} sets={[]} onConfigChange={onConfigChange} onNext={vi.fn()} />);
    expect(screen.getByText('unlisted')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zum Studio' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Studio öffnen' })).not.toBeInTheDocument();
  });
});

describe('DesignExportPhase behavior', () => {
  const logs = [
    { timestamp: '10:01:00', type: 'success', message: 'GIF kompiliert' },
    { timestamp: '10:02:00', message: 'Manifest geschrieben' },
  ];

  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
  });

  it('renders a completed 5050 transfer pack and executes every reveal and toolbar action', () => {
    const onBackToStudio = vi.fn();
    const onNewVariant = vi.fn();
    const onReveal = vi.fn();
    const config = buildConfig({ format: 'reel', fps: 24, seed: 999, style: 'neon', mode: '5050' });
    const { container } = render(
      <DesignExportPhase
        config={config}
        sets={sets}
        renderResult={{ setTitle: 'Rendered Alpha', score: 94, photoshopAction: 'script_and_launch' }}
        previewGif="file:///render.gif"
        logs={logs}
        onBackToStudio={onBackToStudio}
        onNewVariant={onNewVariant}
        onReveal={onReveal}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Render Erfolgreich!' })).toBeInTheDocument();
    expect(screen.getByAltText('AIRDOX Gerendertes Design')).toHaveAttribute('src', 'file:///render.gif');
    expect(screen.getByText(/Rendered Alpha - Neon Depth Scan/)).toBeInTheDocument();
    expect(screen.getByText('94')).toBeInTheDocument();
    expect(screen.getByText('REEL')).toBeInTheDocument();
    expect(screen.getByText('24 FPS')).toBeInTheDocument();
    expect(screen.getByText('Photoshop JSX Script')).toBeInTheDocument();
    expect(screen.getByText('Photoshop Hero Frame')).toBeInTheDocument();
    expect(screen.getByText('GIF kompiliert')).toBeInTheDocument();
    expect(container.querySelector('.fd-design-log p.info')).not.toBeNull();
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    fireEvent.click(screen.getByRole('button', { name: 'Nochmal anpassen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Neue Variante' }));
    fireEvent.click(screen.getByTitle('Ordner öffnen'));
    fireEvent.click(screen.getByRole('button', { name: 'MP4' }));
    fireEvent.click(screen.getByRole('button', { name: 'GIF' }));
    fireEvent.click(within(screen.getByText('Set-Manifest (JSON)').closest('.fd-file-item')).getByRole('button'));
    fireEvent.click(within(screen.getByText('Handoff-Bericht (MD)').closest('.fd-file-item')).getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: 'JSX Script' }));
    fireEvent.click(within(screen.getByText('Photoshop Hero Frame').closest('.fd-file-item')).getByRole('button'));

    expect(onBackToStudio).toHaveBeenCalledTimes(1);
    expect(onNewVariant).toHaveBeenCalledTimes(1);
    expect(onReveal.mock.calls).toEqual([['folder'], ['mp4'], ['gif'], ['manifest'], ['handoff'], ['script'], ['photoshop']]);
  });

  it('collapses and expands logs, renders empty logs, and auto-scrolls after updates', () => {
    const props = {
      config: buildConfig(), sets, renderResult: null, previewGif: '', logs: [],
      onBackToStudio: vi.fn(), onNewVariant: vi.fn(), onReveal: vi.fn(),
    };
    const { rerender } = render(<DesignExportPhase {...props} />);
    const toggle = screen.getByRole('button', { name: 'Render Logs & Pipeline-Signale' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Keine Log-Einträge vorhanden.')).toBeInTheDocument();
    expect(screen.getByText('Render erfolgreich abgeschlossen')).toBeInTheDocument();
    expect(screen.getByText('88')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Keine Log-Einträge vorhanden.')).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    HTMLElement.prototype.scrollIntoView.mockClear();
    rerender(<DesignExportPhase {...props} logs={[{ timestamp: 'now', type: 'error', message: 'Signal' }]} />);
    expect(screen.getByText('Signal')).toBeInTheDocument();
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('hides Photoshop files outside 5050 mode and when script output is prompt-only', () => {
    const baseProps = { sets, previewGif: '', logs: [], onBackToStudio: vi.fn(), onNewVariant: vi.fn(), onReveal: vi.fn() };
    const { rerender } = render(<DesignExportPhase {...baseProps} config={buildConfig({ mode: 'standard' })} renderResult={{}} />);
    expect(screen.queryByText('Photoshop JSX Script')).not.toBeInTheDocument();
    expect(screen.queryByText('Photoshop Hero Frame')).not.toBeInTheDocument();

    rerender(<DesignExportPhase {...baseProps} config={buildConfig({ mode: '5050' })} renderResult={{ photoshopAction: 'prompt_only' }} />);
    expect(screen.queryByText('Photoshop JSX Script')).not.toBeInTheDocument();
    expect(screen.getByText('Photoshop Hero Frame')).toBeInTheDocument();
  });

  it('falls back to the first set and tolerates a missing scrollIntoView implementation', () => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: undefined });
    expect(() => render(
      <DesignExportPhase
        config={buildConfig({ setId: 'missing', style: 'custom-style' })}
        sets={sets}
        renderResult={{}}
        previewGif=""
        logs={[{ timestamp: 'x', message: 'Fallback log' }]}
        onBackToStudio={vi.fn()}
        onNewVariant={vi.fn()}
        onReveal={vi.fn()}
      />,
    )).not.toThrow();
    expect(screen.getByText(/Alpha Pressure - custom-style/)).toBeInTheDocument();
  });
});
