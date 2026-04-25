import React, { useState } from 'react';
import './Newsletter.css';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (response.ok) {
                setStatus('success');
                setMessage('WELCOME TO THE UNDERGROUND.');
                setEmail('');
                window.airdoxAnalyticsV2?.trackEvent('newsletter_subscribe', { status: 'success' });
            } else {
                throw new Error(data.error || 'Subscription failed');
            }
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'SOMETHING WENT WRONG.');
            window.airdoxAnalyticsV2?.trackEvent('newsletter_subscribe', { status: 'error', error: err.message });
        }
    };

    return (
        <section className="newsletter-section section">
            <div className="container">
                <div className="airdox-card reveal">
                    <div className="newsletter-content">
                        <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
                            <span className="section-label">COMMUNITY</span>
                            <h2 className="section-title text-gradient" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>JOIN THE UNDERGROUND</h2>
                        </div>
                        <p className="newsletter-description">
                            Exklusive Sets, Early Access Downloads und Tourdaten direkt in dein Postfach.
                        </p>
                        
                        <form className="newsletter-form" onSubmit={handleSubmit}>
                            <div className="input-group">
                                <input 
                                    type="email" 
                                    placeholder="YOUR-EMAIL@DOMAIN.COM" 
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
                                    {status === 'loading' ? 'SUBMITTING...' : 'SUBSCRIBE'}
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
