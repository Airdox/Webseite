const SET_ANCHOR_PREFIX = 'set-';
const DEFAULT_ORIGIN = 'https://airdox.info';
const DEFAULT_NAV_HEIGHT = 80;
const SET_ANCHOR_SCROLL_GAP = 24;

const getBrowserWindow = () => (typeof window === 'undefined' ? undefined : window);
const getBrowserDocument = () => (typeof document === 'undefined' ? undefined : document);

export const buildSetAnchorId = (setId) => `${SET_ANCHOR_PREFIX}${String(setId).replace(/[^a-zA-Z0-9_-]/g, '-')}`;

export const buildSetHash = (setId) => `#${buildSetAnchorId(setId)}`;

export const buildSetShareUrl = (setId, locationLike = getBrowserWindow()?.location) => {
    const origin = locationLike?.origin || DEFAULT_ORIGIN;
    const path = locationLike?.pathname || '/';
    return `${origin}${path}${buildSetHash(setId)}`;
};

export const getSetAnchorIdFromHash = (hashValue = getBrowserWindow()?.location?.hash || '') => {
    const rawTarget = String(hashValue || '').replace(/^#/, '');
    let targetId = rawTarget;

    try {
        targetId = decodeURIComponent(rawTarget);
    } catch {
        targetId = rawTarget;
    }

    return targetId.startsWith(SET_ANCHOR_PREFIX) ? targetId : '';
};

export const getSetAnchorScrollTop = (
    target,
    {
        windowRef = getBrowserWindow(),
        documentRef = getBrowserDocument(),
    } = {},
) => {
    if (!target || !windowRef || !documentRef) return null;

    const navHeight = Number.parseFloat(
        windowRef.getComputedStyle(documentRef.documentElement).getPropertyValue('--nav-height'),
    ) || DEFAULT_NAV_HEIGHT;
    const top = target.getBoundingClientRect().top + windowRef.scrollY - navHeight - SET_ANCHOR_SCROLL_GAP;

    return Math.max(0, top);
};

export const scrollToSetAnchor = (
    anchorId,
    {
        behavior = 'smooth',
        windowRef = getBrowserWindow(),
        documentRef = getBrowserDocument(),
    } = {},
) => {
    const target = documentRef?.getElementById(anchorId);
    const top = getSetAnchorScrollTop(target, { windowRef, documentRef });
    if (top === null) return false;

    windowRef.scrollTo({ top, behavior });
    return true;
};

export const scrollToSetHash = (
    {
        behavior = 'smooth',
        windowRef = getBrowserWindow(),
        documentRef = getBrowserDocument(),
    } = {},
) => {
    const anchorId = getSetAnchorIdFromHash(windowRef?.location?.hash || '');
    if (!anchorId) return false;

    return scrollToSetAnchor(anchorId, { behavior, windowRef, documentRef });
};
