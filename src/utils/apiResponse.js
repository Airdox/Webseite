export const readApiJson = async (response) => {
    const text = await response.text().catch(() => '');
    if (!text) return {};

    try {
        return JSON.parse(text);
    } catch {
        return {};
    }
};

export const readApiError = async (response, fallbackMessage) => {
    const data = await readApiJson(response);
    return data.error || data.message || fallbackMessage;
};
