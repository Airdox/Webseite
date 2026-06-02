import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  configureAudienceSignals,
  createAudienceSignal,
  trackAudienceSignal
} from '../audienceSignals';

describe('audienceSignals', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    configureAudienceSignals({
      endpoint: '/api/audience-events',
      enabled: true,
      consentResolver: null
    });
  });

  it('uses the cookie banner analytics consent key', () => {
    const sendBeacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon
    });
    window.localStorage.setItem('airdox-analytics-enabled', 'true');

    const tracked = trackAudienceSignal('route_view', {
      route: '/',
      contentType: 'page'
    });

    expect(tracked).toBe(true);
    expect(sendBeacon).toHaveBeenCalledOnce();
    const [, blob] = sendBeacon.mock.calls[0];
    expect(blob.type).toBe('application/json');
  });

  it('skips events when analytics consent is missing', () => {
    const sendBeacon = vi.fn(() => true);
    const localSignal = vi.fn();
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon
    });
    window.addEventListener('airdox:audience-signal', localSignal);

    const tracked = trackAudienceSignal('set_play', {
      contentId: 'demo-set',
      contentType: 'music_set'
    });

    expect(tracked).toBe(false);
    expect(sendBeacon).not.toHaveBeenCalled();
    expect(localSignal).toHaveBeenCalledOnce();
    expect(localSignal.mock.calls[0][0].detail).toMatchObject({
      skipped: true,
      reason: 'analytics_consent_missing'
    });
    window.removeEventListener('airdox:audience-signal', localSignal);
  });

  it('creates route-aware consented events', () => {
    configureAudienceSignals({
      consentResolver: () => ({ analytics: true })
    });

    const event = createAudienceSignal('section_view', {
      contentId: 'music',
      contentType: 'website_section'
    });

    expect(event).toMatchObject({
      consent: { analytics: true },
      type: 'section_view',
      route: '/',
      contentId: 'music',
      contentType: 'website_section'
    });
    expect(event.sessionIdHash).toBeTruthy();
  });
});
