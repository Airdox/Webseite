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
    <p>Last updated: July 21, 2026</p>
    <p>AIRDOX operates the website <a href="https://airdox.info">https://airdox.info</a>, including the public TikTok Creator Tool. This policy explains what information we process, why we process it, and the choices available to you.</p>
    <h2>Controller and Contact</h2>
    <p>AIRDOX is responsible for the processing described in this policy. For privacy requests or questions, contact <a href="mailto:airdox82@gmail.com">airdox82@gmail.com</a>.</p>
    <h2>Information We Process</h2>
    <p>We may process technical website data such as page views, browser and device information, security data, consented analytics and audio-playback events, newsletter subscriptions, and booking form submissions. If you connect TikTok, we receive your TikTok Open ID, display name, profile image, the permissions you granted, and authorization tokens. We do not request your TikTok password.</p>
    <h2>Public TikTok Creator Tool</h2>
    <p>The tool is available to external creators who connect their own TikTok account. It requests only <code>user.info.basic</code> to show the connected identity and <code>video.publish</code> to publish a creator-selected video after that creator reviews the video, caption, privacy, interaction, and disclosure settings and explicitly confirms the specific post. AIRDOX does not access or display a list of your existing TikTok videos and never publishes in the background.</p>
    <p>Your selected video, caption, and chosen post settings are streamed through the AIRDOX service to TikTok for the direct post you request. The video and caption are not saved in the AIRDOX database or media storage. AIRDOX checks TikTok's processing status and shows the result on the Creator Tool page.</p>
    <h2>Purposes and Legal Bases</h2>
    <p>We process TikTok connection data to perform the service you request and based on your authorization. Website security data is processed for our legitimate interest in protecting the service. Booking, newsletter, and optional analytics data is processed to answer your request or on the basis of your consent, as applicable.</p>
    <h2>Storage and Security</h2>
    <p>TikTok refresh tokens are encrypted at rest and are never exposed to browser scripts. The connection uses a secure, HttpOnly session cookie that expires after 30 days. Expired connection records are deleted during service cleanup. Disconnecting the account triggers a TikTok token-revocation request and deletes the local connection immediately. Uploaded video files are not retained by AIRDOX.</p>
    <h2>Sharing and Service Providers</h2>
    <p>We do not sell personal information. We share data only as needed with TikTok for the feature you authorize and with infrastructure providers used to operate the service, including Cloudflare for hosting and delivery and Neon for the encrypted connection database. Their processing may occur in other countries under their applicable safeguards and terms.</p>
    <h2>Your Choices and Rights</h2>
    <p>You may decline TikTok authorization, disconnect at any time in the <a href="/tiktok-creator">Creator Tool</a>, or remove AIRDOX access in TikTok. Depending on applicable law, you may request access, correction, deletion, restriction, portability, or objection, and you may withdraw consent without affecting earlier processing. Contact us at the address above. You may also complain to your competent data-protection authority.</p>
    <h2>Children</h2>
    <p>The Creator Tool is not directed to children. You must meet TikTok's and applicable law's minimum-age requirements to connect an account.</p>
    <h2>Changes</h2>
    <p>We may update this policy when the service or legal requirements change. The current version and update date remain available at this URL.</p>
    <p><a href="/">Back to AIRDOX</a> &middot; <a href="/tiktok-creator">TikTok Creator Tool</a> &middot; <a href="/terms-of-service">Terms of Service</a></p>`,
});

export const renderTermsOfService = () => renderLegalPage({
    canonicalPath: '/terms-of-service',
    heading: 'Terms of Service',
    body: `
    <p>Last updated: July 21, 2026</p>
    <p>These terms govern use of the AIRDOX website at <a href="https://airdox.info">https://airdox.info</a> and the public TikTok Creator Tool. By using the service, you agree to these terms.</p>
    <h2>Use of the Website</h2>
    <p>You may use AIRDOX to listen to published music sets, read artist information, submit booking requests, and access official AIRDOX materials. You must not misuse the website, attempt unauthorized access, or interfere with its operation.</p>
    <h2>TikTok Creator Tool</h2>
    <p>The Creator Tool lets external creators connect their own TikTok account, preview a creator-selected video, edit its caption, choose privacy and interaction settings, complete applicable content disclosures, and post that video directly to the connected profile. It is a public sharing workflow, not a private account-management service.</p>
    <p>You authorize AIRDOX to access your basic TikTok profile information and perform only the specific Direct Post you initiate after reviewing and confirming all settings. AIRDOX does not publish in the background. You can revoke authorization at any time by disconnecting the account. Your use of TikTok remains subject to TikTok's own terms, community guidelines, Music Usage Confirmation, and intellectual-property policies.</p>
    <h2>Content Rights</h2>
    <p>You retain your rights in videos you select. By initiating an upload, you confirm that you own the video or hold every permission needed for its images, music, performances, trademarks, and other material, and that uploading it is lawful. You grant AIRDOX only the limited, temporary permission needed to transfer that video to TikTok at your direction.</p>
    <p>AIRDOX retains rights to AIRDOX branding, website content, music-set presentation, and related creative materials unless otherwise stated.</p>
    <h2>Prohibited Use</h2>
    <p>You must not upload unlawful, infringing, deceptive, harmful, abusive, or unauthorized content; upload material belonging to another person without permission; probe or disrupt the service; bypass limits; automate abusive submissions; or use another person's TikTok account.</p>
    <h2>Availability and Disclaimers</h2>
    <p>The service is provided on an as-available basis. Upload acceptance, processing, moderation, and publication are controlled by TikTok. AIRDOX does not guarantee that TikTok will accept or publish a video and may suspend the tool to protect users, comply with law, or prevent abuse.</p>
    <h2>Termination</h2>
    <p>You may stop using the service and disconnect TikTok at any time. AIRDOX may restrict access for a violation of these terms. Sections that by their nature should survive termination, including content rights and responsibility for misuse, remain effective.</p>
    <h2>Changes</h2>
    <p>We may update these terms when the service or legal requirements change. The current version and update date remain available at this URL.</p>
    <h2>Contact</h2>
    <p>For questions about these terms, contact: <a href="mailto:airdox82@gmail.com">airdox82@gmail.com</a>.</p>
    <p><a href="/">Back to AIRDOX</a> &middot; <a href="/tiktok-creator">TikTok Creator Tool</a> &middot; <a href="/privacy-policy">Privacy Policy</a></p>`,
});
