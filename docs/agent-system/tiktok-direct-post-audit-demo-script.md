# AIRDOX TikTok Direct Post Audit Demo Script

Purpose: replace the rejected Direct Post audit evidence for reference `20260808210920` without changing the real production flow.

Official checklist: <https://developers.tiktok.com/doc/content-sharing-guidelines#required_ux_implementation_in_your_app>

## Recording setup

- Record the real public web app, not a mockup: `https://airdox.info/tiktok-creator`.
- Keep the browser address bar and complete URL visible throughout the AIRDOX portion.
- Use a TikTok test account authorized to post through AIRDOX.
- Use an original, rights-cleared sample video with no promotional watermark, logo, URL, QR code, or unrelated platform promotion.
- Use a privacy option currently returned by `creator_info`. Before audit approval, expect TikTok to restrict the post to `SELF_ONLY`/private operation.
- Record one uninterrupted end-to-end run. Do not cut away required selections or status transitions.

## Required shot sequence

### 1. Public entry and OAuth

1. Start with the complete URL `https://airdox.info/tiktok-creator` visible.
2. Show that AIRDOX is a public Creator Tool and explain that it never posts without per-post confirmation.
3. Press `Continue with TikTok`.
4. Show the TikTok authorization page with `user.info.basic` and `video.publish`.
5. Authorize and return to the same AIRDOX URL.

### 2. Fresh creator information

6. Show the connected TikTok nickname/account.
7. Show the account-specific maximum duration.
8. Open the privacy dropdown and show only the options returned by TikTok; visibly select one, proving there is no default.
9. Show Comments, Duet, and Stitch off by default. If TikTok disables one, show it greyed out and unavailable.

### 3. Video, caption, and control

10. Choose the original sample MP4 and play part of the in-page preview.
11. Enter and then edit the caption manually; do not use a locked preset.
12. Show that an over-limit video cannot proceed, or clearly show that the chosen duration is within the account limit.
13. Manually select the desired interaction controls.

### 4. Commercial-content and consent states

14. Show `Disclose commercial content` off by default.
15. Turn it on and demonstrate that publishing remains blocked until `Your brand`, `Branded content`, or both is selected.
16. Show the correct `Promotional content` or `Paid partnership` label.
17. Demonstrate that branded content cannot use private visibility, then return to a valid combination. If the unaudited test account only permits private posting, finish the actual test post with commercial disclosure off.
18. Show the rights confirmation and the exact TikTok Music Usage Confirmation declaration. Show the Branded Content Policy declaration when `Branded content` is selected.

### 5. Explicit post, processing, and TikTok result

19. Show the local preview and all final settings together before submission.
20. Press `Post video to TikTok` visibly. This must be the first point at which video data is sent.
21. Keep recording while AIRDOX displays upload/processing updates and polls TikTok status.
22. Show the AIRDOX completion result.
23. Open the authorized TikTok account and show the resulting post in TikTok. The recording must end with this post visible; an AIRDOX success message alone does not satisfy the rejection comment.

## Pre-upload gate

- [ ] Complete AIRDOX URL is readable.
- [ ] OAuth page, permissions, redirect, and connected nickname are visible.
- [ ] Every official UX point 1-5 is demonstrated.
- [ ] No privacy or interaction default is preselected.
- [ ] Commercial disclosure and both relevant declaration states are shown.
- [ ] Preview and editable caption are shown.
- [ ] Explicit Post click, processing notice, and status polling are shown.
- [ ] Final shot shows the resulting post inside TikTok.
- [ ] Demo uses the real production UI and an original rights-cleared sample.
- [ ] MP4/MOV file is at most 50 MB.
- [ ] A second reviewer watched the final export from start to finish against this checklist.

## Reapplication rule

Prepare the revised answers and upload candidate only after this gate passes. Do not press the final TikTok `Submit`/`Reapply` action without separate, immediate user confirmation.
