import React, { useEffect } from 'react';
import Lenis from 'lenis';

const SmoothScroll = ({ children }) => {
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Initialize Lenis Core
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    let rafId;

    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // Scroll handlers
    const handleAnchorClick = (e) => {
        let target = e.target.closest('a[href^="#"], button[data-section]');
        
        if (!target) return;
        
        const id = target.getAttribute('href') || target.getAttribute('data-section');
        if (id === '#') return;
        
        // Remove trailing hash / extract id
        const cleanId = id.replace('#', '');
        const el = document.getElementById(cleanId);
        if (el) {
            e.preventDefault();
            lenis.scrollTo(el, { offset: -50, duration: 1.5 });
        }
    };
    
    document.addEventListener('click', handleAnchorClick);

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      if (rafId) cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScroll;
