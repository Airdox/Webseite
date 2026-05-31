import React, { useState } from 'react';
import './Newsletter.css';
import { t } from '../utils/i18n';
import { buildApiUrl, readApiError, readApiJson } from '../utils/apiResponse';
import { audienceEvents } from '../utils/audienceSignals';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            const response = await fetch(buildApiUrl('/api/subscribe'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                await readApiJson(response);
                setStatus('success');
                setMessage(t('newsletter.success'));
                setEmail('');
                window.airdoxAnalyticsV2?.trackEvent('newsletter_subscribe', { status: 'success' });
                window.airdoxAnalyticsV2?.trackEvent('sign_up', {
                    method: 'newsletter',
                    status: 'success'
                });
                audienceEvents.newsletterSignup({
                    contentType: 'newsletter',
                    source: 'newsletter_section',
                    value: 1
                });
            } else {
                throw new Error(await readApiError(response, t('newsletter.subscriptionFailed')));
            }
        } catch (err) {
            setStatus('error');
            setMessage(err.message || t('newsletter.error'));
            window.airdoxAnalyticsV2?.trackEvent('newsletter_subscribe', { status: 'error', error: err.message });
        }
    };

    return (
        <section className="newsletter-section section" id="newsletter">
            <div className="container">
                <div className="airdox-card reveal">
                    <div className="newsletter-content">
                        <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
                            <span className="section-label">{t('newsletter.sectionLabel')}</span>
                            <h2 className="section-title text-gradient" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>{t('newsletter.title')}</h2>
                        </div>
                        <p className="newsletter-description">
                            {t('newsletter.description')}
                        </p>
                        
                        <form className="newsletter-form" onSubmit={handleSubmit}>
                            <div className="input-group">
                                <input 
                                    type="email" 
                                    placeholder={t('newsletter.emailPlaceholder')} 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === 'loading' || status === 'success'}
                                    required
                                    className="newsletter-input"
                                />
                                <button 
                                    type="submit" 
                                    className={`btn btn-primary newsletter-submit ${status}`}
                                    disabled={status === 'loading' || status === 'success'}
                                >
                                    {status === 'loading' ? t('newsletter.submitting') : t('newsletter.subscribe')}
                                </button>
                            </div>
                        </form>
                        
                        {status !== 'idle' && (
                            <p className={`newsletter-status-msg ${status}`}>
                                {message}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Newsletter;
