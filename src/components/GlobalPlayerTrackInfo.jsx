import React from 'react';
import { t } from '../utils/i18n';

const GlobalPlayerTrackInfo = ({ currentTrack }) => {
    return (
        <div className="gp-track-info">
            <div className="gp-track-title" title={currentTrack?.title || ''}>
                {currentTrack?.title || t('player.noTrack')}
            </div>
            <div className="gp-track-artist">
                {t('player.artistLabel')}
            </div>
        </div>
    );
};

export default GlobalPlayerTrackInfo;
