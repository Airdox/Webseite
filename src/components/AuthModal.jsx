import React, { useState, useEffect } from 'react';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState(initialMode); // 'login' or 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        setMode(initialMode);
        setError('');
        setSuccess('');
    }, [initialMode, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const endpoint = mode === 'login' ? '/api/login' : '/api/register';
            const payload = mode === 'login' 
                ? { email, password } 
                : { email, password, username };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            if (mode === 'login') {
                localStorage.setItem('airdox_token', data.token);
                setSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    onClose();
                    window.location.reload(); // Simple way to refresh UI state
                }, 1500);
            } else {
                setSuccess('Registration successful! You can now login.');
                setMode('login');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>&times;</button>
                
                <div className="modal-header">
                    <div className="modal-tabs">
                        <button 
                            className={`modal-tab ${mode === 'login' ? 'active' : ''}`}
                            onClick={() => setMode('login')}
                        >
                            LOGIN
                        </button>
                        <button 
                            className={`modal-tab ${mode === 'register' ? 'active' : ''}`}
                            onClick={() => setMode('register')}
                        >
                            REGISTER
                        </button>
                    </div>
                </div>

                <div className="modal-body">
                    <h2 className="modal-title">
                        {mode === 'login' ? 'Welcome Back' : 'Join the Underground'}
                    </h2>
                    <p className="modal-subtitle">
                        {mode === 'login' ? 'Access exclusive VIP sets and content.' : 'Create an account for full access.'}
                    </p>

                    {error && <div className="modal-error">{error}</div>}
                    {success && <div className="modal-success">{success}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        {mode === 'register' && (
                            <div className="form-group">
                                <label>Username</label>
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="your_dj_name"
                                    required
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label>Email Address</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? (
                                <span className="loader-mini"></span>
                            ) : (
                                mode === 'login' ? 'Login Access' : 'Create Account'
                            )}
                        </button>
                    </form>
                </div>

                <div className="modal-footer">
                    <p>
                        {mode === 'login' 
                            ? "Don't have an account?" 
                            : "Already have an account?"}
                        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                            {mode === 'login' ? 'Register here' : 'Login here'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
