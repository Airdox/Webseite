import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BookingSection from '../BookingSection';
import { audienceEvents } from '../../utils/audienceSignals';

vi.mock('../../hooks/useRevealOnScroll', () => ({
    default: () => {},
}));

vi.mock('../../utils/i18n', () => ({
    t: (key) => ({
        'booking.sectionLabel': '// ANFRAGE',
        'booking.title': 'BUCHUNG',
        'booking.subtitle': 'Fuer Clubs, Festivals und private Events verfuegbar.',
        'booking.emailLabel': 'E-MAIL',
        'booking.basedLabel': 'STANDORT',
        'booking.basedValue': 'Berlin, Deutschland',
        'booking.formTitle': 'Nachricht senden',
        'booking.name': 'Dein Name',
        'booking.email': 'E-Mail-Adresse',
        'booking.event': 'Event / Ort',
        'booking.message': 'Deine Nachricht',
        'booking.submit': 'Anfrage senden',
        'booking.successTitle': 'Danke',
        'booking.successBody': 'Nachricht wurde gesendet.',
        'booking.newMessage': 'Neue Nachricht',
        'booking.sendError': 'Fehler beim Senden',
        'booking.sendErrorPrefix': 'Nachricht konnte nicht gesendet werden.',
        'booking.contextLabel': 'Ausgewaehltes Set',
    }[key] || key),
}));

vi.mock('../../utils/audienceSignals', () => ({
    audienceEvents: {
        bookingClick: vi.fn(),
        contactSubmit: vi.fn(),
    },
}));

describe('BookingSection', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        window.airdoxAnalyticsV2 = { trackEvent: vi.fn() };
    });

    it('shows a user-facing error when the API returns an empty error body', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            text: vi.fn().mockResolvedValue(''),
        }));

        render(<BookingSection />);

        fireEvent.change(screen.getByLabelText('Dein Name'), {
            target: { value: 'Checkout Test' },
        });
        fireEvent.change(screen.getByLabelText('E-Mail-Adresse'), {
            target: { value: 'checkout-test@example.com' },
        });
        fireEvent.change(screen.getByLabelText('Deine Nachricht'), {
            target: { value: 'Local checkout flow test.' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Anfrage senden/i }));

        await waitFor(() => {
            expect(screen.getByText('Nachricht konnte nicht gesendet werden.')).toBeInTheDocument();
        });
        expect(screen.queryByText(/Unexpected end of JSON input/i)).not.toBeInTheDocument();
    }, 15000);

    it('tracks the canonical generate_lead event after successful booking submit', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            text: vi.fn().mockResolvedValue('{}'),
        }));

        render(<BookingSection />);

        fireEvent.change(screen.getByLabelText('Dein Name'), {
            target: { value: 'Lead Test' },
        });
        fireEvent.change(screen.getByLabelText('E-Mail-Adresse'), {
            target: { value: 'lead-test@example.com' },
        });
        fireEvent.change(screen.getByLabelText('Deine Nachricht'), {
            target: { value: 'Booking intent tracking test.' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Anfrage senden/i }));

        await waitFor(() => {
            expect(window.airdoxAnalyticsV2.trackEvent).toHaveBeenCalledWith('generate_lead', {
                source: 'booking_form_cloudflare',
                status: 'success',
            });
        });
        expect(audienceEvents.contactSubmit).toHaveBeenCalledWith({
            contentId: undefined,
            contentType: 'booking_form',
            source: 'booking_form_cloudflare',
            value: 1,
        });
    });

    it('prefills booking context from a selected set and tracks the handoff', async () => {
        render(<BookingSection />);

        act(() => {
            window.dispatchEvent(new CustomEvent('airdox_booking_prefill', {
                detail: {
                    setId: 'live-set-may-2026-2',
                    setTitle: 'LIVE SET MAY 2026 #2',
                    source: 'set_card',
                    event: 'AIRDOX Booking - LIVE SET MAY 2026 #2',
                    message: 'Hi AIRDOX, this set fits my event.',
                },
            }));
        });

        expect(await screen.findByText('LIVE SET MAY 2026 #2')).toBeInTheDocument();
        expect(screen.getByDisplayValue('AIRDOX Booking - LIVE SET MAY 2026 #2')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Hi AIRDOX, this set fits my event.')).toBeInTheDocument();
        expect(window.airdoxAnalyticsV2.trackEvent).toHaveBeenCalledWith('booking_prefill', {
            setId: 'live-set-may-2026-2',
            setTitle: 'LIVE SET MAY 2026 #2',
            source: 'set_card',
        });
        expect(audienceEvents.bookingClick).toHaveBeenCalledWith({
            contentId: 'live-set-may-2026-2',
            contentType: 'music_set',
            source: 'set_card',
            value: 1,
        });
    });
});
