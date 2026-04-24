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
                                Dein VIP-Zugang ist aktiv. Du findest die exklusiven MP3-Downloads und Tracklisten nun direkt in der Set-Übersicht oben!
                            </p>
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
                            className="auth-tab active"
                            style={{ width: '100%' }}
                        >
                            VIP LOGIN
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
                            {loading ? 'Processing...' : 'Login Access'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default VIPSection;
