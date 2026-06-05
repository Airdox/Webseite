import { describe, expect, it } from 'vitest';
import { renderPrivacyPolicy, renderTermsOfService } from '../legalPages';

describe('legalPages', () => {
    it('renders privacy policy with cacheable HTML headers', async () => {
        const response = renderPrivacyPolicy();
        const html = await response.text();

        expect(response.headers.get('Content-Type')).toContain('text/html');
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
        expect(html).toContain('<h1>Privacy Policy</h1>');
        expect(html).toContain('https://airdox.info/privacy-policy');
    });

    it('renders terms of service with the privacy cross-link', async () => {
        const response = renderTermsOfService();
        const html = await response.text();

        expect(html).toContain('<h1>Terms of Service</h1>');
        expect(html).toContain('/privacy-policy');
    });
});
