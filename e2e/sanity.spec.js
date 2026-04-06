import { test, expect } from '@playwright/test';

test.describe('AIRDOX Sanity Check', () => {
    test.beforeEach(async ({ page }) => {
        // Gehe zur Startseite (Vite Dev Server muss laufen)
        await page.goto('/');
    });

    test('seite wird geladen und Hero-Bereich ist sichtbar', async ({ page }) => {
        // Prüfe auf den Artist Name "AIRDOX"
        const title = page.locator('h1.hero-title');
        await expect(title).toBeVisible();
        await expect(title).toContainText('AIRDOX');
    });

    test('navigation zum Musik-Bereich funktioniert', async ({ page }) => {
        // Die Navigation nutzt Buttons, keine Links mit href
        const musicBtn = page.locator('.nav-links button').filter({ hasText: /Music|MUSIC/i });
        await musicBtn.click();
        
        // Prüfe ob die Musik-Sektion sichtbar ist
        const musicSection = page.locator('#music');
        await expect(musicSection).toBeVisible();
        
        // Es sollte mindestens ein Set-Card vorhanden sein
        const setCards = page.locator('.set-card');
        await expect(setCards.first()).toBeVisible();
    });

    test('abspielen eines Sets startet die Wiedergabe-UI', async ({ page }) => {
        // Scrolle zum Musik-Bereich
        await page.locator('#music').scrollIntoViewIfNeeded();

        // Klicke auf das erste Cover zum Abspielen
        const firstPlayBtn = page.locator('.set-cover').first();
        await firstPlayBtn.click();

        // Wir prüfen, ob die Player-Leiste (falls implementiert) oder das Cover-Overlay sich ändert
        // Laut MusicSection.jsx bekommt das Vinyl die Klasse 'spinning'
        // Wir geben dem Ganzen etwas Zeit, falls der Audio-Stream laden muss (15s)
        await expect(firstPlayBtn.locator('.cover-vinyl')).toHaveClass(/spinning/, { timeout: 15000 });
    });

    test('prüfung der englischen Version', async ({ page }) => {
        // Gehe zum englischen Pfad
        await page.goto('/en/');
        
        // Check für englischen Badge "BERLIN UNDERGROUND TECHNO"
        const badge = page.locator('.hero-badge');
        await expect(badge).toContainText('BERLIN UNDERGROUND TECHNO');
        
        // Prüfe ob die Music-Sektion mit "MUSIC" überschrieben ist
        const musicTitle = page.locator('#music .section-title');
        await expect(musicTitle).toContainText('MUSIC');
    });
});
