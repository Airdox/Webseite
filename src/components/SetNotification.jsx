import React, { useState, useEffect } from 'react';
import { sets } from '../data/musicSets';
import './SetNotification.css';
import { t } from '../utils/i18n';
import { buildSetAnchorId, buildSetHash, scrollToSetAnchor } from '../lib/set-links';

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

    const openLatestSet = () => {
        const targetId = buildSetAnchorId(latestSet.id);
        window.history.replaceState(null, '', buildSetHash(latestSet.id));
        scrollToSetAnchor(targetId, { behavior: 'smooth' });
        const analytics = window.airdoxAnalyticsV2 || window.airdoxAnalytics;
        analytics?.trackInteraction?.('notification_latest_set', 'notification', 'click');
        setVisible(false);
    };

    return (
        <div className="set-notification">
            <div className="set-notification-content">
                <button
                    type="button"
                    className="set-notification-main"
                    onClick={openLatestSet}
                    aria-label={`${t('notification.openLatest')} ${latestSet.title}`}
                >
                    <div className="set-icon">♪</div>
                    <div className="set-info">
                        <div className="set-badge">{t('notification.badge')}</div>
                        <div className="set-title">{latestSet.title}</div>
                        <div className="set-date">{latestSet.date}</div>
                    </div>
                </button>
                <button type="button" className="set-close" onClick={() => setVisible(false)} aria-label={t('notification.close')}>×</button>
            </div>
        </div>
    );
};

export default SetNotification;
