import React from 'react';
import './EPKSection.css';

const EPKSection = () => {
    return (
        <section id="press" className="epk-section">
            <div className="epk-container">
                <div className="section-header">
                    <h2 className="section-title">ELECTRONIC <span className="neon-text">PRESS KIT</span></h2>
                    <div className="section-line"></div>
                </div>

                <div className="epk-grid">
                    <div className="epk-item">
                        <div className="epk-icon">📸</div>
                        <h3>PRESS PHOTOS</h3>
                        <p>High-resolution imagery for event promotion and press articles.</p>
                        <button className="epk-btn" onClick={() => alert('Placeholder: ZIP file will be linked here.')}>
                            DOWNLOAD ZIP
                        </button>
                    </div>

                    <div className="epk-item">
                        <div className="epk-icon">⚙️</div>
                        <h3>TECHNICAL RIDER</h3>
                        <p>Requirements for equipment, sound, and stage setup.</p>
                        <button className="epk-btn" onClick={() => alert('Placeholder: PDF file will be linked here.')}>
                            DOWNLOAD PDF
                        </button>
                    </div>

                    <div className="epk-item">
                        <div className="epk-icon">📄</div>
                        <h3>BIOGRAPHY</h3>
                        <p>Official biography in short and long versions (DE/EN).</p>
                        <button className="epk-btn" onClick={() => alert('Placeholder: Text/DOC file will be linked here.')}>
                            DOWNLOAD TXT
                        </button>
                    </div>
                </div>

                <div className="epk-footer">
                    <p>FOR BOOKING INQUIRIES OR PRESS INTERVIEWS, PLEASE USE THE CONTACT FORM BELOW.</p>
                </div>
            </div>
        </section>
    );
};

export default EPKSection;
