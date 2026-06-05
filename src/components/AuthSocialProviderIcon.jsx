const AuthSocialProviderIcon = ({ provider }) => {
    if (provider === 'google') {
        return (
            <svg className="auth-social-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.3 0-.6-.1-1.1-.2-1.6H12z" />
                <path fill="#34A853" d="M12 21.6c2.5 0 4.7-.8 6.2-2.3l-3-2.4c-.8.5-1.9.9-3.2.9-2.5 0-4.7-1.7-5.4-4l-3.1 2.4C4.9 19.4 8.2 21.6 12 21.6z" />
                <path fill="#4A90E2" d="M6.6 13.8c-.2-.6-.4-1.2-.4-1.8s.1-1.3.4-1.8L3.5 7.8C2.8 9.1 2.4 10.5 2.4 12s.4 2.9 1.1 4.2l3.1-2.4z" />
                <path fill="#FBBC05" d="M12 6c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 3 14.6 2.4 12 2.4 8.2 2.4 4.9 4.6 3.5 7.8l3.1 2.4c.7-2.3 2.9-4.2 5.4-4.2z" />
            </svg>
        );
    }

    return (
        <svg className="auth-social-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="11" fill="#1877F2" />
            <path
                fill="#FFFFFF"
                d="M13.7 20v-7.2h2.4l.4-2.8h-2.8V8.2c0-.8.2-1.4 1.4-1.4h1.5V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v2.8h2.4V20h3.3z"
            />
        </svg>
    );
};

export default AuthSocialProviderIcon;
