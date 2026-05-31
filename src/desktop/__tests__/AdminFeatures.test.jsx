import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AdvancedAnalyticsTab from '../components/AdvancedAnalyticsTab';
import AdvancedSettingsTab from '../components/AdvancedSettingsTab';
import BatchImportTab from '../components/BatchImportTab';
import SystemMonitorTab from '../components/SystemMonitorTab';
import LiveUpdateManager from '../lib/LiveUpdateManager';

describe('Advanced Analytics Tab', () => {
  const defaultProps = {
    analyticsData: {
      realData: true,
      source: 'database',
      eventLogs: [
        { event_type: 'play', item_id: 'set-1', country: 'DE', device_type: 'desktop', created_at: '2026-05-01T10:00:00.000Z' },
        { event_type: 'play', item_id: 'set-2', country: 'AT', device_type: 'mobile', created_at: '2026-05-01T11:00:00.000Z' },
        { event_type: 'like', item_id: 'set-1', country: 'DE', device_type: 'desktop', created_at: '2026-05-01T12:00:00.000Z' },
      ],
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
    const { container } = render(<AdvancedAnalyticsTab {...defaultProps} />);
    const metricValues = Array.from(container.querySelectorAll('.fd-metric-value')).map((node) => node.textContent);
    expect(metricValues).toContain('3');
    expect(metricValues).toContain('2');
  });

  it('calls onRefresh when filter button is clicked', async () => {
    const onRefresh = vi.fn();
    const { getAllByRole } = render(
      <AdvancedAnalyticsTab {...defaultProps} onRefresh={onRefresh} />,
    );
    const refreshBtn = getAllByRole('button', { name: /Filter anwenden/ })[0];
    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('handles empty analytics data', () => {
    const emptyProps = {
      ...defaultProps,
      analyticsData: {},
    };
    const { container, getByText } = render(<AdvancedAnalyticsTab {...emptyProps} />);
    expect(container).toBeTruthy();
    expect(getByText('Peak: n/a')).toBeTruthy();
    expect(container.textContent).not.toContain('Infinity');
    expect(container.textContent).not.toContain('-1:00');
  });

  it('sends date and dimension filters to the data source only after apply', () => {
    const today = new Date();
    const recentDate = (daysAgo) => {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString();
    };

    const propsWithLogs = {
      ...defaultProps,
      analyticsData: {
        ...defaultProps.analyticsData,
        eventLogs: [
          { event_type: 'play', item_id: 'set-1', country: 'DE', device_type: 'desktop', created_at: recentDate(3) },
          { event_type: 'like', item_id: 'set-1', country: 'DE', device_type: 'desktop', created_at: recentDate(2) },
          { event_type: 'play', item_id: 'set-2', country: 'US', device_type: 'mobile', created_at: recentDate(1) },
        ],
      },
    };

    const onRefresh = vi.fn();
    const { getAllByRole, container } = render(<AdvancedAnalyticsTab {...propsWithLogs} onRefresh={onRefresh} />);
    const metricValues = () => Array.from(container.querySelectorAll('.fd-metric-value')).map((node) => node.textContent);
    expect(metricValues()[0]).toBe('3');

    const selects = getAllByRole('combobox');
    fireEvent.change(selects[2], { target: { value: 'DE' } });
    fireEvent.click(getAllByRole('button', { name: /Filter anwenden/i })[0]);
    expect(metricValues()[0]).toBe('3');
    expect(onRefresh).toHaveBeenLastCalledWith(expect.objectContaining({
      filters: expect.objectContaining({ country: 'DE' }),
    }));

    fireEvent.change(selects[0], { target: { value: 'play' } });
    fireEvent.click(getAllByRole('button', { name: /Filter anwenden/i })[0]);
    expect(metricValues()[0]).toBe('3');
    expect(onRefresh).toHaveBeenLastCalledWith(expect.objectContaining({
      filters: expect.objectContaining({ country: 'DE', eventType: 'play' }),
    }));
  });

  it('applies date presets and exports the analytics report action', () => {
    const onRefresh = vi.fn();
    const onExport = vi.fn();
    const { getByRole, getAllByRole } = render(
      <AdvancedAnalyticsTab {...defaultProps} onRefresh={onRefresh} onExport={onExport} />,
    );

    fireEvent.click(getByRole('button', { name: /^Alles$/i }));
    fireEvent.change(getAllByRole('combobox')[1], { target: { value: 'mobile' } });
    fireEvent.click(getAllByRole('button', { name: /Filter anwenden/i })[0]);
    fireEvent.click(getByRole('button', { name: /Bericht/i }));

    expect(onRefresh).toHaveBeenCalledWith(expect.objectContaining({
      startDate: '2000-01-01',
      filters: expect.objectContaining({ deviceType: 'mobile' }),
    }));
    expect(onExport).toHaveBeenCalledWith('analytics-report');
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

  it('enables save after a setting changes and submits the full updated settings payload', async () => {
    const onSave = vi.fn();
    const { getByLabelText, getByRole } = render(
      <AdvancedSettingsTab {...defaultProps} onSave={onSave} />,
    );
    const saveBtn = getByRole('button', { name: /Speichern/ });
    expect(saveBtn).toBeDisabled();

    fireEvent.change(getByLabelText(/Deploy Strategy/i), { target: { value: 'manual' } });
    expect(saveBtn).not.toBeDisabled();

    fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      deployStrategy: 'manual',
      workspaceRoot: '/home/user/workspace',
      buildCommand: 'npm run build',
    }));
    await waitFor(() => expect(saveBtn).toBeDisabled());
  });

  it('calls reset and restores local dirty state controls', () => {
    const onReset = vi.fn();
    const { getByLabelText, getByRole } = render(
      <AdvancedSettingsTab {...defaultProps} onReset={onReset} />,
    );

    fireEvent.change(getByLabelText(/Theme/i), { target: { value: 'light' } });
    expect(getByRole('button', { name: /Speichern/ })).not.toBeDisabled();

    fireEvent.click(getByRole('button', { name: /Zurücksetzen/ }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(getByRole('button', { name: /Speichern/ })).toBeDisabled();
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

  it('calls cache cleanup and optimization commands', () => {
    const onClearCache = vi.fn();
    const onOptimize = vi.fn();
    const { getByRole } = render(
      <SystemMonitorTab {...defaultProps} onClearCache={onClearCache} onOptimize={onOptimize} />,
    );

    fireEvent.click(getByRole('button', { name: /Cache löschen/ }));
    fireEvent.click(getByRole('button', { name: /Optimieren/ }));

    expect(onClearCache).toHaveBeenCalledTimes(1);
    expect(onOptimize).toHaveBeenCalledTimes(1);
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
