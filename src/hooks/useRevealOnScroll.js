import { useEffect } from 'react';

/**
 * Custom Hook: Reveal-on-Scroll Animation
 * Ersetzt den in jeder Section duplizierten IntersectionObserver.
 *
 * @param {React.RefObject} ref - Ref des Containers (section element)
 * @param {string} selectors - CSS-Selektoren für animierbare Elemente
 *                              Default: '.reveal, .reveal-left, .reveal-right, .reveal-scale'
 * @param {number} threshold - Sichtbarkeits-Schwelle (0-1). Default: 0.1
 */
const useRevealOnScroll = (
    ref,
    selectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale',
    threshold = 0.1
) => {
    useEffect(() => {
        const node = ref?.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold }
        );

        const elements = node.querySelectorAll(selectors);
        elements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, [ref, selectors, threshold]);
};

export default useRevealOnScroll;
