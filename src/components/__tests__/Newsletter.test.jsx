import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Newsletter from '../Newsletter';
import { audienceEvents } from '../../utils/audienceSignals';

vi.mock('../../utils/i18n', () => ({
    t: (key) => ({
        'newsletter.sectionLabel': '// NEWSLETTER',
        'newsletter.title': 'Updates',
        'newsletter.description': 'AIRDOX updates.',
        'newsletter.emailPlaceholder': 'email@example.com',
        'newsletter.submitting': 'Sendet',
        'newsletter.subscribe': 'Abonnieren',
        'newsletter.success': 'Danke',
        'newsletter.subscriptionFailed': 'Fehler',
        'newsletter.error': 'Fehler',
    }[key] || key),
}));

vi.mock('../../utils/audienceSignals', () => ({
    audienceEvents: {
        newsletterSignup: vi.fn(),
    },
}));

describe('Newsletter', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        window.airdoxAnalyticsV2 = { trackEvent: vi.fn() };
    });

    it('tracks the canonical sign_up event after successful subscribe', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));

        render(<Newsletter />);

        fireEvent.change(screen.getByPlaceholderText('email@example.com'), {
            target: { value: 'reach-test@example.com' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Abonnieren/i }));

        await waitFor(() => {
            expect(window.airdoxAnalyticsV2.trackEvent).toHaveBeenCalledWith('sign_up', {
                method: 'newsletter',
                status: 'success',
            });
        });
        expect(audienceEvents.newsletterSignup).toHaveBeenCalledWith({
            contentType: 'newsletter',
            source: 'newsletter_section',
            value: 1,
        });
    });
});
