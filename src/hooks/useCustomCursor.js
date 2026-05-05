import { useEffect, useRef } from 'react';

const useCustomCursor = () => {
    const cursorRef = useRef(null);
    const cursorOuterRef = useRef(null);
    const glowRef = useRef(null);
    const mousePosRef = useRef({ x: 0, y: 0 });
    const cursorScaleRef = useRef(1);

    useEffect(() => {
        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const supportsHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
        const hasFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
        const enableCursor = !prefersReducedMotion && supportsHover && hasFinePointer;

        if (!enableCursor) {
            if (cursorRef.current) cursorRef.current.style.display = 'none';
            if (cursorOuterRef.current) cursorOuterRef.current.style.display = 'none';
            if (glowRef.current) glowRef.current.style.display = 'none';
            return;
        }

        let rafId = null;
        const renderCursor = () => {
            rafId = null;
            const { x, y } = mousePosRef.current;
            const scale = cursorScaleRef.current;
            if (cursorRef.current && cursorOuterRef.current) {
                cursorRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
                cursorOuterRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale * 0.8})`;
            }
            if (glowRef.current) {
                glowRef.current.style.left = `${x}px`;
                glowRef.current.style.top = `${y}px`;
            }
        };

        const schedule = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(renderCursor);
        };

        const handleMouseMove = (e) => {
            mousePosRef.current = { x: e.clientX, y: e.clientY };
            schedule();
        };

        const handleMouseEnterInteractive = () => {
            cursorScaleRef.current = 1.5;
            schedule();
        };
        const handleMouseLeaveInteractive = () => {
            cursorScaleRef.current = 1;
            schedule();
        };

        window.addEventListener('mousemove', handleMouseMove);

        const interactiveElements = document.querySelectorAll('button, a, .interactive');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', handleMouseEnterInteractive);
            el.addEventListener('mouseleave', handleMouseLeaveInteractive);
        });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            interactiveElements.forEach(el => {
                el.removeEventListener('mouseenter', handleMouseEnterInteractive);
                el.removeEventListener('mouseleave', handleMouseLeaveInteractive);
            });
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    return { cursorRef, cursorOuterRef, glowRef };
};

export default useCustomCursor;
