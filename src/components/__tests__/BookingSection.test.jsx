import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BookingSection from '../BookingSection';

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
    }[key] || key),
}));

describe('BookingSection', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        window.airdoxAnalyticsV2 = { trackEvent: vi.fn() };
    });

    it('shows a user-facing error when the API returns an empty error body', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 502 })));

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
    });

    it('tracks the canonical generate_lead event after successful booking submit', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));

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
    });
});
