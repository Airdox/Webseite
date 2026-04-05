import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSizes, Spacing } from '../theme/colors';

const { width } = Dimensions.get('window');

const LoadingScreen = ({ isLoaded, progress }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for AIRDOX logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (isLoaded) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoaded, fadeAnim]);

  if (isLoaded) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={{ opacity: pulseAnim }}>
        <Text style={styles.logo}>AIRDOX</Text>
      </Animated.View>
      <View style={styles.progressContainer}>
        <LinearGradient
          colors={Colors.neonPink ? [Colors.neonPink, Colors.neonCyan] : ['#ff00aa', '#00f5ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBar, { width: `${Math.min(progress, 100)}%` }]}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bgVoid,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  logo: {
    fontSize: FontSizes.hero,
    fontWeight: '700',
    color: Colors.neonCyan,
    letterSpacing: 4,
  },
  progressContainer: {
    width: 200,
    height: 2,
    backgroundColor: Colors.borderSubtle,
    borderRadius: 999,
    marginTop: Spacing.xl,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 999,
  },
});

export default LoadingScreen;
