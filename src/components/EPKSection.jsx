import React from 'react';
import './EPKSection.css';

const EPKSection = () => {
    return (
        <section id="press" className="epk-section section">
            <div className="container">
                <div className="section-header reveal">
                    <span className="section-label">RESOURCES</span>
                    <h2 className="section-title text-gradient">DIGITAL EPK</h2>
                    <p className="section-subtitle">Alles für Promoter, Booker und die Presse an einem Ort.</p>
                </div>

                <div className="epk-grid">
                    <div className="epk-item airdox-card reveal stagger-1">
                        <div className="epk-icon">📸</div>
                        <h3>PRESS PHOTOS</h3>
                        <p>High-resolution imagery for event promotion and press articles.</p>
                        <button className="btn btn-outline btn-block" onClick={() => alert('Placeholder: ZIP file will be linked here.')}>
                            DOWNLOAD ZIP
                        </button>
                    </div>

                    <div className="epk-item airdox-card reveal stagger-2">
                        <div className="epk-icon">⚙️</div>
                        <h3>TECHNICAL RIDER</h3>
                        <p>Requirements for equipment, sound, and stage setup.</p>
                        <button className="btn btn-outline btn-block" onClick={() => alert('Placeholder: PDF file will be linked here.')}>
                            DOWNLOAD PDF
                        </button>
                    </div>

                    <div className="epk-item airdox-card reveal stagger-3">
                        <div className="epk-icon">📄</div>
                        <h3>BIOGRAPHY</h3>
                        <p>Official biography in short and long versions (DE/EN).</p>
                        <button className="btn btn-outline btn-block" onClick={() => alert('Placeholder: Text/DOC file will be linked here.')}>
                            DOWNLOAD TXT
                        </button>
                    </div>
                </div>

                <div className="epk-footer reveal stagger-4" style={{ marginTop: 'var(--space-12)', textAlign: 'center' }}>
                    <p className="section-subtitle">FOR BOOKING INQUIRIES OR PRESS INTERVIEWS, PLEASE USE THE CONTACT FORM BELOW.</p>
                </div>
            </div>
        </section>
    );
};

export default EPKSection;
