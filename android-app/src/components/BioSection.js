import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/colors';
import { t } from '../utils/i18n';

const BioSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ringAnim1 = useRef(new Animated.Value(0)).current;
  const ringAnim2 = useRef(new Animated.Value(0)).current;
  const ringAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Rotating rings animation
    const createRingAnim = (anim, duration) =>
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        })
      ).start();

    createRingAnim(ringAnim1, 12000);
    createRingAnim(ringAnim2, 18000);
    createRingAnim(ringAnim3, 24000);
  }, []);

  const stats = [
    { number: '50+', label: 'LIVE SETS' },
    { number: '10K+', label: 'LISTENERS' },
    { number: 'BERLIN', label: 'BASED' },
  ];

  const tags = ['TECHNO', 'INDUSTRIAL', 'DARK', 'HYPNOTIC', 'UNDERGROUND'];

  const spin1 = ringAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const spin2 = ringAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });
  const spin3 = ringAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.section}>
      {/* Background */}
      <LinearGradient
        colors={['#000000', '#050510', '#000000']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.container}>
        {/* Geometric Visual */}
        <View style={styles.visualContainer}>
          <View style={styles.visualFrame}>
            <View style={[styles.frameCorner, styles.frameTL]} />
            <View style={[styles.frameCorner, styles.frameTR]} />
            <View style={[styles.frameCorner, styles.frameBL]} />
            <View style={[styles.frameCorner, styles.frameBR]} />

            <View style={styles.geoStructure}>
              <Animated.View
                style={[styles.geoRing, styles.ring1, { transform: [{ rotate: spin1 }] }]}
              />
              <Animated.View
                style={[styles.geoRing, styles.ring2, { transform: [{ rotate: spin2 }] }]}
              />
              <Animated.View
                style={[styles.geoRing, styles.ring3, { transform: [{ rotate: spin3 }] }]}
              />
              <View style={styles.geoCore} />
            </View>
          </View>
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Section Header */}
          <Text style={styles.sectionLabel}>{t('bio.sectionLabel')}</Text>
          <Text style={styles.sectionTitle}>{t('bio.title')}</Text>

          {/* Bio Text */}
          <Text style={styles.bioIntro}>{t('bio.intro')}</Text>
          <Text style={styles.bioBody}>{t('bio.body1')}</Text>

          {isExpanded && (
            <View>
              <Text style={styles.bioHeading}>{t('bio.heading1')}</Text>
              <Text style={styles.bioBody}>{t('bio.body2')}</Text>
              <Text style={styles.bioBody}>{t('bio.body3')}</Text>

              <Text style={styles.bioHeading}>{t('bio.heading2')}</Text>
              <Text style={styles.bioBody}>{t('bio.body4')}</Text>

              <Text style={styles.bioHeading}>{t('bio.heading3')}</Text>
              <Text style={styles.bioBody}>{t('bio.body5')}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.moreBtnText}>
              {isExpanded ? t('bio.showLess') : t('bio.showMore')}
            </Text>
            <Text style={[styles.moreBtnArrow, isExpanded && styles.moreBtnArrowRotated]}>
              ▼
            </Text>
          </TouchableOpacity>

          {/* Stats */}
          <View style={styles.statsRow}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statNumber}>{stat.number}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingVertical: Spacing.section,
    position: 'relative',
  },
  container: {
    paddingHorizontal: Spacing.base,
  },
  visualContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  visualFrame: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  frameCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: Colors.neonCyan,
  },
  frameTL: { top: 0, left: 0, borderTopWidth: 1, borderLeftWidth: 1 },
  frameTR: { top: 0, right: 0, borderTopWidth: 1, borderRightWidth: 1 },
  frameBL: { bottom: 0, left: 0, borderBottomWidth: 1, borderLeftWidth: 1 },
  frameBR: { bottom: 0, right: 0, borderBottomWidth: 1, borderRightWidth: 1 },
  geoStructure: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  geoRing: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 999,
  },
  ring1: {
    width: 140,
    height: 140,
    borderColor: 'rgba(0, 245, 255, 0.3)',
    borderStyle: 'dashed',
  },
  ring2: {
    width: 100,
    height: 100,
    borderColor: 'rgba(255, 0, 170, 0.3)',
  },
  ring3: {
    width: 60,
    height: 60,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderStyle: 'dashed',
  },
  geoCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.neonCyan,
    shadowColor: Colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xs,
    color: Colors.neonCyan,
    letterSpacing: 3,
    marginBottom: Spacing.base,
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  bioIntro: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: Spacing.base,
    fontStyle: 'italic',
  },
  bioBody: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  bioHeading: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  moreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  moreBtnText: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xs,
    color: Colors.neonCyan,
    letterSpacing: 2,
    marginRight: Spacing.sm,
  },
  moreBtnArrow: {
    color: Colors.neonCyan,
    fontSize: FontSizes.xs,
  },
  moreBtnArrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.neonCyan,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  tag: {
    borderWidth: 1,
    borderColor: Colors.borderMedium,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  tagText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
});

export default BioSection;
