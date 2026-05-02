import React from 'react';
import './EPKSection.css';
import { t } from '../utils/i18n';

const EPKSection = () => {
    return (
        <section id="press" className="epk-section section">
            <div className="container">
                <div className="section-header reveal">
                    <span className="section-label">{t('epk.sectionLabel')}</span>
                    <h2 className="section-title text-gradient">{t('epk.title')}</h2>
                    <p className="section-subtitle">{t('epk.subtitle')}</p>
                </div>

                <div className="epk-grid">
                    <div className="epk-item airdox-card reveal stagger-1">
                        <div className="epk-icon">📸</div>
                        <h3>{t('epk.pressPhotosTitle')}</h3>
                        <p>{t('epk.pressPhotosText')}</p>
                        <button className="btn btn-outline btn-block" onClick={() => alert(t('epk.zipPlaceholder'))}>
                            {t('epk.downloadZip')}
                        </button>
                    </div>

                    <div className="epk-item airdox-card reveal stagger-2">
                        <div className="epk-icon">⚙️</div>
                        <h3>{t('epk.riderTitle')}</h3>
                        <p>{t('epk.riderText')}</p>
                        <button className="btn btn-outline btn-block" onClick={() => alert(t('epk.pdfPlaceholder'))}>
                            {t('epk.downloadPdf')}
                        </button>
                    </div>
                </div>

                <div className="epk-footer reveal stagger-3" style={{ marginTop: 'var(--space-12)', textAlign: 'center' }}>
                    <p className="section-subtitle">{t('epk.footer')}</p>
                </div>
            </div>
        </section>
    );
};

export default EPKSection;
