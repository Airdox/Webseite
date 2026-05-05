import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ToastProvider } from './contexts/ToastContext';
import { AudioProvider } from './contexts/AudioContext';
import Hero from './components/Hero';
import Navigation from './components/Navigation';
import SmoothScroll from './components/SmoothScroll';

// Lazy load components below the fold
const MusicSection = lazy(() => import('./components/MusicSection'));
const VIPSection = lazy(() => import('./components/VIPSection'));
const BioSection = lazy(() => import('./components/BioSection'));
const AgentSystemSection = lazy(() => import('./components/AgentSystemSection'));
const EPKSection = lazy(() => import('./components/EPKSection')); // [NEW]
const Newsletter = lazy(() => import('./components/Newsletter')); // [NEW]
const BookingSection = lazy(() => import('./components/BookingSection'));
const Footer = lazy(() => import('./components/Footer'));
const Visualizer = lazy(() => import('./components/Visualizer')); // [NEW]
const AuthModal = lazy(() => import('./components/AuthModal')); // [NEW]
import GlobalPlayer from './components/GlobalPlayer';

import SetNotification from './components/SetNotification';
import CookieBanner from './components/CookieBanner';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AtmosphericBackground from './components/AtmosphericBackground';
import './styles/global.css';
import { t } from './utils/i18n';

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
    {t('app.loadingComponent')}
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
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });

  const openAuth = (mode = 'login') => setAuthModal({ isOpen: true, mode });
  const closeAuth = () => setAuthModal({ ...authModal, isOpen: false });

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
        <SmoothScroll>
          <LoadingScreen progress={loadingProgress} isLoaded={!loading} />
          <div className="app">
            <AtmosphericBackground />
            <Suspense fallback={null}>
              <Visualizer />
            </Suspense>
            <Navigation onOpenAuth={openAuth} />
          <Hero />
          <Suspense fallback={<SectionLoading />}>
            <BioSection />
          </Suspense>
          <Suspense fallback={<SectionLoading />}>
            <AgentSystemSection />
          </Suspense>
          <Suspense fallback={<SectionLoading />}>
            <MusicSection />
          </Suspense>
          <Suspense fallback={<SectionLoading />}>
            <VIPSection onOpenAuth={openAuth} />
          </Suspense>
          <Suspense fallback={<SectionLoading />}>
            <EPKSection />
          </Suspense>
          <Suspense fallback={<SectionLoading />}>
            <BookingSection />
          </Suspense>
          <Suspense fallback={<SectionLoading />}>
            <Newsletter />
          </Suspense>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
          <SetNotification />
          <CookieBanner />
          <GlobalPlayer />
          <AnalyticsDashboard />
          <Suspense fallback={null}>
            <AuthModal 
              isOpen={authModal.isOpen} 
              onClose={closeAuth} 
              initialMode={authModal.mode} 
            />
          </Suspense>
          </div>
        </SmoothScroll>
      </AudioProvider>
    </ToastProvider>
  );
}

export default App;
