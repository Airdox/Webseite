import { describe, expect, it } from 'vitest';
import {
    BLOCKED_AUDIENCE_FIELDS,
    errorBody,
    VALID_AUDIENCE_EVENTS,
    VALID_UPDATE_TYPES,
} from '../statsContracts';

describe('stats contracts', () => {
    it('keeps supported stats update and audience event types explicit', () => {
        expect(VALID_UPDATE_TYPES.has('play')).toBe(true);
        expect(VALID_UPDATE_TYPES.has('unlike')).toBe(true);
        expect(VALID_AUDIENCE_EVENTS.has('booking_click')).toBe(true);
        expect(VALID_AUDIENCE_EVENTS.has('contact_submit')).toBe(true);
    });

    it('keeps sensitive fields blocked for audience events', () => {
        expect(BLOCKED_AUDIENCE_FIELDS.has('email')).toBe(true);
        expect(BLOCKED_AUDIENCE_FIELDS.has('rawUserAgent')).toBe(true);
    });

    it('builds consistent API error bodies', () => {
        expect(errorBody('Failed')).toEqual({ ok: false, error: 'Failed' });
        expect(errorBody('Failed', 'detail')).toEqual({ ok: false, error: 'Failed', details: 'detail' });
    });
});
