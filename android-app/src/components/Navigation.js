import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/colors';
import { t, getCurrentLocale, setLocale } from '../utils/i18n';

const { width } = Dimensions.get('window');

const Navigation = ({ scrollY, scrollToSection, activeSection }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;
  const currentLang = getCurrentLocale();

  const navItems = [
    { id: 'home', label: t('nav.home') },
    { id: 'bio', label: t('nav.about') },
    { id: 'music', label: t('nav.music') },
    { id: 'booking', label: t('nav.booking') },
  ];

  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: menuOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [menuOpen]);

  const handleNavPress = (id) => {
    scrollToSection?.(id);
    setMenuOpen(false);
  };

  const isScrolled = scrollY > 50;

  return (
    <>
      {/* Navigation Bar */}
      <View style={[styles.nav, isScrolled && styles.navScrolled]}>
        {/* Scroll Progress */}
        <View style={styles.progressBar}>
          <LinearGradient
            colors={[Colors.neonPink, Colors.neonCyan]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${Math.min(scrollY / 10, 100)}%` }]}
          />
        </View>

        <View style={styles.navContainer}>
          {/* Logo */}
          <TouchableOpacity onPress={() => handleNavPress('home')} activeOpacity={0.7}>
            <View style={styles.logoRow}>
              <Text style={styles.logoText}>AIRDOX</Text>
              <View style={styles.logoDot} />
            </View>
          </TouchableOpacity>

          {/* Menu Toggle */}
          <TouchableOpacity
            style={styles.menuToggle}
            onPress={() => setMenuOpen(!menuOpen)}
          >
            <View style={[styles.menuLine, menuOpen && styles.menuLineOpen1]} />
            <View style={[styles.menuLine, menuOpen && styles.menuLineOpen2]} />
            <View style={[styles.menuLine, menuOpen && styles.menuLineOpen3]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mobile Menu */}
      {menuOpen && (
        <Animated.View
          style={[
            styles.mobileMenu,
            {
              opacity: menuAnim,
              transform: [
                {
                  translateY: menuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.menuContent}>
            {navItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleNavPress(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemNumber}>0{index + 1}</Text>
                <Text
                  style={[
                    styles.menuItemText,
                    activeSection === item.id && styles.menuItemActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.menuFooter}>
              <TouchableOpacity style={styles.langBtn} onPress={() => {
                setLocale(currentLang === 'de' ? 'en' : 'de');
                setMenuOpen(false);
              }}>
                <Text style={[styles.langText, currentLang === 'de' && styles.langActive]}>
                  DE
                </Text>
                <Text style={styles.langSep}>/</Text>
                <Text style={[styles.langText, currentLang === 'en' && styles.langActive]}>
                  EN
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 48, // Status bar
  },
  navScrolled: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'transparent',
  },
  progressFill: {
    height: '100%',
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 3,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neonCyan,
    marginLeft: 4,
  },
  menuToggle: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  menuLine: {
    width: 24,
    height: 2,
    backgroundColor: Colors.textPrimary,
    borderRadius: 1,
  },
  menuLineOpen1: {
    transform: [{ rotate: '45deg' }, { translateY: 7 }],
  },
  menuLineOpen2: {
    opacity: 0,
  },
  menuLineOpen3: {
    transform: [{ rotate: '-45deg' }, { translateY: -7 }],
  },
  mobileMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 99,
    justifyContent: 'center',
    paddingTop: 100,
  },
  menuContent: {
    paddingHorizontal: Spacing.xxl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  menuItemNumber: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xs,
    color: Colors.neonCyan,
    marginRight: Spacing.lg,
    letterSpacing: 1,
  },
  menuItemText: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  menuItemActive: {
    color: Colors.neonCyan,
  },
  menuFooter: {
    marginTop: Spacing.xxl,
    alignItems: 'center',
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  langText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
  },
  langActive: {
    color: Colors.neonCyan,
  },
  langSep: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
  },
});

export default Navigation;
