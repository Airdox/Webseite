import { normalizeAudioBaseFilename } from '../lib/set-access.js';

const sanitizeFilename = (filename) => {
    const decoded = decodeURIComponent(filename);
    return decoded.replace(/[/\\:*?"<>|]/g, '');
};

const getRequestHeader = (request, name) => {
    const headers = request.headers;
    if (!headers) return '';
    const direct = headers.get?.(name) || headers.get?.(name.toLowerCase());
    if (direct) return direct;
    const target = name.toLowerCase();
    for (const [key, value] of headers.entries?.() || []) {
        if (String(key).toLowerCase() === target) return value;
    }
    return '';
};

const createAudioError = (corsHeaders) => (status, message, extra = {}) => new Response(JSON.stringify({
    error: message,
    ...extra,
}), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

export const registerAudioRoute = (router, {
    corsHeaders,
    sets,
}) => {
    const knownAudioBases = new Set(sets.map((set) => normalizeAudioBaseFilename(set.file)).filter(Boolean));
    const audioError = createAudioError(corsHeaders);

    const isKnownSetAudio = (filename) => {
        const base = normalizeAudioBaseFilename(filename);
        return Boolean(base && knownAudioBases.has(base));
    };

    router.get('/api/audio', async (request, env) => {
        const url = new URL(request.url);
        let filename = url.searchParams.get('file');

        if (!filename) {
            const originalPathname = request.headers.get('x-original-pathname');
            if (originalPathname) {
                filename = decodeURIComponent(originalPathname.substring('/api/audio/'.length));
            }
        }

        if (!filename || !/\.mp3$/i.test(filename)) {
            return new Response(JSON.stringify({ error: 'Invalid audio file', filename }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const safeFilename = sanitizeFilename(filename);
        console.log(`[Audio] Requesting: "${safeFilename}" (original: "${filename}")`);

        if (!isKnownSetAudio(safeFilename)) {
            return audioError(404, 'Audio file not found', { requested: safeFilename });
        }

        const range = getRequestHeader(request, 'Range');
        if (!range) {
            return audioError(403, 'Full audio downloads are disabled. Use the site player for streaming.');
        }

        let object = null;
        if (env.PUBLIC && env.PUBLIC.get) {
            object = await env.PUBLIC.get(`public/${safeFilename}`);
            if (!object) {
                object = await env.PUBLIC.get(safeFilename);
            }
        }

        if (!object) {
            console.log(`[Audio] File not found in R2: "${safeFilename}"`);
            return audioError(404, 'Audio file not found', {
                requested: safeFilename,
                tried: [`public/${safeFilename}`, safeFilename],
            });
        }

        const headers = {
            'Content-Type': 'audio/mpeg',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'private, no-store',
            'Content-Disposition': 'inline',
            'X-Content-Type-Options': 'nosniff',
            ...corsHeaders,
        };

        const size = object.size;
        const match = /bytes=(\d+)-(\d*)/.exec(range);
        if (match) {
            const start = parseInt(match[1], 10);
            const end = match[2] ? parseInt(match[2], 10) : size - 1;
            if (start >= size || end >= size) {
                return new Response('Requested range not satisfiable', {
                    status: 416,
                    headers: { ...headers, 'Content-Range': `bytes */${size}` },
                });
            }
            const rangeLength = end - start + 1;
            const rangeObject = await env.PUBLIC.get(object.key, {
                range: { offset: start, length: rangeLength },
            });
            return new Response(rangeObject ? rangeObject.body : object.body, {
                status: 206,
                headers: {
                    ...headers,
                    'Content-Range': `bytes ${start}-${end}/${size}`,
                    'Content-Length': rangeLength.toString(),
                },
            });
        }

        return audioError(416, 'Requested range not satisfiable', {
            expected: 'bytes=start-end',
        });
    });
};
