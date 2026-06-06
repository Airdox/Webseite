import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const readPublic = (path) => readFileSync(resolve(root, 'public', path), 'utf8');

describe('agent readiness static assets', () => {
    it('exposes a focused llms.txt profile for AIRDOX', () => {
        const body = readPublic('llms.txt');

        expect(body).toContain('# AIRDOX');
        expect(body).toContain('Berlin underground techno');
        expect(body).toContain('https://airdox.info/booking/berlin-techno-dj/');
        expect(body).not.toContain('Photoshop JSX');
    });

    it('keeps the booking landing page indexable and canonical', () => {
        const body = readPublic('booking/berlin-techno-dj/index.html');

        expect(body).toContain('AIRDOX Booking | Berlin Techno DJ');
        expect(body).toContain('<meta name="robots" content="index, follow">');
        expect(body).toContain('<link rel="canonical" href="https://airdox.info/booking/berlin-techno-dj/">');
        expect(body).toContain('application/ld+json');
    });

    it('lists agent and booking resources in discovery files', () => {
        const robots = readPublic('robots.txt');
        const sitemap = readPublic('sitemap.xml');

        expect(robots).toContain('Sitemap: https://airdox.info/sitemap.xml');
        expect(robots).toContain('User-agent: GPTBot');
        expect(robots).toContain('Allow: /');
        expect(sitemap).toContain('https://airdox.info/booking/berlin-techno-dj/');
        expect(sitemap).toContain('https://airdox.info/agent-profile.md');
    });
});
