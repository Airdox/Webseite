import React, { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';

const ToastContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`toast toast-${toast.type} slide-in`}
                        onClick={() => removeToast(toast.id)}
                    >
                        {toast.type === 'success' && <span className="toast-icon">✅</span>}
                        {toast.type === 'error' && <span className="toast-icon">❌</span>}
                        {toast.type === 'info' && <span className="toast-icon">ℹ️</span>}
                        <span className="toast-message">{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
