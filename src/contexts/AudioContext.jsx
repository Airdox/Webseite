import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
// jsmediatags removed


const AudioContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within AudioProvider');
    }
    return context;
};

export const AudioProvider = ({ children }) => {
    const audioRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);

    // State
    const [currentTrack, setCurrentTrack] = useState(null);
    const [playlist, setPlaylist] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.8);
    // const [isMuted, setIsMuted] = useState(false); // Can be added later if needed
    const [repeatMode, setRepeatMode] = useState('off'); // 'off', 'one', 'all'
    const [shuffle, setShuffle] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlayerVisible, setIsPlayerVisible] = useState(false);

    const playlistIndexRef = useRef(0);
    const currentPartIndexRef = useRef(0);
    const audioSourceRef = useRef(null);

    // Initialisierung Audio Context für Visualizer
    const initAudioContext = useCallback(() => {
        if (!audioRef.current) return;

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256; // Smaller for beat detection
            analyserRef.current.smoothingTimeConstant = 0.8;
        }

        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        if (!audioSourceRef.current) {
            try {
                audioSourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
                audioSourceRef.current.connect(analyserRef.current);
                analyserRef.current.connect(audioContextRef.current.destination);
            } catch (err) {
                console.warn('Audio source already connected or failed:', err);
            }
        }
    }, []);

    const togglePlay = useCallback(() => {
        if (!audioRef.current || !currentTrack) return;

        initAudioContext();

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(err => console.error('Play error:', err));
        }
    }, [currentTrack, isPlaying, initAudioContext]);

    const playTrack = useCallback((track, autoPlay = true) => {
        console.log('playTrack called for:', track?.title);
        if (!track || !track.file) {
            console.error('Invalid track or file missing');
            return;
        }

        // Wenn gleicher Track, nur togglen
        if (currentTrack?.id === track.id) {
            console.log('Toggling play (same track)');
            togglePlay();
            return;
        }

        setCurrentTrack(track);
        setIsPlayerVisible(true);
        currentPartIndexRef.current = 0; // Reset part index for new track

        if (audioRef.current) {
            // Always start with the file defined in 'file' (which should be part000 for multi-part tracks)
            const encodedSrc = encodeURI(track.file);
            console.log('Loading audio src:', encodedSrc);
            audioRef.current.src = encodedSrc;
            audioRef.current.load();
            if (autoPlay) {
                initAudioContext();
                console.log('Attempting autoPlay');
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log('Playback started successfully');
                            setIsPlaying(true);
                        })
                        .catch(err => console.error('Play error:', err));
                }
            }
        } else {
            console.error('audioRef.current is null!');
        }

        // Playlist index update
        const index = playlist.findIndex(t => t.id === track.id);
        if (index !== -1) playlistIndexRef.current = index;
    }, [playlist, currentTrack, initAudioContext, togglePlay]);

    const seek = useCallback((time) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const next = useCallback(() => {
        if (playlist.length === 0) return;
        let nextIndex = shuffle ? Math.floor(Math.random() * playlist.length) : (playlistIndexRef.current + 1) % playlist.length;
        playlistIndexRef.current = nextIndex;
        playTrack(playlist[nextIndex]);
    }, [playlist, shuffle, playTrack]);

    const previous = useCallback(() => {
        if (playlist.length === 0) return;
        if (currentTime > 3) { seek(0); return; }
        let prevIndex = shuffle ? Math.floor(Math.random() * playlist.length) : (playlistIndexRef.current - 1 + playlist.length) % playlist.length;
        playlistIndexRef.current = prevIndex;
        playTrack(playlist[prevIndex]);
    }, [playlist, currentTime, shuffle, seek, playTrack]);

    const changeVolume = useCallback((val) => {
        const newVol = Math.max(0, Math.min(1, val));
        setVolume(newVol);
        if (audioRef.current) audioRef.current.volume = newVol;
    }, []);

    // Refs for accessing state inside event listeners without re-binding
    const currentTrackRef = useRef(currentTrack);
    // playlistIndexRef already exists in component scope
    const playlistRef = useRef(playlist);
    const repeatModeRef = useRef(repeatMode);
    const shuffleRef = useRef(shuffle);
    const volumeRef = useRef(volume);

    // Sync Refs
    useEffect(() => {
        currentTrackRef.current = currentTrack;
        playlistRef.current = playlist;
        repeatModeRef.current = repeatMode;
        shuffleRef.current = shuffle;
        volumeRef.current = volume;
    }, [currentTrack, playlist, repeatMode, shuffle, volume]);

    // Setup Audio Element (ONCE)
    useEffect(() => {
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.volume = volumeRef.current;
        audioRef.current = audio;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);

        const onEnded = () => {
            const track = currentTrackRef.current;
            const currentPartIdx = currentPartIndexRef.current;

            // Check for multi-part tracks first
            if (track?.parts && track.parts.length > 0 && currentPartIdx < track.parts.length - 1) {
                // Play next part
                const nextPartIdx = currentPartIdx + 1;
                currentPartIndexRef.current = nextPartIdx;

                const nextFile = track.parts[nextPartIdx];
                console.log(`Auto-switching to part ${nextPartIdx + 1}/${track.parts.length}: ${nextFile}`);

                if (audioRef.current) {
                    audioRef.current.src = encodeURI(nextFile);
                    audioRef.current.load();
                    audioRef.current.play()
                        .then(() => setIsPlaying(true))
                        .catch(err => console.error('Part switch error:', err));
                }
                return; // Don't proceed to next track logic
            }

            // Normal track end logic
            const mode = repeatModeRef.current;
            const idx = playlistIndexRef.current;
            const list = playlistRef.current;

            if (mode === 'one') {
                playTrack(track);
            } else if (mode === 'all' || idx < list.length - 1) {
                if (list.length === 0) return;
                let nextIndex = shuffleRef.current ? Math.floor(Math.random() * list.length) : (idx + 1) % list.length;
                playlistIndexRef.current = nextIndex;
                actionsRef.current.playTrack(list[nextIndex]);
            } else {
                setIsPlaying(false);
            }
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.pause();
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, []); // Empty dependency array -> Runs once

    // Helper to allow useEffect to call actions
    const actionsRef = useRef({ playTrack: () => { } });
    useEffect(() => {
        actionsRef.current = { playTrack };
    }, [playTrack]);

    // Volume Sync
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    const [currentTracklist, setCurrentTracklist] = useState([]);
    const [isLoadingTracklist, setIsLoadingTracklist] = useState(false);

    const value = {
        audioRef,
        analyserRef,
        currentTrack,
        playlist,
        setPlaylist,
        isPlaying,
        volume,
        repeatMode,
        shuffle,
        currentTime,
        duration,
        isPlayerVisible,
        setIsPlayerVisible,
        playTrack,
        togglePlay,
        seek,
        next,
        previous,
        changeVolume,
        setRepeatMode,
        setShuffle
    };

    return (
        <AudioContext.Provider value={value}>
            {children}
        </AudioContext.Provider>
    );
};
