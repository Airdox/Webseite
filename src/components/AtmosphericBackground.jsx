import React from 'react';
import './AtmosphericBackground.css';

const AtmosphericBackground = () => {
    return (
        <div className="atmospheric-bg">
            {/* Subtle ambient glow */}
            <div className="glow-blob blob-1"></div>
            <div className="glow-blob blob-2"></div>

            {/* Minimal texture to avoid flat black */}
            <div className="noise-texture"></div>
        </div>
    );
};

export default AtmosphericBackground;
