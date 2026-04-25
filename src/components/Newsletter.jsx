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
        <section className="newsletter-section">
            <div className="newsletter-container">
                <div className="newsletter-content">
                    <h2 className="newsletter-title">JOIN THE <span className="neon-text">UNDERGROUND</span></h2>
                    <p className="newsletter-description">
                        Receive exclusive sets, early access to downloads, and tour dates directly in your inbox.
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
                                className={`newsletter-submit ${status}`}
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
        </section>
    );
};

export default Newsletter;
