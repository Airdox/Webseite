import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { ToastProvider } from './contexts/ToastContext';
import { AudioProvider } from './contexts/AudioContext';
import Hero from './components/Hero';
import Navigation from './components/Navigation';
import SmoothScroll from './components/SmoothScroll';
import BioSection from './components/BioSection';
import MusicSection from './components/MusicSection';
import BookingSection from './components/BookingSection';

// Lazy-load secondary sections only. Primary navigation targets stay eager so
// normal scrolling never exposes a chunk-loading state.
const VIPSection = lazy(() => import('./components/VIPSection'));
const EPKSection = lazy(() => import('./components/EPKSection')); // [NEW]
const Newsletter = lazy(() => import('./components/Newsletter')); // [NEW]
const Footer = lazy(() => import('./components/Footer'));
const Visualizer = lazy(() => import('./components/Visualizer')); // [NEW]
const AuthModal = lazy(() => import('./components/AuthModal')); // [NEW]
import GlobalPlayer from './components/GlobalPlayer';

import SetNotification from './components/SetNotification';
import CookieBanner from './components/CookieBanner';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AtmosphericBackground from './components/AtmosphericBackground';
import { audienceEvents } from './utils/audienceSignals';
import './styles/global.css';

const THEME_STORAGE_KEY = 'airdox-theme-mode';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  return 'dark';
};

// Keep lazy section fallback invisible; user-facing loading text makes normal
// code-splitting look like a broken page while chunks resolve.
const SectionLoading = () => (
  <div style={{ minHeight: '1px' }} aria-hidden="true" />
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
  const [theme, setTheme] = useState(getInitialTheme);
  const trackedSectionsRef = useRef(new Set());

  const openAuth = (mode = 'login') => setAuthModal({ isOpen: true, mode });
  const closeAuth = () => setAuthModal({ ...authModal, isOpen: false });
  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.setAttribute('content', theme === 'light' ? '#f6fbff' : '#00f0ff');
    }
  }, [theme]);

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

  useEffect(() => {
    const getRoute = () => `${window.location.pathname || '/'}${window.location.hash || ''}`;
    const trackRouteView = (source = 'app_mount') => {
      audienceEvents.routeView({
        route: getRoute(),
        contentType: 'page',
        source,
        value: 1
      });
    };
    const handleRouteChange = () => trackRouteView('browser_navigation');
    const handleConsentChange = () => window.setTimeout(() => trackRouteView('consent_change'), 0);

    trackRouteView();
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('analytics-consent-changed', handleConsentChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('analytics-consent-changed', handleConsentChange);
    };
  }, []);

  useEffect(() => {
    if (!window.IntersectionObserver) return undefined;

    const sectionIds = ['home', 'bio', 'music', 'vip', 'press', 'booking', 'newsletter'];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
        const sectionId = entry.target.id;
        if (!sectionId || trackedSectionsRef.current.has(sectionId)) return;

        const tracked = audienceEvents.sectionView({
          contentId: sectionId,
          contentType: 'website_section',
          source: 'viewport',
          value: 1
        });
        if (tracked) {
          trackedSectionsRef.current.add(sectionId);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: [0.5] });

    sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .forEach((section) => observer.observe(section));

    return () => observer.disconnect();
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
          <Navigation onOpenAuth={openAuth} theme={theme} onToggleTheme={toggleTheme} />
          <Hero />
          <BioSection />
          <MusicSection />
          <Suspense fallback={<SectionLoading />}>
            <VIPSection onOpenAuth={openAuth} />
          </Suspense>
          <Suspense fallback={<SectionLoading />}>
            <EPKSection />
          </Suspense>
          <BookingSection />
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
