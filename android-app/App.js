import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AudioProvider } from './src/contexts/AudioContext';
import HomeScreen from './src/screens/HomeScreen';
import LoadingScreen from './src/components/LoadingScreen';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress (matching website behavior)
    const timer = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setLoading(false), 500);
          return 100;
        }
        return prev + Math.random() * 30;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#000000" />
      <AudioProvider>
        {loading ? (
          <LoadingScreen isLoaded={false} progress={loadingProgress} />
        ) : (
          <HomeScreen />
        )}
      </AudioProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
