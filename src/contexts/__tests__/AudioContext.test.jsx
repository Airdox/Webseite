import { render, act, waitFor } from '@testing-library/react';
import { AudioProvider, useAudio } from '../AudioContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Helper component to access context
const TestComponent = ({ onMount }) => {
    const audio = useAudio();
    React.useEffect(() => {
        if (onMount) onMount(audio);
    }, [onMount, audio]);
    return null;
};

describe('AudioContext Gapless Playback', () => {
    let audioMock;

    beforeEach(() => {
        // Mock Audio element
        audioMock = {
            play: vi.fn().mockResolvedValue(undefined),
            pause: vi.fn(),
            load: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            src: '',
            volume: 1, // Add volume property
            crossOrigin: '', // Add crossOrigin property
        };

        // Mock proper constructor using a class to support 'new Audio()'
        global.Audio = class {
            constructor() {
                return audioMock;
            }
        };

        // Mock Web Audio API using a class
        global.AudioContext = class {
            constructor() {
                this.state = 'suspended';
                this.destination = {};
            }
            createAnalyser() {
                return {
                    connect: vi.fn(),
                    frequencyBinCount: 128,
                    getByteFrequencyData: vi.fn(),
                };
            }
            createMediaElementSource() {
                return {
                    connect: vi.fn(),
                };
            }
            resume() {
                return Promise.resolve();
            }
        };

        // Add webkit alias
        global.webkitAudioContext = global.AudioContext;
    });

    it('should switch to the next part automatically when a part ends', async () => {
        let contextValues;

        render(
            <AudioProvider>
                <TestComponent onMount={(vals) => contextValues = vals} />
            </AudioProvider>
        );

        const multiPartTrack = {
            id: 'test-set',
            title: 'Test Set',
            file: '/sets/part0.mp3',
            parts: ['/sets/part0.mp3', '/sets/part1.mp3']
        };

        // 1. Start Playing
        await act(async () => {
            contextValues.playTrack(multiPartTrack);
        });

        expect(audioMock.src).toContain('/sets/part0.mp3');

        // 2. Simulate "ended" event on part 0
        // We need to find the specific event listener for 'ended'
        const endedHandler = audioMock.addEventListener.mock.calls.find(call => call[0] === 'ended')[1];

        await act(async () => {
            endedHandler();
        });

        // 3. Verify it switched to part 1
        expect(audioMock.src).toContain('/sets/part1.mp3');
        expect(audioMock.play).toHaveBeenCalledTimes(2); // Initial play + Part switch play
    });
});
