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
import GlobalPlayer from './components/GlobalPlayer';

import SetNotification from './components/SetNotification';
import CookieBanner from './components/CookieBanner';
import AnalyticsDashboard from './components/AnalyticsDashboard';
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

  // Globales Scroll Tracking
  useEffect(() => {
    let ticking = false;
    let localMaxDepth = 0;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          
          if (documentHeight > windowHeight) {
             const depth = Math.floor((scrollPosition / (documentHeight - windowHeight)) * 100);
             // Nur Updates ans System schicken, wenn sich die Tiefe signifikant erhöht
             if (depth > localMaxDepth) {
                 localMaxDepth = depth;
                 // Um localStorage nicht zu fluten, updaten wir zB alle 10%
                 if (depth % 10 === 0 || depth === 100 || depth === 25 || depth === 50 || depth === 75) {
                    window.airdoxAnalytics?.trackScrollDepth(depth);
                 }
             }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
          <GlobalPlayer />
          <AnalyticsDashboard />
        </div>
      </AudioProvider>
    </ToastProvider>
  );
}

export default App;
