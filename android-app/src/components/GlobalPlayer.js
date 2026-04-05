import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Slider,
  Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/colors';
import { useAudio } from '../contexts/AudioContext';

const { width } = Dimensions.get('window');

const GlobalPlayer = () => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    next,
    previous,
    currentTime,
    duration,
    seek,
    volume,
    changeVolume,
  } = useAudio();

  if (!currentTrack) return null;

  const formatTime = (time) => {
    if (!time && time !== 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <View style={styles.player}>
      {/* Gradient background */}
      <LinearGradient
        colors={['rgba(10, 10, 20, 0.98)', 'rgba(5, 5, 15, 0.99)']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top border glow */}
      <LinearGradient
        colors={[Colors.neonPink, Colors.neonCyan]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBorder}
      />

      {/* Track Info */}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text style={styles.trackArtist}>AIRDOX // RESIDENT DJ</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressArea}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <TouchableOpacity
          style={styles.progressBar}
          activeOpacity={1}
          onPress={(e) => {
            const { locationX } = e.nativeEvent;
            const barWidth = width - 120; // approximate width
            const percent = Math.max(0, Math.min(1, locationX / barWidth));
            seek(percent * duration);
          }}
        >
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[Colors.neonPink, Colors.neonCyan]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
            <View
              style={[
                styles.progressThumb,
                { left: `${progressPercent}%` },
              ]}
            />
          </View>
        </TouchableOpacity>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Previous */}
        <TouchableOpacity style={styles.controlBtn} onPress={previous}>
          <Svg viewBox="0 0 24 24" width={22} height={22} fill={Colors.textSecondary}>
            <Path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </Svg>
        </TouchableOpacity>

        {/* Play/Pause */}
        <TouchableOpacity style={styles.playPauseBtn} onPress={togglePlay}>
          <LinearGradient
            colors={[Colors.neonPink, Colors.neonCyan]}
            style={styles.playPauseGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {isPlaying ? (
              <Svg viewBox="0 0 24 24" width={24} height={24} fill={Colors.bgVoid}>
                <Path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </Svg>
            ) : (
              <Svg viewBox="0 0 24 24" width={24} height={24} fill={Colors.bgVoid}>
                <Path d="M8 5v14l11-7z" />
              </Svg>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity style={styles.controlBtn} onPress={next}>
          <Svg viewBox="0 0 24 24" width={22} height={22} fill={Colors.textSecondary}>
            <Path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  player: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.base,
    borderTopWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  trackTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 1,
    maxWidth: width - 60,
  },
  trackArtist: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 2,
    marginTop: 2,
  },
  progressArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  timeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.textMuted,
    width: 40,
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: 24,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.borderSubtle,
    borderRadius: 2,
    position: 'relative',
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.neonCyan,
    marginLeft: -5,
    shadowColor: Colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  controlBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseBtn: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: Colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  playPauseGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GlobalPlayer;
