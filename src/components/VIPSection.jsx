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
            <section className="vip-section section" id="vip">
                <div className="container">
                    <div className="airdox-card reveal">
                        <div className="vip-content">
                            <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
                                <span className="section-label">MEMBERS ONLY</span>
                                <h2 className="section-title text-gradient" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>WILLKOMMEN, {user.username}</h2>
                                <p className="section-subtitle">
                                    Dein VIP-Zugang ist aktiv. Du findest die exklusiven MP3-Downloads und Tracklisten nun direkt in der Set-Übersicht oben!
                                </p>
                            </div>

                            <button className="logout-btn" onClick={handleLogout}>
                                Abmelden
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="vip-section section" id="vip">
            <div className="container">
                <div className="auth-container airdox-card reveal">
                    <div className="section-header" style={{ marginBottom: 'var(--space-8)' }}>
                        <span className="section-label">ACCESS CONTROL</span>
                        <h2 className="section-title text-gradient" style={{ fontSize: '2rem' }}>VIP LOGIN</h2>
                    </div>
                    
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
                            <label htmlFor="username">Username / Email</label>
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

                        {error && <div className="auth-error">{error}</div>}
                        {success && <div className="auth-success">{success}</div>}

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Processing...' : (isLogin ? 'Login Access' : 'Create Account')}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default VIPSection;
