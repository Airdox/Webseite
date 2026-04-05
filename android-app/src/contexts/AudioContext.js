import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';
import { sets } from '../data/musicSets';

const AudioCtx = createContext();

export const useAudio = () => {
  const context = useContext(AudioCtx);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};

export const AudioProvider = ({ children }) => {
  const soundRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playlist] = useState(sets);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playlistIndexRef = useRef(0);
  const intervalRef = useRef(null);

  // Configure audio mode for background playback
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startTimeTracking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      if (soundRef.current) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            setCurrentTime(status.positionMillis / 1000);
            setDuration(status.durationMillis / 1000);
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        } catch {
          // Sound may have been unloaded
        }
      }
    }, 500);
  }, []);

  const playTrack = useCallback(async (track, autoPlay = true) => {
    if (!track || !track.file) return;

    // If same track, just toggle
    if (currentTrack?.id === track.id && soundRef.current) {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundRef.current.playAsync();
          setIsPlaying(true);
          startTimeTracking();
        }
        return;
      }
    }

    // Unload previous
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // ignore
      }
      soundRef.current = null;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);

    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(0);

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.file },
        {
          shouldPlay: autoPlay,
          volume: volume,
          progressUpdateIntervalMillis: 500,
        },
        (status) => {
          if (status.isLoaded) {
            setCurrentTime(status.positionMillis / 1000);
            if (status.durationMillis) {
              setDuration(status.durationMillis / 1000);
            }
            if (status.didJustFinish) {
              setIsPlaying(false);
              // Auto-next
              const idx = playlist.findIndex((t) => t.id === track.id);
              if (idx < playlist.length - 1) {
                const nextTrack = playlist[idx + 1];
                playTrack(nextTrack);
              }
            }
          }
        }
      );
      soundRef.current = sound;
      setIsPlaying(autoPlay);

      // Update playlist index
      const idx = playlist.findIndex((t) => t.id === track.id);
      if (idx !== -1) playlistIndexRef.current = idx;
    } catch (err) {
      console.warn('Error loading audio:', err);
    }
  }, [currentTrack, volume, playlist, startTimeTracking]);

  const togglePlay = useCallback(async () => {
    if (!soundRef.current || !currentTrack) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (err) {
      console.warn('Toggle play error:', err);
    }
  }, [currentTrack]);

  const seek = useCallback(async (time) => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(time * 1000);
      setCurrentTime(time);
    } catch {
      // ignore
    }
  }, []);

  const next = useCallback(() => {
    if (playlist.length === 0) return;
    const nextIndex = (playlistIndexRef.current + 1) % playlist.length;
    playlistIndexRef.current = nextIndex;
    playTrack(playlist[nextIndex]);
  }, [playlist, playTrack]);

  const previous = useCallback(() => {
    if (playlist.length === 0) return;
    if (currentTime > 3) {
      seek(0);
      return;
    }
    const prevIndex = (playlistIndexRef.current - 1 + playlist.length) % playlist.length;
    playlistIndexRef.current = prevIndex;
    playTrack(playlist[prevIndex]);
  }, [playlist, currentTime, seek, playTrack]);

  const changeVolume = useCallback(async (val) => {
    const newVol = Math.max(0, Math.min(1, val));
    setVolume(newVol);
    if (soundRef.current) {
      try {
        await soundRef.current.setVolumeAsync(newVol);
      } catch {
        // ignore
      }
    }
  }, []);

  const value = {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    playTrack,
    togglePlay,
    seek,
    next,
    previous,
    changeVolume,
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
};
