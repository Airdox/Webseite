import React from 'react';

const GLITCH_BLOCKS = Array.from({ length: 15 }).map((_, i) => {
    const isVertical = Math.random() > 0.7;
    return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        z: Math.random() * -500, // Depth into the screen
        w: isVertical ? (Math.random() * 3 + 2) : (Math.random() * 160 + 40),
        h: isVertical ? (Math.random() * 160 + 40) : (Math.random() * 3 + 2),
        delay: Math.random() * 15,
        duration: Math.random() * 8 + 8,
        isGlow: i % 4 === 0,
    };
});

const GlitchBlocks = () => {
    return (
        <div className="particles-container">
            {GLITCH_BLOCKS.map((block) => (
                <div
                    key={block.id}
                    className={`glitch-block ${block.isGlow ? 'glitch-glow' : ''}`}
                    style={{
                        left: `${block.x}%`,
                        top: `${block.y}%`,
                        width: `${block.w}px`,
                        height: `${block.h}px`,
                        '--z': `${block.z}px`,
                        '--delay': `${block.delay}s`,
                        '--duration': `${block.duration}s`
                    }}
                ></div>
            ))}
        </div>
    );
};

export default GlitchBlocks;
