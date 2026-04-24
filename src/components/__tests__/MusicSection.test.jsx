import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import MusicSection from '../MusicSection';
import { AudioProvider } from '../../contexts/AudioContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock IntersectionObserver
vi.stubGlobal('IntersectionObserver', class {
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
});

// Mock i18n
vi.mock('../../utils/i18n', () => ({
    t: (key) => key
}));

// Mock Music Sets
vi.mock('../../data/musicSets', () => ({
    sets: [
        { id: 'test-set-1', title: 'Test Set 1', date: 'JAN 2026', vinylColor: '#ff0000' }
    ]
}));

describe('MusicSection Synchronisation', () => {
    const mockStats = {
        'test-set-1': { plays: 10, likes: 5, dislikes: 1 }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        
        // Default Mock für fetch (Success)
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockStats)
        }));

        // Mock global window properties safely
        if (!window.Capacitor) {
            window.Capacitor = undefined;
        }
    });

    it('lädt die Statistik beim Start vom Server', async () => {
        render(
            <AudioProvider>
                <MusicSection />
            </AudioProvider>
        );

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/stats'),
                undefined
            );
        });
    });

    it('erkennt mobile Umgebungen und nutzt absolute Produktions-URLs', async () => {
        // Simuliere mobile Umgebung via Protokoll (JSDOM safe)
        const locationProp = Object.getOwnPropertyDescriptor(window, 'location');
        Object.defineProperty(window, 'location', {
            value: { ...window.location, protocol: 'file:', hostname: 'localhost' },
            configurable: true
        });
        
        window.Capacitor = { isNative: true };

        render(
            <AudioProvider>
                <MusicSection />
            </AudioProvider>
        );

        await waitFor(() => {
            // Sollte die Produktions-URL enthalten
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('https://airdox.info/api/stats'),
                undefined
            );
        });

        // Cleanup
        Object.defineProperty(window, 'location', locationProp);
        delete window.Capacitor;
    });

    it('schreibt Aktionen in die Offline-Queue, wenn der Server nicht erreichbar ist', async () => {
        // Simuliere Server-Fehler
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network Error')));

        render(
            <AudioProvider>
                <MusicSection />
            </AudioProvider>
        );

        // Wir simulieren einen Like-Klick (wir nehmen an, das erste Set ist 'test-set-1')
        // Da MusicSection die realen 'sets' aus musicSets.js importiert, nehmen wir die ID eines existierenden Sets
        // oder wir mocken die musicSets. Ich passe den Test auf ein reales Set an.
        
        const likeButton = await screen.findAllByLabelText(/Like/i);
        fireEvent.click(likeButton[0]);

        await waitFor(() => {
            const queue = JSON.parse(localStorage.getItem('airdox_offline_queue') || '[]');
            expect(queue.length).toBeGreaterThan(0);
            expect(queue[0].type).toBe('like');
        });
    });

    it('synchronisiert die Offline-Queue automatisch, sobald eine Internetverbindung besteht', async () => {
        // 1. App startet offline mit bestehender Queue
        const initialQueue = [{ id: 'test-set-1', type: 'play' }];
        localStorage.setItem('airdox_offline_queue', JSON.stringify(initialQueue));

        vi.stubGlobal('fetch', vi.fn()
            .mockRejectedValueOnce(new Error('Still offline')) // Initialer Sync-Versuch
            .mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) })); // Späterer Erfolg

        render(
            <AudioProvider>
                <MusicSection />
            </AudioProvider>
        );

        // 2. Online Event simulieren
        await act(async () => {
            window.dispatchEvent(new Event('online'));
        });

        await waitFor(() => {
            // Fetch sollte für die Queue-Aktion aufgerufen worden sein
            expect(fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ method: 'POST' })
            );
            
            // Queue sollte geleert sein
            const queue = JSON.parse(localStorage.getItem('airdox_offline_queue') || '[]');
            expect(queue.length).toBe(0);
        });
    });
});
