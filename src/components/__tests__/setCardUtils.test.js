import { describe, expect, it } from 'vitest';
import { buildBookingDetail, formatSetDateLabel } from '../setCardUtils';

describe('setCardUtils', () => {
    it('localizes known English month tokens for German set cards', () => {
        expect(formatSetDateLabel('MAY 2026', 'de')).toBe('MAI 2026');
        expect(formatSetDateLabel('MAY 2026', 'en')).toBe('MAY 2026');
    });

    it('builds the booking prefill contract from a set', () => {
        expect(buildBookingDetail(
            { id: 'set-1', title: 'Peak Time' },
            'Bitte {setTitle} buchen'
        )).toEqual({
            setId: 'set-1',
            setTitle: 'Peak Time',
            source: 'set_card',
            event: 'AIRDOX Booking - Peak Time',
            message: 'Bitte Peak Time buchen',
        });
    });
});
