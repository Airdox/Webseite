import React from 'react';
import { t } from '../utils/i18n';

const AuthModalFields = ({
    mode,
    username,
    email,
    password,
    setUsername,
    setEmail,
    setPassword,
}) => (
    <>
        {mode === 'register' && (
            <div className="form-group">
                <label htmlFor="auth-username">{t('auth.username')}</label>
                <input
                    id="auth-username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="your_dj_name"
                    autoComplete="username"
                    required
                />
            </div>
        )}
        <div className="form-group">
            <label htmlFor="auth-email">{t('auth.email')}</label>
            <input
                id="auth-email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                required
            />
        </div>
        <div className="form-group">
            <label htmlFor="auth-password">{t('auth.password')}</label>
            <input
                id="auth-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
            />
        </div>
    </>
);

export default AuthModalFields;
