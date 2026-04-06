import { describe, it, expect, vi, beforeEach } from 'vitest';
import { t, getLocale } from '../i18n';

describe('i18n Utility', () => {
    beforeEach(() => {
        vi.stubGlobal('navigator', { language: 'en-US' });
        vi.stubGlobal('window', { __SITE_LANG__: undefined });
    });

    it('sollte den Standard-Locale (en) zurückgeben, wenn keine Vorgabe existiert', () => {
        expect(getLocale()).toBe('en');
    });

    it('sollte "de" zurückgeben, wenn die Browsersprache Deutsch ist', () => {
        vi.stubGlobal('navigator', { language: 'de-DE' });
        expect(getLocale()).toBe('de');
    });

    it('sollte __SITE_LANG__ bevorzugen, wenn vorhanden', () => {
        vi.stubGlobal('window', { __SITE_LANG__: 'de' });
        expect(getLocale()).toBe('de');
    });

    it('sollte einen Text korrekt übersetzen (Key vorhanden)', () => {
        // Da die Locale beim Import von i18n.js einmalig festgelegt wird,
        // testen wir hier die t-Funktion mit dem beim Test-Start aktiven Locale.
        // In unserem Test-Environment ist das 'en' (siehe beforeEach).
        expect(t('nav.home')).toBe('Home');
    });

    it('sollte den Key selbst zurückgeben, wenn er nirgends gefunden wird', () => {
        expect(t('non.existent.key')).toBe('non.existent.key');
    });
});
