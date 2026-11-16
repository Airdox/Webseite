# AIRDOX TikTok Publishing Readiness

Checked: 2026-08-27 Europe/Berlin

## Current portal status

- App: `AIRDOX` (`7642957799622592529`)
- Production app version: live
- Content Posting API and Direct Post: enabled
- Direct Post audit: **rejected** on 2026-08-10 at 07:05 Europe/Berlin
- Audit reference: `20260808210920`
- Portal action currently offered: `Reapply`
- No reapplication was submitted during this check.

The rejection email contains no detailed reason. It only directs the developer to App Details. The authenticated Developer Portal app-detail response contains the authoritative reason:

> Your application did not follow our UX Guidelines. Please refer to point 1 to 5 under "Required UX Implementation in Your App" in the Content Sharing Guidelines. All the requirements mentioned here need to be shown in the demo video. The demo video should show the complete end-to-end flow of the integrations with TikTok and the ending must show that had been post under TikTok. The full Website url need to be showed in demo video.

The rejected audit used the uploaded file `airdox-tiktok-content-posting-api-review-demo.mp4`. That file is not present in this repository, so its exact frames cannot be audited locally. `META-UPLOAD.mp4` is a 31-second AIRDOX promotional reel and is not a suitable Direct Post integration demo.

## What TikTok requires

Official source: <https://developers.tiktok.com/doc/content-sharing-guidelines#required_ux_implementation_in_your_app>

The genuine app and the replacement demo recording must show all of the following:

1. Fresh `creator_info` on the posting page: nickname, returned privacy options, unavailable interaction controls, current posting availability, and duration limit enforcement.
2. User-entered post metadata: editable caption, privacy selected manually with no default, and Comments/Duet/Stitch off by default and disabled when TikTok reports them unavailable. The Music Usage Confirmation must appear before publishing.
3. Commercial-content disclosure: off by default; when enabled, require `Your brand`, `Branded content`, or both, show the correct label, and enforce branded-content privacy rules.
4. Correct declaration text for organic brand content versus branded content, including TikTok's Branded Content Policy where required.
5. Full user control: preview the selected video, allow caption editing, transmit nothing before the explicit Post action, warn that processing can take minutes, poll status, and show the result.

TikTok additionally required this particular audit recording to:

- keep the complete browser URL `https://airdox.info/tiktok-creator` visible;
- show the complete OAuth-to-post flow in the real AIRDOX web app;
- finish by showing the resulting post inside TikTok, not merely an AIRDOX success message.

## Verified implementation coverage

The current repository and deployed public page already implement the required product flow:

- `src/components/TikTokCreatorPage.jsx` displays the current creator nickname and uses only the privacy options returned by TikTok.
- Privacy has no default; Comments, Duet, and Stitch start off and respect TikTok-disabled states.
- Caption editing, local video preview, duration validation, disclosures, rights confirmation, Music Usage Confirmation, processing notice, explicit submit, and status polling are present.
- `src/server/tiktokCreator.js` queries creator info again immediately before initialization and revalidates privacy, duration, and interaction settings server-side.
- The Direct Post request includes `brand_organic_toggle`, `brand_content_toggle`, `is_aigc`, and the user-selected interaction/privacy values.
- The public page, privacy policy, and terms are reachable with HTTP 200.

No code defect matching TikTok's stated rejection was found. The proven repair is a replacement audit demo that visibly exercises the existing implementation end to end. Do not change production behavior merely to make a shorter recording.

## Required evidence before reapplying

Use `docs/agent-system/tiktok-direct-post-audit-demo-script.md` as the recording and review gate. The gate fails unless:

- every official UX item 1-5 is visible;
- the full AIRDOX website URL remains visible;
- OAuth consent and the connected nickname are visible;
- the selected video is previewed and every setting is manually reviewed;
- the user explicitly presses `Post video to TikTok`;
- AIRDOX processing/status polling is visible;
- the recording ends on TikTok with the resulting post visible;
- the final MP4 is under TikTok's 50 MB audit-upload limit.

## API readiness after audit approval

The stored automation refresh token was last observed with `user.info.basic,video.upload`, not `video.publish`. Audit approval alone will not update an old token.

After TikTok approves the Direct Post audit:

1. Run `npm run social:tiktok:oauth:init:direct`.
2. Complete OAuth and replace `TIKTOK_REFRESH_TOKEN` with the new token containing `video.publish`.
3. Run `npm run social:tiktok:check:init` and require `posting_init_ready_no_media_uploaded`.
4. Keep per-video user approval for the concrete video, caption, privacy, target platform, timing, and landing URL.

Until then, automated public TikTok posting must be treated as blocked. Inbox/Draft upload through `video.upload` is separate and is not a live post.
