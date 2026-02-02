import React, { useState, useEffect } from 'react';
import { sets } from '../data/musicSets';
import './SetNotification.css';

const SetNotification = () => {
    const [visible, setVisible] = useState(false);
    const latestSet = sets.find(s => s.isNew) || sets[0];

    useEffect(() => {
        const showTimer = setTimeout(() => setVisible(true), 2000);
        const hideTimer = setTimeout(() => setVisible(false), 12000);
        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    if (!visible) return null;

    return (
        <div className="set-notification">
            <div className="set-notification-content">
                <div className="set-icon">🎵</div>
                <div className="set-info">
                    <div className="set-badge">NEW TRANSMISSION</div>
                    <div className="set-title">{latestSet.title}</div>
                    <div className="set-date">{latestSet.date}</div>
                </div>
                <button className="set-close" onClick={() => setVisible(false)}>×</button>
            </div>
        </div>
    );
};

export default SetNotification;
