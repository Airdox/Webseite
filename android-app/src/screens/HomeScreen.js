import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Colors } from '../theme/colors';
import HeroSection from '../components/HeroSection';
import BioSection from '../components/BioSection';
import MusicSection from '../components/MusicSection';
import BookingSection from '../components/BookingSection';
import FooterSection from '../components/FooterSection';
import Navigation from '../components/Navigation';
import GlobalPlayer from '../components/GlobalPlayer';

const { height } = Dimensions.get('window');

const HomeScreen = () => {
  const scrollRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('home');
  const [refreshing, setRefreshing] = useState(false);

  // Section layout tracking
  const sectionLayouts = useRef({});

  const handleScroll = useCallback((event) => {
    const y = event.nativeEvent.contentOffset.y;
    setScrollY(y);

    // Determine active section
    const sections = ['booking', 'music', 'bio', 'home'];
    for (const sectionId of sections) {
      const layout = sectionLayouts.current[sectionId];
      if (layout && y >= layout.y - 200) {
        setActiveSection(sectionId);
        break;
      }
    }
  }, []);

  const scrollToSection = useCallback((sectionId) => {
    const layout = sectionLayouts.current[sectionId];
    if (layout && scrollRef.current) {
      scrollRef.current.scrollTo({
        y: layout.y,
        animated: true,
      });
    } else if (sectionId === 'home' && scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const registerSection = useCallback((id, event) => {
    sectionLayouts.current[id] = {
      y: event.nativeEvent.layout.y,
      height: event.nativeEvent.layout.height,
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgVoid} />

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.neonCyan}
            colors={[Colors.neonCyan]}
            progressBackgroundColor={Colors.bgDark}
          />
        }
      >
        {/* Hero */}
        <View onLayout={(e) => registerSection('home', e)}>
          <HeroSection scrollToSection={scrollToSection} />
        </View>

        {/* Bio */}
        <View onLayout={(e) => registerSection('bio', e)}>
          <BioSection />
        </View>

        {/* Music */}
        <View onLayout={(e) => registerSection('music', e)}>
          <MusicSection />
        </View>

        {/* Booking */}
        <View onLayout={(e) => registerSection('booking', e)}>
          <BookingSection />
        </View>

        {/* Footer */}
        <FooterSection scrollToTop={scrollToTop} />
      </ScrollView>

      {/* Navigation Overlay */}
      <Navigation
        scrollY={scrollY}
        scrollToSection={scrollToSection}
        activeSection={activeSection}
      />

      {/* Global Player */}
      <GlobalPlayer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgVoid,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});

export default HomeScreen;
