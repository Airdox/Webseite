import { buildApiUrl, readApiJson } from './apiResponse';

export const apiErrorMessage = (data, fallbackMessage) => (
    data?.error || data?.message || fallbackMessage
);

const normalizeBody = (body) => {
    if (body === undefined || body === null || typeof body === 'string') return body;
    return JSON.stringify(body);
};

const normalizeHeaders = (headers, body) => {
    if (body === undefined || body === null || typeof body === 'string') return headers;
    return { 'Content-Type': 'application/json', ...(headers || {}) };
};

const createFetchOptions = (options = {}) => {
    const { body, headers, ...fetchOptions } = options;
    const nextHeaders = normalizeHeaders(headers, body);
    const nextBody = normalizeBody(body);
    const requestOptions = { ...fetchOptions };
    if (nextHeaders !== undefined) requestOptions.headers = nextHeaders;
    if (nextBody !== undefined) requestOptions.body = nextBody;
    return Object.keys(requestOptions).length > 0 ? requestOptions : undefined;
};

export const requestApiJson = async (path, options = {}) => {
    const requestOptions = createFetchOptions(options);
    const response = requestOptions
        ? await fetch(buildApiUrl(path), requestOptions)
        : await fetch(buildApiUrl(path));
    const data = await readApiJson(response);
    return { response, data };
};

export const requestUrlJson = async (url, options = {}) => {
    const requestOptions = createFetchOptions(options);
    const response = requestOptions
        ? await fetch(url, requestOptions)
        : await fetch(url);
    const data = await readApiJson(response);
    return { response, data };
};

export const requireApiJson = async (path, options = {}, fallbackMessage = 'Request failed') => {
    const result = await requestApiJson(path, options);
    if (!result.response.ok) {
        throw new Error(apiErrorMessage(result.data, fallbackMessage));
    }
    return result;
};
