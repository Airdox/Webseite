import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/colors';
import { t } from '../utils/i18n';
import { useAudio } from '../contexts/AudioContext';

// Animated visualizer bar
const VisualizerBar = ({ delay, isActive }) => {
  const height = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(height, {
            toValue: 12 + Math.random() * 16,
            duration: 300 + Math.random() * 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
            delay: delay * 150,
          }),
          Animated.timing(height, {
            toValue: 4,
            duration: 300 + Math.random() * 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      Animated.timing(height, {
        toValue: 4,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isActive]);

  return (
    <Animated.View
      style={[
        styles.vizBar,
        {
          height,
          backgroundColor: isActive ? Colors.neonCyan : Colors.borderMedium,
        },
      ]}
    />
  );
};

const SetCard = ({ set, index, globalStats, userVote, onPlay, onVote }) => {
  const { currentTrack, isPlaying } = useAudio();
  const isSetPlaying = currentTrack?.id === set.id && isPlaying;
  const isSetCurrent = currentTrack?.id === set.id;

  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSetPlaying) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.stopAnimation();
    }
  }, [isSetPlaying]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const stats = globalStats || { plays: 0, likes: 0, dislikes: 0 };

  return (
    <TouchableOpacity
      style={[styles.card, isSetCurrent && styles.cardActive]}
      onPress={() => onPlay(set)}
      activeOpacity={0.85}
    >
      {/* Gradient top border when active */}
      {isSetCurrent && <View style={styles.cardGradientTop} />}

      {/* Cover / Vinyl */}
      <View style={styles.coverContainer}>
        <Animated.View
          style={[
            styles.vinyl,
            {
              borderColor: set.vinylColor || Colors.neonCyan,
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <View style={styles.vinylInner}>
            <View
              style={[styles.vinylCenter, { backgroundColor: set.vinylColor || Colors.neonCyan }]}
            />
          </View>
          {/* Vinyl grooves */}
          <View style={[styles.vinylGroove, styles.groove1, { borderColor: set.vinylColor + '30' }]} />
          <View style={[styles.vinylGroove, styles.groove2, { borderColor: set.vinylColor + '20' }]} />
        </Animated.View>

        {/* Play/Pause overlay */}
        <View style={styles.playOverlay}>
          <View style={styles.playBtn}>
            {isSetPlaying ? (
              <Svg viewBox="0 0 24 24" width={28} height={28} fill={Colors.textPrimary}>
                <Rect x="6" y="5" width="4" height="14" />
                <Rect x="14" y="5" width="4" height="14" />
              </Svg>
            ) : (
              <Svg viewBox="0 0 24 24" width={28} height={28} fill={Colors.textPrimary}>
                <Path d="M8 5v14l11-7z" />
              </Svg>
            )}
          </View>
        </View>

        {/* NEW Badge */}
        {set.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}

        {/* Visualizer bars */}
        {isSetPlaying && (
          <View style={styles.vizContainer}>
            {[...Array(8)].map((_, i) => (
              <VisualizerBar key={i} delay={i} isActive={isSetPlaying} />
            ))}
          </View>
        )}
      </View>

      {/* Set Info */}
      <View style={styles.setInfo}>
        <Text style={styles.setTitle} numberOfLines={1}>
          {set.title}
        </Text>
        <View style={styles.setMeta}>
          <Text style={styles.setDate}>{set.date}</Text>
          {set.duration && <Text style={styles.setDuration}>{set.duration}</Text>}
        </View>
      </View>

      {/* Stats & Vote */}
      <View style={styles.statsRow}>
        <View style={styles.playCount}>
          <Svg viewBox="0 0 24 24" width={12} height={12} fill={Colors.textMuted}>
            <Path d="M8 5v14l11-7z" />
          </Svg>
          <Text style={styles.statsText}>
            {t('music.plays')}: {stats.plays || 0}
          </Text>
        </View>

        <View style={styles.voteRow}>
          <TouchableOpacity
            style={[styles.voteBtn, userVote === 'like' && styles.voteBtnActive]}
            onPress={() => onVote(set.id, 'like')}
          >
            <Svg viewBox="0 0 24 24" width={14} height={14} fill={userVote === 'like' ? Colors.neonCyan : Colors.textMuted}>
              <Path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z" />
            </Svg>
            <Text style={[styles.statsText, userVote === 'like' && styles.statsTextActive]}>
              {stats.likes || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.voteBtn, userVote === 'dislike' && styles.voteBtnDislike]}
            onPress={() => onVote(set.id, 'dislike')}
          >
            <Svg viewBox="0 0 24 24" width={14} height={14} fill={userVote === 'dislike' ? Colors.neonPink : Colors.textMuted}>
              <Path d="M22 4h-2c-.55 0-1 .45-1 1v9c0 .55.45 1 1 1h2V4zM2.17 11.12c-.11.25-.17.52-.17.8V13c0 1.1.9 2 2 2h5.5l-.92 4.65c-.05.22-.02.46.08.66.23.45.52.86.88 1.22L10 22l6.41-6.41c.38-.38.59-.89.59-1.42V6.34C17 5.05 15.95 4 14.66 4H6.55c-.7 0-1.36.37-1.72.97l-2.66 6.15z" />
            </Svg>
            <Text style={[styles.statsText, userVote === 'dislike' && { color: Colors.neonPink }]}>
              {stats.dislikes || 0}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
    marginBottom: Spacing.base,
  },
  cardActive: {
    borderColor: Colors.borderGlow,
    shadowColor: Colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  cardGradientTop: {
    height: 2,
    backgroundColor: Colors.neonCyan,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  coverContainer: {
    height: 180,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  vinyl: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  vinylInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  vinylCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  vinylGroove: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 999,
  },
  groove1: {
    width: 90,
    height: 90,
  },
  groove2: {
    width: 70,
    height: 70,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  newBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.neonCyan,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.bgVoid,
    letterSpacing: 1,
  },
  vizContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    height: 30,
  },
  vizBar: {
    width: 3,
    borderRadius: 1,
    minHeight: 4,
  },
  setInfo: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  setTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  setMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  setDate: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  setDuration: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  playCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.textMuted,
  },
  statsTextActive: {
    color: Colors.neonCyan,
  },
  voteRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  voteBtnActive: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
  },
  voteBtnDislike: {
    backgroundColor: 'rgba(255, 0, 170, 0.1)',
  },
});

export default SetCard;
