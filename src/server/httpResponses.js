export const jsonResponse = (body, {
    status = 200,
    headers = {},
} = {}) => new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
});

export const handlerResultResponse = (result, corsHeaders) => jsonResponse(result.body, {
    status: result.status,
    headers: { ...(result.headers || {}), ...corsHeaders },
});

export const invalidRequestResponse = (corsHeaders) => jsonResponse({
    ok: false,
    error: 'Invalid Request',
}, {
    status: 400,
    headers: corsHeaders,
});
