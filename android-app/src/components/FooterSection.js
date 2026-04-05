import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/colors';
import { t } from '../utils/i18n';

const FooterSection = ({ scrollToTop }) => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'SoundCloud', url: 'https://soundcloud.com/airdox' },
    { name: 'Mixcloud', url: 'https://www.mixcloud.com/Airdox/' },
    { name: 'Instagram', url: 'https://instagram.com/airdox_bln' },
    { name: 'Email', url: 'mailto:airdox82@gmail.com' },
  ];

  return (
    <View style={styles.footer}>
      <LinearGradient
        colors={['#000000', '#050510']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top glow line */}
      <LinearGradient
        colors={[Colors.neonPink, Colors.neonCyan]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.glowLine}
      />

      <View style={styles.container}>
        {/* Logo & Tagline */}
        <Text style={styles.footerLogo}>AIRDOX</Text>
        <Text style={styles.footerTagline}>{t('footer.tagline')}</Text>

        {/* Social Links */}
        <View style={styles.socialsRow}>
          {socialLinks.map((link) => (
            <TouchableOpacity
              key={link.name}
              style={styles.socialLink}
              onPress={() => Linking.openURL(link.url)}
              activeOpacity={0.7}
            >
              <Text style={styles.socialLinkText}>{link.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Back to Top */}
        <TouchableOpacity
          style={styles.backToTop}
          onPress={scrollToTop}
          activeOpacity={0.7}
        >
          <Svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={Colors.textSecondary} strokeWidth={2}>
            <Path d="M12 19V5M5 12l7-7 7 7" />
          </Svg>
          <Text style={styles.backToTopText}>{t('footer.backToTop')}</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Copyright */}
        <Text style={styles.copyright}>
          © {currentYear} AIRDOX. All rights reserved.
        </Text>
        <Text style={styles.credit}>
          {t('footer.madeWith')} <Text style={styles.heart}>♥</Text> {t('footer.inBerlin')}{' '}
          <Text style={styles.version}>v1.0.0</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingTop: Spacing.xxl,
    paddingBottom: 140, // Space for global player
    position: 'relative',
  },
  glowLine: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 1,
    opacity: 0.5,
  },
  container: {
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },
  footerLogo: {
    fontSize: FontSizes.xxxl,
    fontWeight: '700',
    color: Colors.neonCyan,
    letterSpacing: 4,
    marginBottom: Spacing.sm,
  },
  footerTagline: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    letterSpacing: 3,
    marginBottom: Spacing.xxl,
  },
  socialsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  socialLink: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  socialLinkText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  backToTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderMedium,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xxl,
  },
  backToTopText: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginBottom: Spacing.lg,
  },
  copyright: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  credit: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: Colors.textDim,
  },
  heart: {
    color: Colors.neonPink,
  },
  version: {
    color: Colors.textDim,
    fontSize: 9,
  },
});

export default FooterSection;
