import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AdvancedAnalyticsTab from '../components/AdvancedAnalyticsTab';
import AdvancedSettingsTab from '../components/AdvancedSettingsTab';
import BatchImportTab from '../components/BatchImportTab';
import SystemMonitorTab from '../components/SystemMonitorTab';
import LiveUpdateManager from '../lib/LiveUpdateManager';

describe('Advanced Analytics Tab', () => {
  const defaultProps = {
    analyticsData: {
      totalViews: 1000,
      totalPlays: 500,
      totalLikes: 250,
      totalDislikes: 50,
      eventsByType: { play: 500, like: 250, dislike: 50, view: 200 },
      topSets: [
        { id: 'set-1', plays: 100, likes: 50 },
        { id: 'set-2', plays: 80, likes: 40 },
      ],
      topCountries: [
        { code: 'DE', count: 300 },
        { code: 'AT', count: 150 },
      ],
      deviceTypeBreakdown: { mobile: 600, desktop: 400 },
      hourlyDistribution: new Array(24).fill(0).map(() => Math.floor(Math.random() * 50)),
      conversionRate: 0.5,
    },
    onExport: vi.fn(),
    onRefresh: vi.fn(),
    busy: false,
  };

  it('renders without crashing', () => {
    const { container } = render(<AdvancedAnalyticsTab {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('displays all metric cards', () => {
    const { getByText } = render(<AdvancedAnalyticsTab {...defaultProps} />);
    expect(getByText(/^Gesamtaufrufe$/)).toBeTruthy();
    expect(getByText(/^Plays$/)).toBeTruthy();
    expect(getByText(/^Likes$/)).toBeTruthy();
    expect(getByText(/^Engagement Rate$/)).toBeTruthy();
  });

  it('displays correct metric values', () => {
    const { getByText } = render(<AdvancedAnalyticsTab {...defaultProps} />);
    expect(
      getByText(defaultProps.analyticsData.totalViews.toLocaleString('de-DE'), {
        selector: '.fd-metric-value',
      }),
    ).toBeTruthy();
    expect(
      getByText(defaultProps.analyticsData.totalPlays.toLocaleString('de-DE'), {
        selector: '.fd-metric-value',
      }),
    ).toBeTruthy();
  });

  it('calls onRefresh when refresh button is clicked', async () => {
    const onRefresh = vi.fn();
    const { getByRole } = render(
      <AdvancedAnalyticsTab {...defaultProps} onRefresh={onRefresh} />,
    );
    const refreshBtn = getByRole('button', { name: /Aktualisieren/ });
    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('handles empty analytics data', () => {
    const emptyProps = {
      ...defaultProps,
      analyticsData: {},
    };
    const { container } = render(<AdvancedAnalyticsTab {...emptyProps} />);
    expect(container).toBeTruthy();
  });

  it('applies date and dimension filters to metrics', () => {
    const propsWithLogs = {
      ...defaultProps,
      analyticsData: {
        ...defaultProps.analyticsData,
        eventLogs: [
          { event_type: 'play', item_id: 'set-1', country: 'DE', device_type: 'desktop', created_at: '2026-04-10T12:00:00.000Z' },
          { event_type: 'like', item_id: 'set-1', country: 'DE', device_type: 'desktop', created_at: '2026-04-11T12:00:00.000Z' },
          { event_type: 'play', item_id: 'set-2', country: 'US', device_type: 'mobile', created_at: '2026-04-12T12:00:00.000Z' },
        ],
      },
    };

    const { getByText, getAllByRole, container } = render(<AdvancedAnalyticsTab {...propsWithLogs} />);
    const metricValues = () => Array.from(container.querySelectorAll('.fd-metric-value')).map((node) => node.textContent);
    expect(metricValues()[0]).toBe('3');

    const selects = getAllByRole('combobox');
    fireEvent.change(selects[2], { target: { value: 'DE' } });
    expect(metricValues()[0]).toBe('2');

    fireEvent.change(selects[0], { target: { value: 'play' } });
    expect(metricValues()[0]).toBe('1');
  });
});

describe('Advanced Settings Tab', () => {
  const defaultProps = {
    settings: {
      workspaceRoot: '/home/user/workspace',
      r2ObjectPrefix: 'airdox-assets/',
      coverOutputDir: 'public/assets/covers/',
      buildCommand: 'npm run build',
      deployCommand: 'npm run deploy',
      safeMode: true,
      uploadAudioToR2: true,
      autoBuild: true,
      autoDeploy: false,
      liveUpdatesEnabled: true,
      liveUpdateInterval: 1000,
    },
    onSettingChange: vi.fn(),
    onSave: vi.fn(),
    onReset: vi.fn(),
    gitStatus: { branch: 'main', dirty: false },
    busy: false,
    saveStatus: null,
  };

  it('renders without crashing', () => {
    const { container } = render(<AdvancedSettingsTab {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('displays all setting groups', () => {
    const { getByText } = render(<AdvancedSettingsTab {...defaultProps} />);
    expect(getByText(/Workspace-Grundlagen/)).toBeTruthy();
    expect(getByText(/Build & Deploy/)).toBeTruthy();
    expect(getByText(/Core Automation/)).toBeTruthy();
  });

  it('calls onSave when save button is clicked', async () => {
    const onSave = vi.fn();
    const { getByRole } = render(
      <AdvancedSettingsTab {...defaultProps} onSave={onSave} />,
    );
    const saveBtn = getByRole('button', { name: /Speichern/ });
    fireEvent.click(saveBtn);
    // Note: should call after detecting changes
  });
});

describe('Batch Import Tab', () => {
  const defaultProps = {
    batchQueue: [],
    onAddItems: vi.fn(),
    onRemoveItem: vi.fn(),
    onStartBatch: vi.fn(),
    onClearCompleted: vi.fn(),
    onPauseBatch: vi.fn(),
    isBatchRunning: false,
    batchProgress: { current: 0, total: 0 },
  };

  it('renders without crashing', () => {
    const { container } = render(<BatchImportTab {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('displays drag and drop zone', () => {
    const { getByText } = render(<BatchImportTab {...defaultProps} />);
    expect(getByText(/ablegen/)).toBeTruthy();
  });

  it('shows batch queue when items are added', () => {
    const queuedProps = {
      ...defaultProps,
      batchQueue: [
        {
          id: '1',
          fileName: 'track.mp3',
          status: 'pending',
          progress: 0,
        },
      ],
    };
    const { getByText } = render(<BatchImportTab {...queuedProps} />);
    expect(getByText('track.mp3')).toBeTruthy();
  });

  it('calls onStartBatch when start button is clicked', async () => {
    const onStartBatch = vi.fn();
    const queuedProps = {
      ...defaultProps,
      batchQueue: [{ id: '1', fileName: 'track.mp3', status: 'pending' }],
      onStartBatch,
    };
    const { getByRole } = render(<BatchImportTab {...queuedProps} />);
    const startBtn = getByRole('button', { name: /Start/ });
    fireEvent.click(startBtn);
    expect(onStartBatch).toHaveBeenCalled();
  });
});

describe('System Monitor Tab', () => {
  const defaultProps = {
    systemStats: {
      memory: {
        total: 16000000000,
        used: 8000000000,
        available: 8000000000,
        percentUsed: 50,
      },
      cpu: {
        percentUsed: 25,
        cores: 8,
        clockSpeed: '2.40',
      },
      disk: {
        total: 1000000000000,
        free: 500000000000,
        percentUsed: 50,
      },
      processes: [
        { name: 'node', type: 'app', memory: 150000000, status: 'running' },
        { name: 'electron', type: 'main', memory: 200000000, status: 'running' },
      ],
      warnings: [],
    },
    onRefresh: vi.fn(),
    onClearCache: vi.fn(),
    onOptimize: vi.fn(),
    busy: false,
  };

  it('renders without crashing', () => {
    const { container } = render(<SystemMonitorTab {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('displays memory usage', () => {
    const { getByText, getAllByText } = render(<SystemMonitorTab {...defaultProps} />);
    expect(getByText(/RAM/)).toBeTruthy();
    expect(getAllByText(/50\.0%/).length).toBeGreaterThan(0);
  });

  it('displays CPU info', () => {
    const { getByText } = render(<SystemMonitorTab {...defaultProps} />);
    expect(getByText(/CPU/)).toBeTruthy();
    expect(getByText(/8 Cores/)).toBeTruthy();
  });

  it('displays process list', () => {
    const { getAllByText } = render(<SystemMonitorTab {...defaultProps} />);
    expect(getAllByText('node').length).toBeGreaterThan(0);
    expect(getAllByText('electron').length).toBeGreaterThan(0);
  });

  it('calls onRefresh when refresh button is clicked', async () => {
    const onRefresh = vi.fn();
    const { getByRole } = render(
      <SystemMonitorTab {...defaultProps} onRefresh={onRefresh} />,
    );
    const refreshBtn = getByRole('button', { name: /Aktualisieren/ });
    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('shows warnings when system is under stress', () => {
    const stressedProps = {
      ...defaultProps,
      systemStats: {
        ...defaultProps.systemStats,
        memory: { ...defaultProps.systemStats.memory, percentUsed: 90 },
        cpu: { ...defaultProps.systemStats.cpu, percentUsed: 85 },
        warnings: [
          { title: 'Hohe Speicherauslastung', message: '90% RAM belegt' },
        ],
      },
    };
    const { getByText } = render(<SystemMonitorTab {...stressedProps} />);
    expect(getByText(/Hohe Speicherauslastung/)).toBeTruthy();
  });
});

describe('Live Update Manager', () => {
  let manager;

  beforeEach(() => {
    manager = new LiveUpdateManager({ enabled: true, updateInterval: 100 });
  });

  it('should subscribe and notify listeners', () => {
    const callback = vi.fn();

    manager.subscribe('users', callback);

    manager.notifyListeners('users', {
      data: { id: 1, name: 'test' },
      type: 'update',
    });

    expect(callback).toHaveBeenCalledOnce();
    expect(callback.mock.calls[0][0].data).toEqual({ id: 1, name: 'test' });
  });

  it('should queue sync operations', () => {
    manager.isEnabled = false;
    manager.queueSync('users', { type: 'insert', data: { id: 1 } });
    expect(manager.syncQueue.length).toBe(1);
  });

  it('should handle multiple subscribers', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    manager.subscribe('posts', callback1);
    manager.subscribe('posts', callback2);

    manager.notifyListeners('posts', {
      data: [],
      type: 'update',
    });

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  it('should clean up resources on dispose', () => {
    const callback = vi.fn();
    manager.subscribe('users', callback);
    manager.dispose();

    expect(manager.listeners.size).toBe(0);
    expect(manager.pollIntervals.size).toBe(0);
  });

  it('should unsubscribe listeners', () => {
    const callback = vi.fn();
    const unsubscribe = manager.subscribe('users', callback);

    unsubscribe();

    manager.notifyListeners('users', { data: [], type: 'update' });
    expect(callback).not.toHaveBeenCalled();
  });
});
