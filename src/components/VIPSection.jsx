import React, { useState, useEffect } from 'react';
import { sets } from '../data/musicSets';
import './VIPSection.css';

const API_BASE = import.meta.env.VITE_STATS_API_BASE || '';

const VIPSection = () => {
    const [user, setUser] = useState(null);
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    useEffect(() => {
        const savedToken = localStorage.getItem('airdox_token');
        if (savedToken) {
            validateToken(savedToken);
        }
    }, []);

    const validateToken = async (token) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'validate', token })
            });
            const result = await response.json();
            if (response.ok && result.ok) {
                setUser(result.user);
                window.dispatchEvent(new CustomEvent('airdox_login_success'));
            } else {
                localStorage.removeItem('airdox_token');
                setUser(null);
            }
        } catch (e) {
            console.error('Session validation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE}/api/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: isLogin ? 'login' : 'register',
                    ...formData
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Authentication failed');
            }

            if (isLogin) {
                localStorage.setItem('airdox_token', result.token);
                setUser(result.user);
                window.dispatchEvent(new CustomEvent('airdox_login_success'));
            } else {
                setSuccess('Registration successful! You can now log in.');
                setIsLogin(true);
                setFormData({ ...formData, password: '' });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('airdox_token');
        setUser(null);
        window.dispatchEvent(new CustomEvent('airdox_logout'));
    };

    if (user) {
        return (
            <section className="vip-section" id="vip">
                <div className="vip-bg">
                    <div className="vip-gradient"></div>
                </div>
                <div className="container">
                    <div className="vip-content">
                        <div className="vip-header">
                            <span className="vip-badge">VIP AREA</span>
                            <h2 className="section-title text-gradient">Willkommen, {user.username}</h2>
                            <p className="section-subtitle">
                                Hier findest du alle Sets zum Download in höchster Qualität.
                            </p>
                        </div>

                        <div className="download-grid">
                            {sets.map((set) => (
                                <div key={set.id} className="download-card">
                                    <div className="download-info">
                                        <h3 className="download-title">{set.title}</h3>
                                        <p className="set-date">{set.date} • {set.duration}</p>
                                    </div>
                                    <a 
                                        href={`/audio/${set.file}`} 
                                        download={set.file}
                                        className="download-btn"
                                        onClick={() => {
                                            if (window.airdoxAnalyticsV2) {
                                                window.airdoxAnalyticsV2.trackEvent('download', { setId: set.id });
                                            }
                                        }}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                                        </svg>
                                        Download MP3
                                    </a>

                                    {set.tracks && set.tracks.length > 0 && (
                                        <div className="vip-tracklist-section">
                                            <h4 className="tracklist-title">Tracklist</h4>
                                            <ul className="tracklist-items">
                                                {set.tracks.map((track, idx) => (
                                                    <li key={idx} className="tracklist-item">
                                                        <span className="track-time">{track.time}</span>
                                                        <span className="track-details">
                                                            <span className="track-artist">{track.artist}</span> - <span className="track-title">{track.title}</span>
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button className="logout-btn" onClick={handleLogout}>
                            Abmelden
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="vip-section" id="vip">
            <div className="vip-bg">
                <div className="vip-gradient"></div>
            </div>
            <div className="container">
                <div className="auth-container reveal-scale">
                    <div className="auth-tabs">
                        <button 
                            className={`auth-tab ${isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(true)}
                        >
                            LOGIN
                        </button>
                        <button 
                            className={`auth-tab ${!isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(false)}
                        >
                            REGISTER
                        </button>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label htmlFor="username">Username</label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username"
                                required
                                value={formData.username}
                                onChange={handleInputChange}
                                placeholder="dj-pro-123"
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                            />
                        </div>

                        {error && <div className="auth-error" style={{ color: 'var(--neon-pink)', fontSize: '0.8rem', textAlign: 'center' }}>{error}</div>}
                        {success && <div className="auth-success" style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem', textAlign: 'center' }}>{success}</div>}

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? 'Processing...' : (isLogin ? 'Login Access' : 'Create Account')}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default VIPSection;
