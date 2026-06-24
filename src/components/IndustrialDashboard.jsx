/**
 * AIRDOX – STARK TRANSMITTER v3
 * Immersives Full-Screen Erlebnis. Keine Boxen. Keine Cards.
 * Phosphor-Oszilloskop · Vertikale VU-Säule · Typografie-driven.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
    Check, Share2, Lock, LogOut, Send, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { t, getCurrentLocale } from '../utils/i18n';
import { sets } from '../data/musicSets';
import { partitionSetsByAccess } from '../lib/set-access';
import { getSeekableTracks, parseTrackTimeToSeconds } from '../utils/timeUtils';
import { statsSync } from '../utils/stats-sync';
import { audienceEvents } from '../utils/audienceSignals';
import { requireApiJson, requestApiJson } from '../utils/apiClient';
import { buildSetShareUrl } from '../lib/set-links';
import {
    getStorageItem, readStorageJson, removeStorageItem,
    dispatchWindowEvent, STORAGE_KEYS, WINDOW_EVENTS, writeStorageJson
} from '../utils/websiteContracts';
import './IndustrialDashboard.css';

// ─── Helpers ──────────────────────────────────────────────────────
const { publicSets, vipSets } = partitionSetsByAccess(sets);
const FEATURED_ID = 'recording_2026_05_24';
const readGlobalStats = () => readStorageJson(STORAGE_KEYS.globalStats, {});
const readUserVotes   = () => readStorageJson(STORAGE_KEYS.userVotes, {});
const sumPlays = (s = {}) => Object.values(s || {}).reduce((a, r) => a + (Number(r?.plays) || 0), 0);
const fmt  = (v) => new Intl.NumberFormat('de-DE').format(Number(v) || 0);
const fmtT = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
};

const TELEMETRY = [
    'BPM_SYNC: DECK DEVIATION LOCKED 0.02%',
    'SIGNAL_STREAM: BITRATE 320KBPS OK',
    'LATENCY: BUFFER 2048 SAMPLES',
    'SYS: DB CONNECTION STABLE',
    'PEAK: GAIN ADJUSTED -0.5dB',
    'MATRIX: SEQUENCER RACK ONLINE',
    'AUDIENCE: ACTIVE LISTENERS CAPTURED',
    'FREQ: LOW-END 60–120Hz NOMINAL',
    'DSP: COMPRESSOR 4:1 APPLIED',
    'CLOCK: MASTER TEMPO GRID CALIBRATED',
];

// VU constants
const VU_W    = 42;   // canvas px
const VU_SEG  = 22;
const VU_GAP  = 2;

// ─── Canvas draw ──────────────────────────────────────────────────
function drawFrame(ctx, canvas, analyserRef, isPlaying, currentTime) {
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ── VU Meter (left strip) ──────────────────────────────────
    const chH = (canvas.height - 12) / 2;
    const segH = (chH - (VU_SEG * VU_GAP)) / VU_SEG;

    [0, 1].forEach((ch) => {
        const rawLevel = isPlaying
            ? (ch === 0
                ? 11 + Math.sin(currentTime * 7.8 + 0.3) * 7
                : 10 + Math.cos(currentTime * 8.9 + 1.1) * 7)
            : 0;
        const level = Math.max(0, Math.min(VU_SEG, Math.floor(rawLevel)));
        const yOff  = ch === 0 ? 6 : chH + 6;

        for (let i = 0; i < VU_SEG; i++) {
            const segIdx = VU_SEG - 1 - i; // 0 = bottom
            const active = segIdx < level;
            const y = yOff + i * (segH + VU_GAP);
            let col;
            if (segIdx < Math.floor(VU_SEG * 0.6))        col = active ? '#00ff88' : '#030d06';
            else if (segIdx < Math.floor(VU_SEG * 0.82))  col = active ? '#fbbf24' : '#0d0a00';
            else                                           col = active ? '#ff5500' : '#0d0400';

            ctx.fillStyle = col;
            ctx.shadowColor = active ? col : 'transparent';
            ctx.shadowBlur  = active ? 5 : 0;
            ctx.fillRect(4, y, VU_W - 8, Math.max(1, segH));
        }
    });

    ctx.shadowBlur = 0;

    // ── Oscilloscope (remainder of canvas) ────────────────────
    const x0 = VU_W + 16;
    const cW  = canvas.width - x0 - 8;
    const cy  = canvas.height / 2;
    const amp = canvas.height * 0.4;

    if (!isPlaying || !analyserRef.current) {
        // Gentle static sine
        ctx.strokeStyle = 'rgba(255,85,0,0.10)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        for (let x = 0; x <= cW; x++) {
            const y = cy + Math.sin((x / cW) * Math.PI * 4) * 6;
            x === 0 ? ctx.moveTo(x0 + x, y) : ctx.lineTo(x0 + x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        return;
    }

    const bufLen = analyserRef.current.frequencyBinCount;
    const data   = new Uint8Array(bufLen);
    analyserRef.current.getByteTimeDomainData(data);
    const sw = cW / bufLen;

    // Wide glow pass
    ctx.save();
    ctx.shadowColor = '#ff5500';
    ctx.shadowBlur  = 28;
    ctx.lineWidth   = 3;
    ctx.strokeStyle = 'rgba(255,85,0,0.18)';
    ctx.beginPath();
    for (let i = 0; i < bufLen; i++) {
        const y = cy + ((data[i] / 128.0) - 1) * amp;
        i === 0 ? ctx.moveTo(x0 + i * sw, y) : ctx.lineTo(x0 + i * sw, y);
    }
    ctx.stroke();
    ctx.restore();

    // Mid glow pass
    ctx.save();
    ctx.shadowColor = '#ff6622';
    ctx.shadowBlur  = 12;
    ctx.lineWidth   = 2;
    ctx.strokeStyle = 'rgba(255,102,34,0.55)';
    ctx.beginPath();
    for (let i = 0; i < bufLen; i++) {
        const y = cy + ((data[i] / 128.0) - 1) * amp;
        i === 0 ? ctx.moveTo(x0 + i * sw, y) : ctx.lineTo(x0 + i * sw, y);
    }
    ctx.stroke();
    ctx.restore();

    // Sharp crisp line
    ctx.shadowBlur  = 0;
    ctx.lineWidth   = 1.2;
    ctx.strokeStyle = '#ffaa66';
    ctx.beginPath();
    for (let i = 0; i < bufLen; i++) {
        const y = cy + ((data[i] / 128.0) - 1) * amp;
        i === 0 ? ctx.moveTo(x0 + i * sw, y) : ctx.lineTo(x0 + i * sw, y);
    }
    ctx.stroke();
}

// ─── Component ────────────────────────────────────────────────────
const IndustrialDashboard = ({
    onOpenAuth = () => {},
    theme = 'dark',
    onToggleTheme = () => {},
    designMode = 'industrial',
    onToggleDesignMode = () => {},
}) => {
    const {
        analyserRef, currentTrack, isPlaying, currentTime, duration,
        playTrack, togglePlay, seek, next, previous, volume, changeVolume,
        setPlaylist,
    } = useAudio();

    const [activeSection, setActiveSection] = useState('sets');
    const [fadingOut, setFadingOut]         = useState(false);
    const [expandedSets, setExpandedSets]   = useState(new Set());
    const [copiedSetId, setCopiedSetId]     = useState(null);
    const [globalStats, setGlobalStats]     = useState(readGlobalStats);
    const [userVotes,   setUserVotes]       = useState(readUserVotes);
    const [totalPlays,  setTotalPlays]      = useState(0);
    const [telemetry,   setTelemetry]       = useState([
        'STARK_OS v2.0 ONLINE', 'SYSTEM NOMINAL', 'READY'
    ]);
    const [toast, setToast] = useState(null);

    // Newsletter
    const [nlEmail, setNlEmail]   = useState('');
    const [nlStatus, setNlStatus] = useState('idle');

    // Booking
    const [bk, setBk] = useState({ name:'', email:'', event:'', message:'' });
    const [bkContext, setBkContext] = useState(null);
    const [bkStatus,  setBkStatus] = useState('idle');
    const [bkError,   setBkError]  = useState('');

    // VIP
    const [vipUser,     setVipUser]     = useState(null);
    const [vipChecking, setVipChecking] = useState(false);

    const canvasRef    = useRef(null);
    const animRef      = useRef(null);
    const telRef       = useRef(null);
    const currentLocale = getCurrentLocale();
    const featuredSet   = publicSets.find(s => s.id === FEATURED_ID) || publicSets[0];
    const seekPct       = currentTrack && duration ? Math.min(100, (currentTime / duration) * 100) : 0;

    // ── Init ──────────────────────────────────────────────────
    useEffect(() => { setPlaylist(publicSets); }, [setPlaylist]);

    useEffect(() => {
        const h = e => { setGlobalStats(e.detail); setTotalPlays(sumPlays(e.detail)); };
        window.addEventListener(WINDOW_EVENTS.statsUpdated, h);
        void statsSync.fetchAllStats().then(s => { setGlobalStats(s); setTotalPlays(sumPlays(s)); });
        return () => window.removeEventListener(WINDOW_EVENTS.statsUpdated, h);
    }, []);

    useEffect(() => {
        const id = setInterval(() => {
            const line = TELEMETRY[Math.floor(Math.random() * TELEMETRY.length)];
            const ts   = new Date().toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
            setTelemetry(p => { const n = [...p, `[${ts}] ${line}`]; return n.length > 10 ? n.slice(-10) : n; });
        }, 5000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (telRef.current) telRef.current.scrollTop = telRef.current.scrollHeight;
    }, [telemetry]);

    useEffect(() => {
        const h = e => {
            const { event, message, setId, setTitle } = e.detail || {};
            setBk(f => ({ ...f, event: event||'', message: message||'' }));
            setBkContext({ setId, setTitle });
            navigateTo('booking');
        };
        window.addEventListener(WINDOW_EVENTS.bookingPrefill, h);
        return () => window.removeEventListener(WINDOW_EVENTS.bookingPrefill, h);
    }, []);

    // VIP auth
    const validateToken = useCallback(async token => {
        setVipChecking(true);
        try {
            const { response, data } = await requestApiJson('/api/auth', { method:'POST', body:{ action:'validate', token }});
            if (response.ok && data.ok) setVipUser(data.user);
            else { removeStorageItem(STORAGE_KEYS.authToken); setVipUser(null); }
        } catch { setVipUser(null); }
        finally { setVipChecking(false); }
    }, []);

    useEffect(() => {
        const check = () => {
            const t = getStorageItem(STORAGE_KEYS.authToken, '');
            if (t) validateToken(t); else setVipUser(null);
        };
        check();
        window.addEventListener(WINDOW_EVENTS.loginSuccess, check);
        window.addEventListener(WINDOW_EVENTS.logout, check);
        return () => {
            window.removeEventListener(WINDOW_EVENTS.loginSuccess, check);
            window.removeEventListener(WINDOW_EVENTS.logout, check);
        };
    }, [validateToken]);

    // Keyboard
    useEffect(() => {
        const h = e => {
            if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)) return;
            if (e.code === 'Space')      { e.preventDefault(); togglePlay(); }
            if (e.code === 'ArrowRight') { e.preventDefault(); seek(Math.min(duration, currentTime + 10)); }
            if (e.code === 'ArrowLeft')  { e.preventDefault(); seek(Math.max(0, currentTime - 10)); }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [togglePlay, seek, currentTime, duration]);

    // Section tracking
    useEffect(() => {
        audienceEvents.routeView({ route:`/stark/${activeSection}`, contentType:'dashboard_tab', source:'nav', value:1 });
    }, [activeSection]);

    // ── Canvas ────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            if (!canvas.parentElement) return;
            canvas.width  = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        };
        resize();
        const ro = new ResizeObserver(resize);
        if (canvas.parentElement) ro.observe(canvas.parentElement);

        const loop = () => {
            animRef.current = requestAnimationFrame(loop);
            drawFrame(ctx, canvas, analyserRef, isPlaying, currentTime);
        };
        loop();

        return () => {
            ro.disconnect();
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [analyserRef, isPlaying, currentTime]);

    // ── Handlers ──────────────────────────────────────────────
    const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const navigateTo = section => {
        if (section === activeSection) return;
        setFadingOut(true);
        setTimeout(() => { setActiveSection(section); setFadingOut(false); }, 180);
    };

    const handlePlaySet = set => {
        if (currentTrack?.id === set.id) { togglePlay(); return; }
        playTrack(set);
        showToast(`▶ ${set.title}`);
    };

    const handleTrackClick = (set, track) => {
        const s = parseTrackTimeToSeconds(track.time);
        if (s === null) return;
        if (currentTrack?.id !== set.id) playTrack(set, true, s);
        else seek(s);
    };

    const handleVote = (setId, voteType) => {
        const cur = userVotes[setId];
        const typeToSend = cur === voteType ? `un${voteType}` : voteType;
        if (cur === voteType) {
            const nv = { ...userVotes }; delete nv[setId];
            setUserVotes(nv); writeStorageJson(STORAGE_KEYS.userVotes, nv);
        } else {
            if (cur) statsSync.trackVote(setId, `un${cur}`);
            const nv = { ...userVotes, [setId]: voteType };
            setUserVotes(nv); writeStorageJson(STORAGE_KEYS.userVotes, nv);
        }
        setGlobalStats(prev => ({
            ...prev,
            [setId]: {
                ...prev[setId],
                [voteType === 'like' ? 'likes' : 'dislikes']:
                    (prev[setId]?.[voteType === 'like' ? 'likes' : 'dislikes'] || 0) + 1
            }
        }));
        statsSync.trackVote(setId, typeToSend);
    };

    const handleShare = async (e, set) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(buildSetShareUrl(set.id));
            setCopiedSetId(set.id);
            setTimeout(() => setCopiedSetId(null), 2200);
            showToast('Link kopiert');
        } catch { /* ignore */ }
    };

    const toggleTracklist = id => {
        setExpandedSets(p => {
            const n = new Set(p);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const getStats = id => globalStats[id] || { plays:0, likes:0, dislikes:0 };

    const handleSeekClick = e => {
        if (!duration) return;
        const r = e.currentTarget.getBoundingClientRect();
        seek(((e.clientX - r.left) / r.width) * duration);
    };

    const handleNl = async e => {
        e.preventDefault();
        setNlStatus('loading');
        try {
            await requireApiJson('/api/subscribe', { method:'POST', body:{ email:nlEmail }}, t('newsletter.subscriptionFailed'));
            setNlStatus('success'); setNlEmail('');
            showToast(t('music.engagementNewsletter.success'));
        } catch { setNlStatus('error'); }
    };

    const handleBk = async e => {
        e.preventDefault();
        setBkStatus('loading'); setBkError('');
        try {
            await requireApiJson('/api/booking', { method:'POST', body:{ ...bk, source:'stark_transmitter', ...bkContext }}, t('booking.sendError'));
            setBkStatus('success');
            setBk({ name:'', email:'', event:'', message:'' });
            setBkContext(null);
        } catch (err) { setBkStatus('error'); setBkError(err.message || t('booking.sendError')); }
    };

    const handleLogout = () => {
        removeStorageItem(STORAGE_KEYS.authToken);
        setVipUser(null);
        dispatchWindowEvent(WINDOW_EVENTS.logout);
    };

    const NAV = [
        { id:'sets',    label:'SETS'    },
        { id:'profile', label:'PROFIL'  },
        { id:'booking', label:'BOOKING' },
        { id:'press',   label:'PRESS'   },
        { id:'vip',     label:'VIP'     },
    ];

    // ─── Render ────────────────────────────────────────────────
    return (
        <div className="tx-app" data-theme={theme}>

            {/* Grain overlay */}
            <div className="tx-grain" aria-hidden="true" />

            {/* Toast */}
            {toast && (
                <div className="tx-toast">
                    <span>{toast}</span>
                    <button type="button" onClick={() => setToast(null)}><X size={11} /></button>
                </div>
            )}

            {/* ══════════════════════════════════════════════════
                TOPBAR
            ════════════════════════════════════════════════════ */}
            <header className="tx-topbar">
                <div className="tx-brand">
                    <span className="tx-logo">AIRDOX</span>
                    <span className={`tx-status ${isPlaying ? 'tx-status--on' : ''}`}>
                        <span className="tx-led" />
                        {isPlaying ? 'TRANSMITTING' : 'STANDBY'}
                    </span>
                </div>

                <nav className="tx-nav" role="navigation">
                    {NAV.map(({ id, label }) => (
                        <button
                            key={id}
                            type="button"
                            className={`tx-nav-item ${activeSection === id ? 'tx-nav-item--on' : ''}`}
                            onClick={() => navigateTo(id)}
                        >{label}</button>
                    ))}
                </nav>

                <div className="tx-controls">
                    <div className="tx-design-switch">
                        <button type="button"
                            className={`tx-dsw-btn ${designMode === 'classic' ? 'active' : ''}`}
                            onClick={() => onToggleDesignMode('classic')}>CLASSIC</button>
                        <span className="tx-dsw-sep">/</span>
                        <button type="button"
                            className={`tx-dsw-btn ${designMode === 'industrial' ? 'active' : ''}`}
                            onClick={() => onToggleDesignMode('industrial')}>STARK</button>
                    </div>
                    <button type="button" className="tx-icon-btn" onClick={onToggleTheme}>
                        {theme === 'light' ? '◐' : '○'}
                    </button>
                    <div className="tx-lang">
                        <a href="/"    className={currentLocale === 'de' ? 'on' : ''}>DE</a>
                        <span>/</span>
                        <a href="/en/" className={currentLocale === 'en' ? 'on' : ''}>EN</a>
                    </div>
                </div>
            </header>

            {/* ══════════════════════════════════════════════════
                OSCILLOSCOPE HERO – FULL WIDTH
            ════════════════════════════════════════════════════ */}
            <div className="tx-hero">
                <canvas ref={canvasRef} className="tx-canvas" />
                <div className="tx-hero-track">
                    {currentTrack ? (
                        <>
                            <span className="tx-hero-label">NOW PLAYING</span>
                            <h2 className="tx-hero-title">{currentTrack.title}</h2>
                            <span className="tx-hero-meta">AIRDOX · {currentTrack.date}</span>
                        </>
                    ) : (
                        <span className="tx-hero-label">SELECT A SET TO BEGIN TRANSMISSION</span>
                    )}
                </div>
                {/* Telemetry overlay bottom-right */}
                <div className="tx-tel" ref={telRef}>
                    {telemetry.map((l, i) => <div key={i} className="tx-tel-line">{l}</div>)}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                CONTENT ZONE
            ════════════════════════════════════════════════════ */}
            <div className="tx-body">
                <div className={`tx-section ${fadingOut ? 'tx-section--out' : ''}`}>

                    {/* ── SETS ───────────────────────────────── */}
                    {activeSection === 'sets' && (
                        <div className="tx-sets-layout">
                            <div className="tx-sets-list">
                                {publicSets.map((set, idx) => {
                                    const stats   = getStats(set.id);
                                    const vote    = userVotes[set.id];
                                    const exp     = expandedSets.has(set.id);
                                    const isCur   = currentTrack?.id === set.id;
                                    const playing = isCur && isPlaying;
                                    const tracks  = getSeekableTracks(set.tracks);

                                    return (
                                        <div key={set.id} className={`tx-entry ${isCur ? 'tx-entry--active' : ''}`}>
                                            <span className="tx-entry-num">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>

                                            <div className="tx-entry-body">
                                                <div className="tx-entry-row">
                                                    <div className="tx-entry-info">
                                                        {isCur && <span className="tx-pulse" />}
                                                        <div>
                                                            <div className="tx-entry-title">{set.title}</div>
                                                            <div className="tx-entry-meta">
                                                                {set.date}{set.duration ? ` · ${set.duration}` : ''}
                                                                <span className="tx-entry-plays"> · ▶ {fmt(stats.plays)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="tx-entry-actions">
                                                        <button type="button" className="tx-act-btn" onClick={() => handlePlaySet(set)}>
                                                            {playing ? <Pause size={14} /> : <Play size={14} />}
                                                        </button>
                                                        <button type="button" className="tx-act-btn" onClick={e => handleShare(e, set)}>
                                                            {copiedSetId === set.id ? <Check size={13} /> : <Share2 size={13} />}
                                                        </button>
                                                        <button type="button"
                                                            className={`tx-vote-btn ${vote === 'like' ? 'on' : ''}`}
                                                            onClick={() => handleVote(set.id, 'like')}>
                                                            ▲ {fmt(stats.likes)}
                                                        </button>
                                                        <button type="button"
                                                            className={`tx-vote-btn ${vote === 'dislike' ? 'on' : ''}`}
                                                            onClick={() => handleVote(set.id, 'dislike')}>
                                                            ▼ {fmt(stats.dislikes)}
                                                        </button>
                                                    </div>
                                                </div>

                                                {tracks.length > 0 && (
                                                    <>
                                                        <button type="button" className="tx-tracklist-toggle" onClick={() => toggleTracklist(set.id)}>
                                                            <span>TRACKLIST ({tracks.length})</span>
                                                            {exp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                        </button>
                                                        {exp && (
                                                            <div className="tx-tracklist">
                                                                {tracks.map((track, ti) => {
                                                                    const tSec = parseTrackTimeToSeconds(track.time);
                                                                    const isActive = isCur && tSec !== null && currentTime >= tSec &&
                                                                        (ti === tracks.length - 1 || currentTime < parseTrackTimeToSeconds(tracks[ti + 1]?.time));
                                                                    return (
                                                                        <div key={ti}
                                                                            className={`tx-track ${isActive ? 'tx-track--on' : ''}`}
                                                                            onClick={() => handleTrackClick(set, track)}
                                                                            role="button" tabIndex={0}>
                                                                            <span className="tx-track-t">{track.time}</span>
                                                                            <span>{track.artist} – {track.title}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Newsletter sidebar */}
                            <div className="tx-nl">
                                <div className="tx-nl-heading">SIGNAL_LIST</div>
                                <p className="tx-nl-sub">{t('newsletter.description')}</p>
                                <form onSubmit={handleNl} className="tx-nl-form">
                                    <input type="email" className="tx-input tx-input--line"
                                        placeholder={t('newsletter.emailPlaceholder')}
                                        value={nlEmail} onChange={e => setNlEmail(e.target.value)} required />
                                    <button type="submit" className="tx-submit-btn" disabled={nlStatus === 'loading'}>
                                        <Send size={13} />
                                    </button>
                                </form>
                                {nlStatus === 'success' && <p className="tx-ok">✓ SUBSCRIBED</p>}
                                {nlStatus === 'error'   && <p className="tx-err">ERR: RETRY</p>}

                                <div className="tx-nl-stats">
                                    <div className="tx-stat">
                                        <span className="tx-stat-n">{sets.length}</span>
                                        <span className="tx-stat-l">SETS</span>
                                    </div>
                                    <div className="tx-stat">
                                        <span className="tx-stat-n">{fmt(totalPlays)}</span>
                                        <span className="tx-stat-l">PLAYS</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PROFILE ────────────────────────────── */}
                    {activeSection === 'profile' && (
                        <div className="tx-profile">
                            <div className="tx-profile-hero">
                                <div className="tx-profile-name">AIRDOX</div>
                                <p className="tx-profile-tagline">BERLIN · TECHNO · INDUSTRIAL · UNDERGROUND</p>
                            </div>

                            <div className="tx-profile-grid">
                                <div className="tx-profile-bio">
                                    <p>{t('bio.intro')}</p>
                                    <p>{t('bio.body1')}</p>
                                    <p><strong>{t('bio.heading1')}</strong><br />{t('bio.body2')}</p>
                                    <p>{t('bio.body3')}</p>
                                    <p><strong>{t('bio.heading2')}</strong><br />{t('bio.body4')}</p>
                                </div>

                                <div className="tx-profile-aside">
                                    <div className="tx-p-stats">
                                        {[
                                            { v: sets.length,       l: t('bio.stats.liveSets') },
                                            { v: fmt(totalPlays),   l: t('bio.stats.listeners') },
                                            { v: 'BERLIN',          l: t('bio.stats.based') },
                                            { v: '2014',            l: 'SINCE' },
                                        ].map(({ v, l }) => (
                                            <div key={l} className="tx-p-stat">
                                                <span className="tx-p-stat-n">{v}</span>
                                                <span className="tx-p-stat-l">{l}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="tx-p-links">
                                        <a href="https://ra.co/dj/airdox" target="_blank" rel="noopener noreferrer" className="tx-p-link">
                                            Resident Advisor <span>→</span>
                                        </a>
                                        <a href="https://soundcloud.com/airdox" target="_blank" rel="noopener noreferrer" className="tx-p-link">
                                            SoundCloud <span>→</span>
                                        </a>
                                        <a href="https://instagram.com/airdox_music" target="_blank" rel="noopener noreferrer" className="tx-p-link">
                                            Instagram <span>→</span>
                                        </a>
                                        <a href="mailto:airdox82@gmail.com" className="tx-p-link">
                                            airdox82@gmail.com <span>→</span>
                                        </a>
                                    </div>

                                    <div className="tx-p-tags">
                                        {['Techno', 'Industrial', 'Dark', 'Hypnotic', 'Underground', 'Berlin'].map(tag => (
                                            <span key={tag} className="tx-tag">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── BOOKING ────────────────────────────── */}
                    {activeSection === 'booking' && (
                        <div className="tx-booking">
                            <div className="tx-booking-head">
                                <div className="tx-section-label">EVENT_BOOKING_TRANSMISSION</div>
                                <h2 className="tx-section-title">{t('booking.title')}</h2>
                                <p className="tx-section-sub">{t('booking.subtitle')}</p>
                            </div>

                            {bkStatus === 'success' ? (
                                <div className="tx-success">
                                    <div className="tx-success-mark">✓</div>
                                    <p>{t('booking.successBody')}</p>
                                    <button type="button" className="tx-text-btn" onClick={() => setBkStatus('idle')}>
                                        {t('booking.newMessage')} →
                                    </button>
                                </div>
                            ) : (
                                <div className="tx-booking-body">
                                    <div className="tx-booking-info">
                                        <div className="tx-bk-item">
                                            <span className="tx-bk-key">EMAIL</span>
                                            <a href="mailto:airdox82@gmail.com" className="tx-bk-val link">airdox82@gmail.com</a>
                                        </div>
                                        <div className="tx-bk-item">
                                            <span className="tx-bk-key">BASE</span>
                                            <span className="tx-bk-val">{t('booking.basedValue')}</span>
                                        </div>
                                        <div className="tx-bk-item">
                                            <span className="tx-bk-key">RESPONSE</span>
                                            <span className="tx-bk-val">24–48h</span>
                                        </div>
                                        <div className="tx-bk-item">
                                            <span className="tx-bk-key">FORMAT</span>
                                            <span className="tx-bk-val">Clubs · Festivals · Events</span>
                                        </div>
                                    </div>

                                    <form className="tx-terminal" onSubmit={handleBk}>
                                        {bkContext?.setTitle && (
                                            <div className="tx-term-context">RE: {bkContext.setTitle}</div>
                                        )}
                                        {bkError && <div className="tx-term-err">{bkError}</div>}

                                        {[
                                            { key:'name',    label:'NAME',    type:'text',  req:true  },
                                            { key:'email',   label:'EMAIL',   type:'email', req:true  },
                                            { key:'event',   label:'EVENT',   type:'text',  req:false },
                                        ].map(({ key, label, type, req }) => (
                                            <div key={key} className="tx-term-field">
                                                <span className="tx-term-key">{label}</span>
                                                <span className="tx-term-prompt">›</span>
                                                <input type={type} className="tx-term-input" required={req}
                                                    value={bk[key]}
                                                    onChange={e => setBk(f => ({ ...f, [key]: e.target.value }))} />
                                            </div>
                                        ))}

                                        <div className="tx-term-field tx-term-field--ta">
                                            <span className="tx-term-key">MSG</span>
                                            <span className="tx-term-prompt">›</span>
                                            <textarea className="tx-term-input" rows="4" required
                                                value={bk.message}
                                                onChange={e => setBk(f => ({ ...f, message: e.target.value }))} />
                                        </div>

                                        <button type="submit" className="tx-term-submit" disabled={bkStatus === 'loading'}>
                                            <Send size={14} />
                                            {bkStatus === 'loading' ? 'TRANSMITTING...' : 'TRANSMIT →'}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── PRESS ──────────────────────────────── */}
                    {activeSection === 'press' && (
                        <div className="tx-press">
                            <div className="tx-section-label">DIGITAL_EPK</div>
                            <h2 className="tx-section-title">{t('epk.title')}</h2>
                            <p className="tx-section-sub">{t('epk.subtitle')}</p>

                            <div className="tx-press-list">
                                {[
                                    { num:'01', title:t('epk.pressPhotosTitle'), desc:t('epk.pressPhotosText'), href:'/epk/press-assets', cta:t('epk.openAssetInfo') },
                                    { num:'02', title:t('epk.riderTitle'),       desc:t('epk.riderText'),       href:'/epk/airdox-epk.pdf', cta:t('epk.downloadPdf') },
                                    { num:'03', title:'Biography (DE/EN)',        desc:'Press-ready biography for publications and festival programs.', href:'/epk/airdox-bio.pdf', cta:'DOWNLOAD PDF' },
                                    { num:'04', title:'Press Contact',            desc:'Interview requests, feature articles, editorial content.', href:'mailto:airdox82@gmail.com', cta:'airdox82@gmail.com' },
                                ].map(({ num, title, desc, href, cta }) => (
                                    <div key={num} className="tx-press-entry">
                                        <span className="tx-press-num">{num}</span>
                                        <div className="tx-press-body">
                                            <div className="tx-press-title">{title}</div>
                                            <p className="tx-press-desc">{desc}</p>
                                        </div>
                                        <a href={href} target="_blank" rel="noopener noreferrer" className="tx-press-cta">
                                            {cta} →
                                        </a>
                                    </div>
                                ))}
                            </div>

                            <p className="tx-press-footer">{t('epk.footer')}</p>
                        </div>
                    )}

                    {/* ── VIP ────────────────────────────────── */}
                    {activeSection === 'vip' && (
                        <div className="tx-vip">
                            {!vipUser ? (
                                <div className="tx-vip-gate">
                                    <Lock size={36} className="tx-vip-lock" />
                                    <div className="tx-section-label">SECURE_ARCHIVE</div>
                                    <h2 className="tx-section-title">{t('vip.archiveTitle')}</h2>
                                    <p className="tx-section-sub">{t('vip.gateSubtitle')}</p>
                                    <p className="tx-vip-hint">
                                        {vipChecking ? t('vip.sessionChecking') : `${vipSets.length} ${t('vip.setsWaiting')}`}
                                    </p>
                                    <div className="tx-vip-actions">
                                        <button type="button" className="tx-term-submit" onClick={() => onOpenAuth('login')}>
                                            {t('nav.login')} →
                                        </button>
                                        <button type="button" className="tx-text-btn" onClick={() => onOpenAuth('register')}>
                                            {t('nav.register')} →
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="tx-vip-content">
                                    <div className="tx-vip-header">
                                        <div>
                                            <div className="tx-section-label">MEMBERS_ARCHIVE</div>
                                            <h2 className="tx-section-title">{t('vip.welcome')}, {vipUser.username}</h2>
                                        </div>
                                        <button type="button" className="tx-logout-btn" onClick={handleLogout}>
                                            <LogOut size={13} /> LOGOUT
                                        </button>
                                    </div>
                                    <p className="tx-section-sub">{t('vip.memberSubtitle')}</p>

                                    <div className="tx-vip-sets">
                                        {vipSets.map((set, idx) => {
                                            const isCur   = currentTrack?.id === set.id;
                                            const playing = isCur && isPlaying;
                                            return (
                                                <div key={set.id} className={`tx-entry ${isCur ? 'tx-entry--active' : ''}`}>
                                                    <span className="tx-entry-num">{String(idx+1).padStart(2,'0')}</span>
                                                    <div className="tx-entry-body">
                                                        <div className="tx-entry-row">
                                                            <div className="tx-entry-info">
                                                                <div>
                                                                    <div className="tx-entry-title">{set.title}</div>
                                                                    <div className="tx-entry-meta">{set.date}</div>
                                                                </div>
                                                            </div>
                                                            <button type="button" className="tx-act-btn" onClick={() => handlePlaySet(set)}>
                                                                {playing ? <Pause size={14} /> : <Play size={14} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* ══════════════════════════════════════════════════
                BOTTOM PLAYER BAR
            ════════════════════════════════════════════════════ */}
            <div className="tx-player">
                {/* Progress line */}
                <div className="tx-progress" onClick={handleSeekClick} role="slider" aria-valuenow={seekPct} aria-label="seek">
                    <div className="tx-progress-fill" style={{ width: `${seekPct}%` }} />
                </div>

                <div className="tx-player-inner">
                    <div className="tx-player-track">
                        {currentTrack ? (
                            <>
                                <span className="tx-player-title">{currentTrack.title}</span>
                                <span className="tx-player-artist">AIRDOX · {currentTrack.date}</span>
                            </>
                        ) : (
                            <span className="tx-player-idle">NO SIGNAL</span>
                        )}
                    </div>

                    <div className="tx-player-controls">
                        <button type="button" className="tx-ctrl" onClick={previous} disabled={!currentTrack}><SkipBack size={15} /></button>
                        <button type="button" className="tx-ctrl tx-ctrl--play" onClick={togglePlay} disabled={!currentTrack}>
                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button type="button" className="tx-ctrl" onClick={next} disabled={!currentTrack}><SkipForward size={15} /></button>
                    </div>

                    <div className="tx-player-right">
                        <span className="tx-player-time">{fmtT(currentTime)} / {fmtT(duration)}</span>
                        <button type="button" className="tx-vol-icon" onClick={() => changeVolume(volume > 0 ? 0 : 0.8)}>
                            {volume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
                        </button>
                        <input type="range" min="0" max="1" step="0.01" value={volume}
                            onChange={e => changeVolume(Number(e.target.value))}
                            className="tx-vol" aria-label="Volume" />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default IndustrialDashboard;
