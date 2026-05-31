import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:5175/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

page.on('console', (message) => {
  if (message.type() === 'error') console.error('BROWSER_ERROR:', message.text());
});

await page.goto(url, { waitUntil: 'networkidle' });
await page.locator('#music').scrollIntoViewIfNeeded();

const card = page.locator('.set-card[data-set-id]').first();
await card.waitFor({ state: 'visible', timeout: 10000 });
await card.locator('.set-cover').tap();
await page.waitForTimeout(1200);

const snapshot = await card.evaluate((element) => {
  const vinyl = element.querySelector('.cover-vinyl');
  const disc = element.querySelector('.mini-vinyl');
  const image = element.querySelector('.vinyl-image');
  const cover = element.querySelector('.set-cover');
  const read = () => ({
    cardClass: element.className,
    mode: element.getAttribute('data-animation-mode'),
    vinylClass: vinyl?.className,
    discClass: disc?.className,
    hasImage: Boolean(image),
    vinylStyle: vinyl?.getAttribute('style'),
    vinylTransform: vinyl ? getComputedStyle(vinyl).transform : null,
    discTransform: disc ? getComputedStyle(disc).transform : null,
    discAnimationName: disc ? getComputedStyle(disc).animationName : null,
    discAnimationDuration: disc ? getComputedStyle(disc).animationDuration : null,
    coverRect: cover?.getBoundingClientRect().toJSON?.() || null,
    vinylRect: vinyl?.getBoundingClientRect().toJSON?.() || null,
  });
  return read();
});

await card.getByRole('switch').first().tap();
await page.waitForTimeout(600);

const afterTrainer = await card.evaluate((element) => {
  const vinyl = element.querySelector('.cover-vinyl');
  const disc = element.querySelector('.mini-vinyl');
  return {
    mode: element.getAttribute('data-animation-mode'),
    vinylClass: vinyl?.className,
    discClass: disc?.className,
    vinylStyle: vinyl?.getAttribute('style'),
    vinylTransform: vinyl ? getComputedStyle(vinyl).transform : null,
    discTransform: disc ? getComputedStyle(disc).transform : null,
    discAnimationName: disc ? getComputedStyle(disc).animationName : null,
    discAnimationDuration: disc ? getComputedStyle(disc).animationDuration : null,
  };
});

console.log(JSON.stringify({ snapshot, afterTrainer }, null, 2));
await browser.close();
