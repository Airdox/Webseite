import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ToastProvider } from './contexts/ToastContext';
import { AudioProvider } from './contexts/AudioContext';
import Hero from './components/Hero';
import Navigation from './components/Navigation';

// Lazy load components below the fold
const MusicSection = lazy(() => import('./components/MusicSection'));
const BioSection = lazy(() => import('./components/BioSection'));
const BookingSection = lazy(() => import('./components/BookingSection'));
const Footer = lazy(() => import('./components/Footer'));
const GlobalPlayer = lazy(() => import('./components/GlobalPlayer'));

import SetNotification from './components/SetNotification';
import CookieBanner from './components/CookieBanner';
import './styles/global.css';

// Loading Fallback Component
const SectionLoading = () => (
  <div style={{
    height: '20vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)',
    color: 'var(--accent-cyan)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    letterSpacing: '2px'
  }}>
    LOADING_COMPONENT...
  </div>
);

// Loading Screen Component
const LoadingScreen = ({ progress, isLoaded }) => (
  <div className={`loading-screen ${isLoaded ? 'hidden' : ''}`}>
    <div className="loading-logo">AIRDOX</div>
    <div className="loading-bar">
      <div className="loading-progress" style={{ width: `${progress}%` }}></div>
    </div>
  </div>
);

function App() {
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const timer = setInterval(() => {
      setLoadingProgress(prev => {
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
    <ToastProvider>
      <AudioProvider>
        <LoadingScreen progress={loadingProgress} isLoaded={!loading} />
        <div className="app">
          <Navigation />
          <Hero />
          <Suspense fallback={<SectionLoading />}>
            <BioSection />
          </Suspense>
          <Suspense fallback={<SectionLoading />}>
            <MusicSection />
          </Suspense>
          <Suspense fallback={<SectionLoading />}>
            <BookingSection />
          </Suspense>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
          <SetNotification />
          <CookieBanner />
          <Suspense fallback={null}>
            <GlobalPlayer />
          </Suspense>
        </div>
      </AudioProvider>
    </ToastProvider>
  );
}

export default App;
