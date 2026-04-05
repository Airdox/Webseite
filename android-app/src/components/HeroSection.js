import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';
import { Colors, Gradients, FontSizes, Spacing, BorderRadius } from '../theme/colors';
import { t } from '../utils/i18n';

const { width, height } = Dimensions.get('window');

const SocialIcon = ({ type, url }) => {
  const icons = {
    soundcloud: (
      <Svg viewBox="0 0 24 24" width={20} height={20} fill={Colors.textSecondary}>
        <Path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c.014.057.045.094.09.094s.089-.037.099-.094l.198-1.308-.198-1.332c-.01-.057-.044-.094-.09-.094m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.104.106.104.061 0 .12-.044.12-.104l.24-2.458-.24-2.563c0-.06-.045-.104-.12-.104m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.077.075.138.149.138.075 0 .135-.061.15-.138l.225-2.544-.225-2.64c-.016-.075-.075-.135-.15-.135m.93-.132c-.09 0-.165.075-.165.166l-.192 2.772.192 2.593c0 .09.075.165.165.165s.165-.075.165-.165l.21-2.593-.21-2.772c0-.09-.075-.166-.165-.166m1.065-.232c-.105 0-.195.09-.195.195l-.165 3.004.165 2.593c0 .105.09.195.195.195s.195-.09.195-.195l.18-2.593-.18-3.004c0-.105-.09-.195-.195-.195m.93-.164c-.12 0-.21.091-.225.211l-.15 3.168.15 2.623c.015.12.105.21.225.21s.21-.09.225-.21l.165-2.623-.165-3.168c-.015-.12-.105-.21-.225-.21" />
      </Svg>
    ),
    instagram: (
      <Svg viewBox="0 0 24 24" width={20} height={20} fill={Colors.textSecondary}>
        <Path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </Svg>
    ),
    email: (
      <Svg viewBox="0 0 24 24" width={20} height={20} fill={Colors.textSecondary}>
        <Path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </Svg>
    ),
    mixcloud: (
      <Svg viewBox="0 0 24 24" width={20} height={20} fill={Colors.textSecondary}>
        <Path d="M4.685 12.235c-2.31 0-4.17 1.841-4.17 4.129 0 2.29 1.86 4.128 4.17 4.128 2.311 0 4.167-1.838 4.167-4.128 0-2.288-1.856-4.129-4.167-4.129zm14.628 0c-2.311 0-4.168 1.841-4.168 4.129 0 2.29 1.857 4.128 4.168 4.128 2.31 0 4.167-1.838 4.167-4.128 0-2.288-1.857-4.129-4.167-4.129z" />
      </Svg>
    ),
  };

  return (
    <TouchableOpacity
      style={styles.socialBtn}
      onPress={() => Linking.openURL(url)}
      activeOpacity={0.7}
    >
      {icons[type]}
    </TouchableOpacity>
  );
};

// Animated Orb component
const AnimatedOrb = ({ color, size, startX, startY, delay }) => {
  const position = useRef(new Animated.ValueXY({ x: startX, y: startY })).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(position.x, {
              toValue: startX + (Math.random() * 60 - 30),
              duration: 8000 + delay * 1000,
              useNativeDriver: true,
            }),
            Animated.timing(position.y, {
              toValue: startY + (Math.random() * 40 - 20),
              duration: 8000 + delay * 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.15,
              duration: 4000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(position.x, {
              toValue: startX,
              duration: 8000 + delay * 1000,
              useNativeDriver: true,
            }),
            Animated.timing(position.y, {
              toValue: startY,
              duration: 8000 + delay * 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.3,
              duration: 4000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };
    setTimeout(animate, delay * 1000);
  }, []);

  return (
    <Animated.View
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
          ],
        },
      ]}
    />
  );
};

const HeroSection = ({ scrollToSection }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const badgeSlide = useRef(new Animated.Value(-30)).current;
  const taglineSlide = useRef(new Animated.Value(30)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const socialsFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      // Badge appear
      Animated.parallel([
        Animated.timing(badgeSlide, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Title scale in
      Animated.spring(titleScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Tagline slide in
      Animated.timing(taglineSlide, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      // CTA buttons fade in
      Animated.timing(ctaFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Socials fade in
      Animated.timing(socialsFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.hero}>
      {/* Background */}
      <LinearGradient
        colors={['#0a001a', '#000000', '#001a1a']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Animated Orbs */}
      <AnimatedOrb color="rgba(0, 245, 255, 0.15)" size={200} startX={-50} startY={50} delay={0} />
      <AnimatedOrb color="rgba(255, 0, 170, 0.12)" size={250} startX={width - 100} startY={height * 0.3} delay={2} />
      <AnimatedOrb color="rgba(168, 85, 247, 0.1)" size={180} startX={width * 0.3} startY={height * 0.5} delay={4} />

      {/* Content */}
      <View style={styles.heroContent}>
        {/* Badge */}
        <Animated.View
          style={[
            styles.badge,
            {
              opacity: fadeAnim,
              transform: [{ translateY: badgeSlide }],
            },
          ]}
        >
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>{t('hero.badge')}</Text>
        </Animated.View>

        {/* Title */}
        <Animated.View style={{ transform: [{ scale: titleScale }] }}>
          <Text style={styles.heroTitle}>AIRDOX</Text>
          <LinearGradient
            colors={[Colors.neonPink, Colors.neonCyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleUnderline}
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={[
            styles.tagline,
            { transform: [{ translateY: taglineSlide }], opacity: fadeAnim },
          ]}
        >
          <View style={styles.taglineLine} />
          <View style={styles.taglineTextRow}>
            <Text style={styles.taglineWord}>{t('hero.tagline.1')}</Text>
            <Text style={styles.taglineSeparator}>◆</Text>
            <Text style={styles.taglineWord}>{t('hero.tagline.2')}</Text>
            <Text style={styles.taglineSeparator}>◆</Text>
            <Text style={styles.taglineWord}>{t('hero.tagline.3')}</Text>
          </View>
          <View style={styles.taglineLine} />
        </Animated.View>

        {/* CTA Buttons */}
        <Animated.View style={[styles.ctaRow, { opacity: ctaFade }]}>
          <TouchableOpacity
            style={styles.ctaPrimary}
            onPress={() => scrollToSection?.('music')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.neonPink, Colors.neonCyan]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaPrimaryText}>{t('hero.cta.music')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ctaOutline}
            onPress={() => scrollToSection?.('booking')}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaOutlineText}>{t('hero.cta.booking')}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Social Links */}
        <Animated.View style={[styles.socials, { opacity: socialsFade }]}>
          <SocialIcon type="soundcloud" url="https://soundcloud.com/airdox" />
          <SocialIcon type="mixcloud" url="https://www.mixcloud.com/Airdox/" />
          <SocialIcon type="instagram" url="https://instagram.com/airdox_bln" />
          <SocialIcon type="email" url="mailto:airdox82@gmail.com" />
        </Animated.View>
      </View>

      {/* Scroll Indicator */}
      <View style={styles.scrollIndicator}>
        <View style={styles.scrollMouse}>
          <View style={styles.scrollWheel} />
        </View>
        <Text style={styles.scrollText}>{t('hero.scroll')}</Text>
      </View>

      {/* Corner Decorations */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
    </View>
  );
};

const styles = StyleSheet.create({
  hero: {
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    zIndex: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neonCyan,
    marginRight: Spacing.sm,
  },
  badgeText: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xs,
    color: Colors.neonCyan,
    letterSpacing: 3,
  },
  heroTitle: {
    fontSize: width < 380 ? 56 : 72,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 245, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  titleUnderline: {
    height: 3,
    width: '80%',
    alignSelf: 'center',
    borderRadius: 2,
    marginTop: Spacing.sm,
  },
  tagline: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  taglineLine: {
    width: 60,
    height: 1,
    backgroundColor: Colors.borderMedium,
  },
  taglineTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  taglineWord: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    letterSpacing: 4,
  },
  taglineSeparator: {
    color: Colors.neonCyan,
    marginHorizontal: Spacing.sm,
    fontSize: FontSizes.xs,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.xxl,
  },
  ctaPrimary: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  ctaGradient: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  ctaPrimaryText: {
    color: Colors.bgVoid,
    fontWeight: '700',
    fontSize: FontSizes.sm,
    letterSpacing: 1.5,
  },
  ctaOutline: {
    borderWidth: 2,
    borderColor: Colors.neonCyan,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  ctaOutlineText: {
    color: Colors.neonCyan,
    fontWeight: '700',
    fontSize: FontSizes.sm,
    letterSpacing: 1.5,
  },
  socials: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.xxl,
  },
  socialBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  scrollMouse: {
    width: 24,
    height: 38,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.textMuted,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 6,
  },
  scrollWheel: {
    width: 3,
    height: 8,
    borderRadius: 2,
    backgroundColor: Colors.neonCyan,
  },
  scrollText: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: Colors.textMuted,
    letterSpacing: 3,
    marginTop: 8,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.borderMedium,
  },
  cornerTL: {
    top: 60,
    left: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  cornerTR: {
    top: 60,
    right: 20,
    borderTopWidth: 1,
    borderRightWidth: 1,
  },
  cornerBL: {
    bottom: 80,
    left: 20,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
  },
  cornerBR: {
    bottom: 80,
    right: 20,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
});

export default HeroSection;
