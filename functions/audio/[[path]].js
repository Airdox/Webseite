export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    
    const filePath = url.pathname.replace(/^\/audio\//, '');
    const decodedPath = decodeURIComponent(filePath);
    
    // Extract filename from path (e.g., "public/sets/public/01 REC-2026-03-06.mp3" -> "01 REC-2026-03-06.mp3")
    const fileName = decodedPath.split('/').pop();

    // GitHub Release Direct Download URL
    const githubBaseUrl = "https://github.com/Airdox/Webseite/releases/download/v1.0.0/";
    const githubUrl = githubBaseUrl + encodeURIComponent(fileName);

    // Redirect to GitHub for high-speed, direct streaming
    return Response.redirect(githubUrl, 302);
}
