import React, { useEffect, useRef, useState } from 'react';
import './BookingSection.css';

const BookingSection = () => {
    const sectionRef = useRef(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        event: '',
        message: ''
    });
    const [focused, setFocused] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1 }
        );

        const elements = sectionRef.current?.querySelectorAll('.reveal, .reveal-left, .reveal-right');
        elements?.forEach(el => observer.observe(el));

        return () => observer.disconnect();
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

        // Ensure Netlify knows which form this is
        if (!data.get('form-name')) {
            data.append('form-name', 'booking');
        }

        console.log('--- FORM SUBMISSION START ---');
        console.log('Encrypted Body:', new URLSearchParams(data).toString());
        console.log('Form Data Object:', Object.fromEntries(data.entries()));

        try {
            const response = await fetch('/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(data).toString()
            });

            console.log('Response Status:', response.status);
            console.log('Response OK:', response.ok);

            if (response.ok) {
                setSubmitted(true);
                setFormData({ name: '', email: '', event: '', message: '' });
            } else {
                throw new Error('Fehler beim Senden');
            }
        } catch (err) {
            console.error('Form submission error:', err);
            setError(`Nachricht konnte nicht gesendet werden. (Error: ${err.message}) Please try later.`);
        }
    };

    return (
        <section className="booking-section section" id="booking" ref={sectionRef}>
            <div className="booking-bg">
                <div className="booking-gradient"></div>
            </div>

            <div className="container">
                <div className="booking-layout">
                    <div className="booking-info reveal-left">
                        <div className="section-header">
                            <span className="section-label">// GET IN TOUCH</span>
                            <h2 className="section-title text-gradient">BOOKING</h2>
                            <p className="section-subtitle">Available for clubs, festivals, and private events.</p>
                        </div>

                        <div className="booking-details">
                            <div className="detail-item">
                                <span className="detail-label">EMAIL</span>
                                <a href="mailto:airdox82@gmail.com" className="detail-value interactive">
                                    airdox82@gmail.com
                                </a>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">BASED IN</span>
                                <span className="detail-value">Berlin, Germany</span>
                            </div>
                        </div>

                        <div className="booking-socials">
                            <a href="https://soundcloud.com/airdox" target="_blank" rel="noopener noreferrer" className="social-btn interactive">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M11.56 8.87V17h8.76c1.85 0 3.35-1.52 3.35-3.39 0-1.87-1.5-3.39-3.35-3.39-.28 0-.55.04-.81.11 0-2.99-2.39-5.42-5.35-5.42-2.96 0-5.35 2.43-5.35 5.42 0 .23.01.45.04.67H6.56c-1.02 0-1.85.84-1.85 1.87s.83 1.87 1.85 1.87h1.39V8.87c0-2.21 1.76-4 3.93-4 2.17 0 3.93 1.79 3.93 4 0 .28-.03.56-.08.83" />
                                </svg>
                                <span>SoundCloud</span>
                            </a>
                            <a href="https://www.mixcloud.com/Airdox/" target="_blank" rel="noopener noreferrer" className="social-btn interactive">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M7.749 0c-3.791 0-6.902 2.768-7.589 6.551.493 2.152 2.057 3.916 4.102 4.606.326.111.664.168.997.168 1.109 0 2.148-.375 2.992-1.015-1.045-.394-1.928-1.121-2.536-2.062-.607-.942-.888-2.073-.787-3.178C5.232 2.766 7.155.992 9.531 1.096c2.375.104 4.305 2.029 4.409 4.404.032.729-.115 1.446-.425 2.094-.311.649-.785 1.205-1.373 1.611 1.604-.047 3.036-.593 4.195-1.503-.923.473-1.93.754-3.002.793 1.341 1.396 3.235 2.27 5.318 2.27 1.777 0 3.428-.636 4.735-1.696C23.012 5.567 19.897 2.768 16.101 2.768c-.628 0-1.242.079-1.831.229C13.238 1.155 10.61 0 7.749 0zm.019 1.956c2.093 0 3.992.839 5.394 2.193.303-.075.617-.113.939-.113 2.776 0 5.055 2.046 5.467 4.729-.691.564-1.564.912-2.518.912-1.745 0-3.328-1.004-4.103-2.541-.854 1.766-2.615 2.924-4.57 2.715-1.956-.209-3.528-1.748-3.666-3.707-.138-1.959 1.159-3.714 3.056-4.186zM4.685 12.235c-2.31 0-4.17 1.841-4.17 4.129 0 2.29 1.86 4.128 4.17 4.128 2.311 0 4.167-1.838 4.167-4.128 0-2.288-1.856-4.129-4.167-4.129zm14.628 0c-2.311 0-4.168 1.841-4.168 4.129 0 2.29 1.857 4.128 4.168 4.128 2.31 0 4.167-1.838 4.167-4.128 0-2.288-1.857-4.129-4.167-4.129zM2.876 13.988h3.621v.961H2.876v-.961zm14.63 0h3.619v.961h-3.619v-.961zM4.321 16.09h.729v1.282h-.729V16.09zm14.63 0h.729v1.282h-.729V16.09z" />
                                </svg>
                                <span>Mixcloud</span>
                            </a>
                            <a href="https://instagram.com/airdox_bln" target="_blank" rel="noopener noreferrer" className="social-btn interactive">
                                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                    <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                                </svg>
                                <span>Instagram</span>
                            </a>
                        </div>
                    </div>

                    <div className="booking-form-container reveal-right">
                        {submitted ? (
                            <div className="form-success glass-card">
                                <div className="success-icon">✓</div>
                                <h3>Nachricht gesendet!</h3>
                                <p>Danke für deine Anfrage. Ich melde mich bald bei dir.</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setSubmitted(false)}
                                >
                                    Neue Nachricht
                                </button>
                            </div>
                        ) : (
                            <form
                                className="booking-form glass-card"
                                onSubmit={handleSubmit}
                                name="booking"
                                method="POST"
                                data-netlify="true"
                                netlify-honeypot="bot-field"
                            >
                                <input type="hidden" name="form-name" value="booking" />
                                <input type="hidden" name="bot-field" />

                                <h3 className="form-title">Send a Message</h3>

                                {error && <div className="form-error">{error}</div>}

                                <div className={`form-group ${focused.name || formData.name ? 'focused' : ''}`}>
                                    <input type="text" name="name" id="name" value={formData.name}
                                        onChange={handleInputChange} onFocus={() => handleFocus('name')}
                                        onBlur={() => handleBlur('name')} placeholder=" " required />
                                    <label htmlFor="name">Your Name</label>
                                    <div className="input-line"></div>
                                </div>

                                <div className={`form-group ${focused.email || formData.email ? 'focused' : ''}`}>
                                    <input type="email" name="email" id="email" value={formData.email}
                                        onChange={handleInputChange} onFocus={() => handleFocus('email')}
                                        onBlur={() => handleBlur('email')} placeholder=" " required />
                                    <label htmlFor="email">Email Address</label>
                                    <div className="input-line"></div>
                                </div>

                                <div className={`form-group ${focused.event || formData.event ? 'focused' : ''}`}>
                                    <input type="text" name="event" id="event" value={formData.event}
                                        onChange={handleInputChange} onFocus={() => handleFocus('event')}
                                        onBlur={() => handleBlur('event')} placeholder=" " />
                                    <label htmlFor="event">Event / Venue</label>
                                    <div className="input-line"></div>
                                </div>

                                <div className={`form-group ${focused.message || formData.message ? 'focused' : ''}`}>
                                    <textarea name="message" id="message" rows="4" value={formData.message}
                                        onChange={handleInputChange} onFocus={() => handleFocus('message')}
                                        onBlur={() => handleBlur('message')} placeholder=" " required></textarea>
                                    <label htmlFor="message">Your Message</label>
                                    <div className="input-line"></div>
                                </div>

                                <button type="submit" className="btn btn-primary form-submit interactive">
                                    <span>Send Request</span>
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

