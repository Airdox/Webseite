const DE_MONTH_TOKEN_MAP = {
    MAY: 'MAI',
    OCT: 'OKT',
    DEC: 'DEZ'
};

export const formatSetDateLabel = (rawDate = '', locale = 'de') => {
    const value = String(rawDate || '').trim();
    if (!value || locale !== 'de') return value;

    const parts = value.split(/\s+/);
    if (!parts.length) return value;

    const firstToken = parts[0].replace('.', '').toUpperCase();
    if (DE_MONTH_TOKEN_MAP[firstToken]) {
        parts[0] = DE_MONTH_TOKEN_MAP[firstToken];
        return parts.join(' ');
    }
    return value;
};

export const copyToClipboard = async (value) => {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
    }
    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
};

export const buildBookingDetail = (set, messageTemplate = '') => ({
    setId: set.id,
    setTitle: set.title,
    source: 'set_card',
    event: `AIRDOX Booking - ${set.title}`,
    message: String(messageTemplate).replace('{setTitle}', set.title)
});
