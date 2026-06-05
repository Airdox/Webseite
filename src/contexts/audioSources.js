import { getRuntimeApiBase } from '../utils/apiResponse';
import { getStorageItem, STORAGE_KEYS } from '../utils/websiteContracts';

export const AUDIO_BASE = '/api/audio';
export const AUDIO_MAX_PARTS = 25;

const AUDIO_API_BASE = (import.meta.env?.VITE_AUDIO_API_BASE || '').replace(/\/+$/, '');

export const getAudioApiBase = () => getRuntimeApiBase(AUDIO_API_BASE, { useProductionForMobile: false });

export const getAuthToken = () => {
    try {
        return getStorageItem(STORAGE_KEYS.authToken, '');
    } catch {
        return '';
    }
};

export const resolveAudioSrc = (src) => {
    if (!src) return src;
    const filename = src.split('/').pop();
    const encodedFilename = encodeURIComponent(filename);
    return `${getAudioApiBase()}${AUDIO_BASE}/${encodedFilename}`;
};

export const isAbsoluteUrl = (url) => /^https?:\/\//i.test(url);

export const encodeAudioSrc = (src) => {
    if (!src) return src;
    try {
        if (isAbsoluteUrl(src)) return new URL(src).toString();
        return new URL(src, window.location.origin).toString();
    } catch {
        return encodeURI(src);
    }
};

export const appendTokenParam = (src) => {
    const token = getAuthToken();
    if (!src || !token) return src;
    try {
        const url = isAbsoluteUrl(src) ? new URL(src) : new URL(src, window.location.origin);
        if (!url.searchParams.has('token')) {
            url.searchParams.set('token', token);
        }
        return url.toString();
    } catch {
        return src;
    }
};

export const toPlayableSrc = (src) => appendTokenParam(encodeAudioSrc(resolveAudioSrc(src)));

export const padPartIndex = (index) => String(index).padStart(3, '0');

export const toPart000 = (file) => {
    if (!file || !/\.mp3$/i.test(file)) return null;
    if (/_part\d{3}\.mp3$/i.test(file)) return null;
    if (/_full\.mp3$/i.test(file)) return file.replace(/_full\.mp3$/i, '_part000.mp3');
    return file.replace(/\.mp3$/i, '_part000.mp3');
};
