// Utility to sanitize filename (prevent path traversal)
function sanitizeFilename(filename) {
    return decodeURIComponent(filename).replace(/[^a-zA-Z0-9_\-.]/g, '');
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

export async function onRequestGet(context) {
    const { params, env, request } = context;
    const filename = params.filename;

    if (!filename || !/\.mp3$/i.test(decodeURIComponent(filename))) {
        return new Response('Invalid audio file: ' + filename, { status: 400, headers: corsHeaders });
    }

    const safeFilename = sanitizeFilename(filename);

    let object = null;
    if (env.PUBLIC && env.PUBLIC.get) {
        // Try with 'public/' prefix first (R2 bucket structure)
        object = await env.PUBLIC.get(`public/${safeFilename}`);
        if (!object) {
            // Try without prefix
            object = await env.PUBLIC.get(safeFilename);
        }
    }

    if (!object) {
        return new Response('Audio file not found: ' + safeFilename, { status: 404, headers: corsHeaders });
    }

    // Set headers for streaming audio
    const headers = {
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400',
        ...corsHeaders
    };

    // Support range requests for seeking
    const range = request.headers.get('Range');
    if (range) {
        const size = object.size;
        const match = /bytes=(\d+)-(\d*)/.exec(range);
        if (match) {
            const start = parseInt(match[1], 10);
            const end = match[2] ? parseInt(match[2], 10) : size - 1;
            if (start >= size || end >= size) {
                return new Response('Requested range not satisfiable', {
                    status: 416,
                    headers: { ...headers, 'Content-Range': `bytes */${size}` }
                });
            }
            const sliced = object.body.slice(start, end + 1);
            return new Response(sliced, {
                status: 206,
                headers: {
                    ...headers,
                    'Content-Range': `bytes ${start}-${end}/${size}`,
                    'Content-Length': (end - start + 1).toString(),
                }
            });
        }
    }

    // Full file
    headers['Content-Length'] = object.size.toString();
    return new Response(object.body, { status: 200, headers });
}

export async function onRequestOptions() {
    return new Response(null, { headers: corsHeaders });
}
