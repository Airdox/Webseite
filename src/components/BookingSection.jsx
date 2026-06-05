import React, { useEffect, useRef, useState } from 'react';
import './BookingSection.css';
import { t } from '../utils/i18n';
import { requireApiJson } from '../utils/apiClient';
import { WINDOW_EVENTS } from '../utils/websiteContracts';
import useRevealOnScroll from '../hooks/useRevealOnScroll';
import { audienceEvents } from '../utils/audienceSignals';
import BookingSocialLinks from './BookingSocialLinks';

const BookingSection = () => {
    const sectionRef = useRef(null);
    useRevealOnScroll(sectionRef);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        event: '',
        message: ''
    });
    const [focused, setFocused] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [bookingContext, setBookingContext] = useState(null);

    useEffect(() => {
        const handleBookingPrefill = (event) => {
            const detail = event.detail || {};
            const setTitle = String(detail.setTitle || '').trim();
            const source = String(detail.source || 'set_card').trim();
            const nextContext = {
                setId: String(detail.setId || '').trim(),
                setTitle,
                source
            };
            setSubmitted(false);
            setBookingContext(nextContext);
            setFormData((current) => ({
                ...current,
                event: String(detail.event || (setTitle ? `AIRDOX Booking - ${setTitle}` : current.event)).trim(),
                message: String(detail.message || current.message).trim()
            }));
            setFocused((current) => ({
                ...current,
                event: true,
                message: true
            }));

            const analytics = window.airdoxAnalyticsV2 || window.airdoxAnalytics;
            analytics?.trackEvent?.('booking_prefill', {
                setId: nextContext.setId,
                setTitle: nextContext.setTitle,
                source: nextContext.source
            });
            audienceEvents.bookingClick({
                contentId: nextContext.setId || undefined,
                contentType: 'music_set',
                source: nextContext.source,
                value: 1
            });
        };

        window.addEventListener(WINDOW_EVENTS.bookingPrefill, handleBookingPrefill);
        return () => window.removeEventListener(WINDOW_EVENTS.bookingPrefill, handleBookingPrefill);
    }, []);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFocus = (field) => setFocused({ ...focused, [field]: true });
    const handleBlur = (field) => {
        if (!formData[field]) {
            setFocused({ ...focused, [field]: false });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const form = e.target;
        const data = new FormData(form);
        const payload = Object.fromEntries(data.entries());

        try {
            await requireApiJson('/api/booking', {
                method: 'POST',
                body: payload
            }, t('booking.sendError'));

            setSubmitted(true);
            setFormData({ name: '', email: '', event: '', message: '' });
            setBookingContext(null);
            const analytics = window.airdoxAnalyticsV2 || window.airdoxAnalytics;
            if (analytics?.trackEvent) {
                analytics.trackEvent('booking_submit', {
                    source: bookingContext?.source || 'booking_form_cloudflare',
                    setId: bookingContext?.setId || undefined,
                    setTitle: bookingContext?.setTitle || undefined
                });
                analytics.trackEvent('generate_lead', {
                    source: bookingContext?.source || 'booking_form_cloudflare',
                    status: 'success'
                });
            }
            audienceEvents.contactSubmit({
                contentId: bookingContext?.setId || undefined,
                contentType: bookingContext?.setId ? 'music_set' : 'booking_form',
                source: bookingContext?.source || 'booking_form_cloudflare',
                value: 1
            });
        } catch {
            setError(t('booking.sendErrorPrefix'));
        }

    };

    return (
        <section className="booking-section section" id="booking" ref={sectionRef}>
            <div className="container">
                <div className="booking-layout">
                    <div className="booking-info reveal-left">
                        <div className="section-header" style={{ textAlign: 'left' }}>
                            <span className="section-label" style={{ marginLeft: '30px' }}>{t('booking.sectionLabel')}</span>
                            <h2 className="section-title text-gradient">{t('booking.title')}</h2>
                            <p className="section-subtitle" style={{ marginLeft: '0' }}>{t('booking.subtitle')}</p>
                        </div>

                        <div className="booking-details">
                            <div className="detail-item">
                                <span className="detail-label">{t('booking.emailLabel')}</span>
                                <a href="mailto:airdox82@gmail.com" className="detail-value interactive">
                                    airdox82@gmail.com
                                </a>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">{t('booking.basedLabel')}</span>
                                <span className="detail-value">{t('booking.basedValue')}</span>
                            </div>
                        </div>

                        <BookingSocialLinks />
                    </div>

                    <div className="booking-form-container reveal-right">
                        {submitted ? (
                            <div className="form-success airdox-card">
                                <div className="success-icon">✓</div>
                                <h3>{t('booking.successTitle')}</h3>
                                <p>{t('booking.successBody')}</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setSubmitted(false)}
                                >
                                    {t('booking.newMessage')}
                                </button>
                            </div>
                        ) : (
                            <form
                                className="booking-form airdox-card"
                                onSubmit={handleSubmit}
                                name="booking"
                                method="POST"
                            >


                                <h3 className="form-title">{t('booking.formTitle')}</h3>
                                {bookingContext?.setTitle && (
                                    <div className="booking-context-pill" aria-live="polite">
                                        <span>{t('booking.contextLabel')}</span>
                                        <strong>{bookingContext.setTitle}</strong>
                                    </div>
                                )}

                                {error && <div className="form-error">{error}</div>}

                                {bookingContext && (
                                    <>
                                        <input type="hidden" name="source" value={bookingContext.source} />
                                        <input type="hidden" name="setId" value={bookingContext.setId} />
                                        <input type="hidden" name="setTitle" value={bookingContext.setTitle} />
                                    </>
                                )}

                                <div className={`form-group ${focused.name || formData.name ? 'focused' : ''}`}>
                                    <input type="text" name="name" id="name" value={formData.name}
                                        onChange={handleInputChange} onFocus={() => handleFocus('name')}
                                        onBlur={() => handleBlur('name')} placeholder=" " required autoComplete="name" />
                                    <label htmlFor="name">{t('booking.name')}</label>
                                    <div className="input-line"></div>
                                </div>

                                <div className={`form-group ${focused.email || formData.email ? 'focused' : ''}`}>
                                    <input type="email" name="email" id="email" value={formData.email}
                                        onChange={handleInputChange} onFocus={() => handleFocus('email')}
                                        onBlur={() => handleBlur('email')} placeholder=" " required autoComplete="email" />
                                    <label htmlFor="email">{t('booking.email')}</label>
                                    <div className="input-line"></div>
                                </div>

                                <div className={`form-group ${focused.event || formData.event ? 'focused' : ''}`}>
                                    <input type="text" name="event" id="event" value={formData.event}
                                        onChange={handleInputChange} onFocus={() => handleFocus('event')}
                                        onBlur={() => handleBlur('event')} placeholder=" " autoComplete="off" />
                                    <label htmlFor="event">{t('booking.event')}</label>
                                    <div className="input-line"></div>
                                </div>

                                <div className={`form-group ${focused.message || formData.message ? 'focused' : ''}`}>
                                    <textarea name="message" id="message" rows="4" value={formData.message}
                                        onChange={handleInputChange} onFocus={() => handleFocus('message')}
                                        onBlur={() => handleBlur('message')} placeholder=" " required autoComplete="off"></textarea>
                                    <label htmlFor="message">{t('booking.message')}</label>
                                    <div className="input-line"></div>
                                </div>

                                <button type="submit" className="btn btn-primary form-submit interactive">
                                    <span>{t('booking.submit')}</span>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                        <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
                                    </svg>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BookingSection;
