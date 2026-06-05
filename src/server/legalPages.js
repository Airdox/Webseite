const legalPageStyles = `
    body { margin: 0; background: #050608; color: #f5f8ff; font-family: Arial, sans-serif; line-height: 1.6; }
    main { max-width: 860px; margin: 0 auto; padding: 64px 24px; }
    h1, h2 { color: #00f0ff; letter-spacing: 0; }
    a { color: #00f0ff; }
    .brand { font-size: 18px; font-weight: 700; color: #f5f8ff; }
`;

const renderLegalPage = ({ canonicalPath, heading, body }) => new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AIRDOX</title>
  <link rel="icon" type="image/png" href="/icon-192.png">
  <link rel="canonical" href="https://airdox.info${canonicalPath}">
  <style>${legalPageStyles}</style>
</head>
<body>
  <main>
    <p class="brand">AIRDOX</p>
    <h1>${heading}</h1>
    ${body}
  </main>
</body>
</html>`, {
    headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
    },
});

export const renderPrivacyPolicy = () => renderLegalPage({
    canonicalPath: '/privacy-policy',
    heading: 'Privacy Policy',
    body: `
    <p>Last updated: June 1, 2026</p>
    <p>AIRDOX operates the website https://airdox.info. This policy explains what information may be processed when you use the website or connect approved social publishing tools.</p>
    <h2>Information We Process</h2>
    <p>We may process technical website data such as page views, browser information, consented analytics events, audio playback events, newsletter or booking form submissions, and social publishing authorization data when you explicitly connect a platform account.</p>
    <h2>TikTok Integration</h2>
    <p>If TikTok access is enabled, AIRDOX uses TikTok authorization only to identify the connected account and publish videos that have been explicitly approved by the AIRDOX owner. No TikTok video is posted automatically without approval.</p>
    <h2>Use of Information</h2>
    <p>Information is used to operate the website, stream music sets, answer booking requests, prepare approved social posts, measure performance, and keep the platform secure.</p>
    <h2>Sharing</h2>
    <p>We do not sell personal information. Data is shared only with service providers required for hosting, analytics, email, audio delivery, or the social platform you explicitly authorize.</p>
    <h2>Contact</h2>
    <p>For privacy questions, contact: <a href="mailto:airdox82@gmail.com">airdox82@gmail.com</a>.</p>
    <p><a href="/">Back to AIRDOX</a> &middot; <a href="/terms-of-service">Terms of Service</a></p>`,
});

export const renderTermsOfService = () => renderLegalPage({
    canonicalPath: '/terms-of-service',
    heading: 'Terms of Service',
    body: `
    <p>Last updated: June 1, 2026</p>
    <p>These terms govern use of the AIRDOX website at https://airdox.info and related AIRDOX publishing workflows.</p>
    <h2>Use of the Website</h2>
    <p>You may use AIRDOX to listen to published music sets, read artist information, submit booking requests, and access official AIRDOX materials. You must not misuse the website, attempt unauthorized access, or interfere with its operation.</p>
    <h2>Social Publishing</h2>
    <p>AIRDOX social publishing tools are used only for AIRDOX-owned or AIRDOX-approved clips. A post may be uploaded to TikTok or another platform only after explicit approval of the video, caption, target platform, timing, and landing URL.</p>
    <h2>Content Rights</h2>
    <p>AIRDOX retains rights to AIRDOX branding, website content, music-set presentation, and related creative materials unless otherwise stated. Third-party platform terms may also apply.</p>
    <h2>Contact</h2>
    <p>For questions about these terms, contact: <a href="mailto:airdox82@gmail.com">airdox82@gmail.com</a>.</p>
    <p><a href="/">Back to AIRDOX</a> &middot; <a href="/privacy-policy">Privacy Policy</a></p>`,
});
