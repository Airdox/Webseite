import React from 'react';
import './AtmosphericBackground.css';

const AtmosphericBackground = () => {
    return (
        <div className="atmospheric-bg">
            {/* Unified Glow Blobs */}
            <div className="glow-blob blob-1"></div>
            <div className="glow-blob blob-2"></div>
            <div className="glow-blob blob-3"></div>
            <div className="glow-blob blob-4"></div>
            
            {/* Global Grid Overlay */}
            <div className="global-grid"></div>
            
            {/* Subtle Noise Overlay */}
            <div className="noise-texture"></div>

            {/* Global Scanlines */}
            <div className="scanlines"></div>
        </div>
    );
};

export default AtmosphericBackground;
