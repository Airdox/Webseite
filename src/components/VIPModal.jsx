import React from 'react';
import { partitionSetsByAccess } from '../lib/set-access';
import { sets } from '../data/musicSets';
import './VIPModal.css';

const { vipSets } = partitionSetsByAccess(sets);

const VIPModal = ({ isOpen, onClose, onOpenAuth }) => {
    if (!isOpen) return null;

    return (
        <div className={`vip-modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="vip-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="vip-modal-close" onClick={onClose} aria-label="Schließen">
                    &times;
                </button>
                
                <div className="vip-modal-header">
                    <span className="section-label">VIP ACCESS</span>
                    <h2 className="vip-modal-title">ARCHIVE ZUGANG</h2>
                </div>

                <p className="vip-modal-text">
                    Die aelteren Sets liegen im VIP-Bereich fuer alle, die nicht genug bekommen. 
                    Werde Teil der Community und erhalte Zugriff auf das gesamte Archiv.
                </p>

                <div className="vip-modal-actions">
                    <button 
                        type="button" 
                        className="btn btn-outline" 
                        onClick={() => {
                            onOpenAuth('login');
                            onClose();
                        }}
                    >
                        LOGIN
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-primary" 
                        onClick={() => {
                            onOpenAuth('register');
                            onClose();
                        }}
                    >
                        REGISTER
                    </button>
                </div>

                <p className="vip-modal-hint">
                    {vipSets.length} VIP-Sets warten im Archiv.
                </p>
            </div>
        </div>
    );
};

export default VIPModal;
