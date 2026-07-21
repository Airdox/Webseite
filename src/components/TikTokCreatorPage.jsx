import React, { useEffect, useMemo, useState } from 'react';
import './TikTokCreatorPage.css';

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const COMPLETE_STATUSES = new Set(['PUBLISH_COMPLETE', 'FAILED']);
const PRIVACY_LABELS = {
    PUBLIC_TO_EVERYONE: 'Everyone',
    MUTUAL_FOLLOW_FRIENDS: 'Friends (followers you follow back)',
    FOLLOWER_OF_CREATOR: 'Followers',
    SELF_ONLY: 'Only me',
};

const readJson = async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
    return data;
};

const encodeUtf8Base64 = (value) => {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const TikTokCreatorPage = () => {
    const [configuration, setConfiguration] = useState(null);
    const [session, setSession] = useState({ connected: false });
    const [creator, setCreator] = useState(null);
    const [video, setVideo] = useState(null);
    const [videoDuration, setVideoDuration] = useState(0);
    const [title, setTitle] = useState('');
    const [privacy, setPrivacy] = useState('');
    const [allowComment, setAllowComment] = useState(false);
    const [allowDuet, setAllowDuet] = useState(false);
    const [allowStitch, setAllowStitch] = useState(false);
    const [commercialDisclosure, setCommercialDisclosure] = useState(false);
    const [brandOrganic, setBrandOrganic] = useState(false);
    const [brandContent, setBrandContent] = useState(false);
    const [aiGenerated, setAiGenerated] = useState(false);
    const [rightsConfirmed, setRightsConfirmed] = useState(false);
    const [musicConfirmed, setMusicConfirmed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const previewUrl = useMemo(() => (video ? URL.createObjectURL(video) : ''), [video]);

    useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

    useEffect(() => {
        let active = true;
        Promise.all([
            fetch('/api/tiktok/config').then(readJson),
            fetch('/api/tiktok/session', { credentials: 'same-origin' }).then(readJson),
        ]).then(([config, currentSession]) => {
            if (!active) return;
            setConfiguration(config);
            setSession(currentSession);
        }).catch((requestError) => {
            if (active) setError(requestError.message);
        });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!session.connected) {
            setCreator(null);
            return undefined;
        }
        let active = true;
        fetch('/api/tiktok/creator-info', { credentials: 'same-origin' })
            .then(readJson)
            .then((result) => { if (active) setCreator(result.creator); })
            .catch((requestError) => { if (active) setError(requestError.message); });
        return () => { active = false; };
    }, [session.connected]);

    const chooseVideo = (event) => {
        const selected = event.target.files?.[0] || null;
        setMessage('');
        setError('');
        setVideoDuration(0);
        if (selected && selected.size > MAX_VIDEO_BYTES) {
            setVideo(null);
            setError('The selected video is larger than 50 MB.');
            return;
        }
        setVideo(selected);
    };

    const onPreviewMetadata = (event) => {
        const duration = Number(event.currentTarget.duration || 0);
        setVideoDuration(duration);
        if (creator?.maxVideoPostDurationSec && duration > creator.maxVideoPostDurationSec + 0.25) {
            setError(`This TikTok account can post videos up to ${creator.maxVideoPostDurationSec} seconds.`);
        }
    };

    const pollStatus = async (publishId) => {
        for (let attempt = 0; attempt < 24; attempt += 1) {
            await wait(5000);
            const result = await fetch('/api/tiktok/publish/status', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publishId }),
            }).then(readJson);
            if (result.status === 'PUBLISH_COMPLETE') {
                setMessage('Published successfully. TikTok has completed your post.');
                return;
            }
            if (result.status === 'FAILED') throw new Error(result.failReason ? `TikTok could not publish the post: ${result.failReason}` : 'TikTok could not publish the post.');
            setMessage(`TikTok is processing your post (${result.status.toLowerCase().replaceAll('_', ' ')}). You can keep this page open.`);
            if (COMPLETE_STATUSES.has(result.status)) return;
        }
        setMessage('TikTok is still processing the post. It may take a few minutes to appear in your profile.');
    };

    const publish = async (event) => {
        event.preventDefault();
        if (!video || !creator || !privacy || !rightsConfirmed || !musicConfirmed || !videoDuration) return;
        if (commercialDisclosure && !brandOrganic && !brandContent) {
            setError('Select “Your brand” or “Branded content” for commercial content.');
            return;
        }
        setBusy(true);
        setMessage('Uploading your video to TikTok…');
        setError('');
        try {
            const result = await fetch('/api/tiktok/publish', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': video.type || 'video/mp4',
                    'X-AIRDOX-Video-Size': String(video.size),
                    'X-AIRDOX-TikTok-Title': encodeUtf8Base64(title),
                    'X-AIRDOX-TikTok-Privacy': privacy,
                    'X-AIRDOX-TikTok-Duration-Sec': String(videoDuration),
                    'X-AIRDOX-TikTok-Allow-Comment': String(allowComment),
                    'X-AIRDOX-TikTok-Allow-Duet': String(allowDuet),
                    'X-AIRDOX-TikTok-Allow-Stitch': String(allowStitch),
                    'X-AIRDOX-TikTok-Brand-Organic': String(commercialDisclosure && brandOrganic),
                    'X-AIRDOX-TikTok-Brand-Content': String(commercialDisclosure && brandContent),
                    'X-AIRDOX-TikTok-AI-Generated': String(aiGenerated),
                    'X-AIRDOX-TikTok-Rights-Confirmed': String(rightsConfirmed),
                    'X-AIRDOX-TikTok-Music-Confirmed': String(musicConfirmed),
                },
                body: video,
            }).then(readJson);
            setMessage(result.nextAction);
            await pollStatus(result.publishId);
        } catch (publishError) {
            setError(publishError.message);
        } finally {
            setBusy(false);
        }
    };

    const disconnect = async () => {
        setBusy(true);
        setMessage('');
        setError('');
        try {
            await fetch('/api/tiktok/disconnect', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
            }).then(readJson);
            setSession({ connected: false });
            setMessage('Your TikTok connection and stored authorization have been removed.');
        } catch (disconnectError) {
            setError(disconnectError.message);
        } finally {
            setBusy(false);
        }
    };

    const durationInvalid = Boolean(videoDuration && creator?.maxVideoPostDurationSec && videoDuration > creator.maxVideoPostDurationSec + 0.25);
    const commercialInvalid = commercialDisclosure && (!brandOrganic && !brandContent || brandContent && privacy === 'SELF_ONLY');
    const ready = video && videoDuration && privacy && rightsConfirmed && musicConfirmed && !durationInvalid && !commercialInvalid;

    return (
        <main className="tiktok-creator-page">
            <header className="tiktok-creator-header">
                <a className="tiktok-creator-brand" href="/">AIRDOX</a>
                <a href="/" className="tiktok-creator-home">Back to website</a>
            </header>

            <section className="tiktok-creator-hero" aria-labelledby="creator-heading">
                <p className="tiktok-creator-kicker">Public creator tool · TikTok Direct Post</p>
                <h1 id="creator-heading">Publish your video directly to TikTok</h1>
                <p>Connect your TikTok account, preview your own video, choose every post setting, and publish it to your profile with one explicit confirmation.</p>
            </section>

            <section className="tiktok-creator-steps" aria-label="How it works">
                <article><span>1</span><h2>Connect</h2><p>Authorize your basic profile and direct publishing permission.</p></article>
                <article><span>2</span><h2>Review</h2><p>Preview the video and choose caption, privacy, interactions, and disclosures.</p></article>
                <article><span>3</span><h2>Publish</h2><p>Approve this specific post; AIRDOX uploads it and tracks TikTok processing.</p></article>
            </section>

            <section className="tiktok-creator-card" aria-live="polite">
                {!configuration ? <p>Checking the TikTok connection…</p> : !configuration.enabled ? (
                    <p className="tiktok-creator-notice">The creator tool is temporarily unavailable.</p>
                ) : !session.connected ? (
                    <div>
                        <h2>Connect your TikTok account</h2>
                        <p>AIRDOX requests <strong>basic profile</strong> and <strong>direct post</strong> access. It never publishes without your per-post confirmation.</p>
                        <a className="tiktok-creator-button" href="/api/tiktok/oauth/start">Continue with TikTok</a>
                    </div>
                ) : !creator ? <p>Loading your current TikTok publishing settings…</p> : (
                    <div>
                        <div className="tiktok-creator-account">
                            {(creator.avatarUrl || session.profile?.avatarUrl) && <img src={creator.avatarUrl || session.profile.avatarUrl} alt="" />}
                            <div><small>Posting to TikTok account</small><strong>{creator.nickname}</strong>{creator.username && <span>@{creator.username}</span>}</div>
                            <button type="button" className="tiktok-creator-link-button" onClick={disconnect} disabled={busy}>Disconnect</button>
                        </div>
                        <form onSubmit={publish}>
                            <label className="tiktok-creator-file">
                                <span>Choose your video</span>
                                <input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={chooseVideo} required disabled={busy} />
                                <small>{video ? `${video.name} · ${(video.size / 1024 / 1024).toFixed(1)} MB` : `MP4, MOV, or WebM · maximum 50 MB · account duration limit ${creator.maxVideoPostDurationSec}s`}</small>
                            </label>
                            {previewUrl && <video className="tiktok-creator-preview" src={previewUrl} controls onLoadedMetadata={onPreviewMetadata} />}

                            <label className="tiktok-creator-field">
                                <span>Caption</span>
                                <textarea value={title} onChange={(event) => setTitle(event.target.value)} maxLength={2200} rows={5} placeholder="Write a caption and add hashtags" disabled={busy} />
                                <small>{title.length}/2200 characters</small>
                            </label>
                            <label className="tiktok-creator-field">
                                <span>Who can view this post?</span>
                                <select value={privacy} onChange={(event) => setPrivacy(event.target.value)} required disabled={busy}>
                                    <option value="">Choose privacy — no default</option>
                                    {creator.privacyLevelOptions.map((option) => <option key={option} value={option} disabled={option === 'SELF_ONLY' && commercialDisclosure && brandContent}>{PRIVACY_LABELS[option] || option}</option>)}
                                </select>
                                {commercialDisclosure && brandContent && privacy === 'SELF_ONLY' && <small className="tiktok-creator-inline-error">Branded content visibility cannot be set to private.</small>}
                            </label>

                            <fieldset className="tiktok-creator-fieldset">
                                <legend>Allow interactions</legend>
                                <label className="tiktok-creator-check"><input type="checkbox" checked={allowComment} onChange={(event) => setAllowComment(event.target.checked)} disabled={busy || creator.commentDisabled} /><span>Comments{creator.commentDisabled ? ' — unavailable in your TikTok settings' : ''}</span></label>
                                <label className="tiktok-creator-check"><input type="checkbox" checked={allowDuet} onChange={(event) => setAllowDuet(event.target.checked)} disabled={busy || creator.duetDisabled} /><span>Duet{creator.duetDisabled ? ' — unavailable in your TikTok settings' : ''}</span></label>
                                <label className="tiktok-creator-check"><input type="checkbox" checked={allowStitch} onChange={(event) => setAllowStitch(event.target.checked)} disabled={busy || creator.stitchDisabled} /><span>Stitch{creator.stitchDisabled ? ' — unavailable in your TikTok settings' : ''}</span></label>
                                <small>All interaction options are off by default.</small>
                            </fieldset>

                            <fieldset className="tiktok-creator-fieldset">
                                <legend>Content disclosure</legend>
                                <label className="tiktok-creator-check"><input type="checkbox" checked={commercialDisclosure} onChange={(event) => { setCommercialDisclosure(event.target.checked); if (!event.target.checked) { setBrandOrganic(false); setBrandContent(false); } }} disabled={busy} /><span>Disclose commercial content</span></label>
                                {commercialDisclosure && <div className="tiktok-creator-subchoices">
                                    <p>Let viewers know this post promotes a brand, product, or service. Select at least one.</p>
                                    <label className="tiktok-creator-check"><input type="checkbox" checked={brandOrganic} onChange={(event) => setBrandOrganic(event.target.checked)} disabled={busy} /><span><strong>Your brand</strong> — you are promoting yourself or your own business.</span></label>
                                    <label className="tiktok-creator-check"><input type="checkbox" checked={brandContent} onChange={(event) => setBrandContent(event.target.checked)} disabled={busy || privacy === 'SELF_ONLY'} /><span><strong>Branded content</strong> — you are promoting another brand in exchange for payment or another incentive.{privacy === 'SELF_ONLY' ? ' Branded content visibility cannot be set to private.' : ''}</span></label>
                                    {(brandOrganic || brandContent) && <p className="tiktok-creator-disclosure-label">{brandContent ? "Your photo/video will be labeled as 'Paid partnership'" : "Your photo/video will be labeled as 'Promotional content'"}</p>}
                                </div>}
                                <label className="tiktok-creator-check"><input type="checkbox" checked={aiGenerated} onChange={(event) => setAiGenerated(event.target.checked)} disabled={busy} /><span>Label this video as AI-generated content</span></label>
                            </fieldset>

                            <label className="tiktok-creator-check"><input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} required disabled={busy} /><span>I own this video or have all permissions required to publish it, and it complies with TikTok's rules.</span></label>
                            <label className="tiktok-creator-check tiktok-creator-declaration"><input type="checkbox" checked={musicConfirmed} onChange={(event) => setMusicConfirmed(event.target.checked)} required disabled={busy} /><span>By posting, you agree to TikTok&apos;s {brandContent && <><a href="https://www.tiktok.com/legal/page/global/bc-policy/en" target="_blank" rel="noreferrer">Branded Content Policy</a> and </>}<a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noreferrer">Music Usage Confirmation</a>.</span></label>
                            <p className="tiktok-creator-processing-note">After you press the button, AIRDOX will upload this video and TikTok will process the post. Processing can take a few minutes.</p>
                            <button className="tiktok-creator-button" type="submit" disabled={!ready || busy}>{busy ? 'Publishing to TikTok…' : 'Post video to TikTok'}</button>
                        </form>
                    </div>
                )}
                {message && <p className="tiktok-creator-success">{message}</p>}
                {error && <p className="tiktok-creator-error" role="alert">{error}</p>}
            </section>

            <section className="tiktok-creator-safety">
                <h2>You approve every post</h2>
                <p>AIRDOX never posts in the background. Nothing is sent until you preview the selected video, choose privacy and settings, confirm your rights, and press “Post video to TikTok”.</p>
                <p>Your video is streamed to TikTok and is not retained by AIRDOX. Disconnecting revokes TikTok access and deletes the stored connection.</p>
            </section>

            <footer className="tiktok-creator-footer">
                <a href="/privacy-policy">Privacy Policy</a><a href="/terms-of-service">Terms of Service</a><a href="mailto:airdox82@gmail.com">Support</a>
            </footer>
        </main>
    );
};

export default TikTokCreatorPage;
