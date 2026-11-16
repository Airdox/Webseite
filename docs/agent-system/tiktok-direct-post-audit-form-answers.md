# AIRDOX Direct Post Audit - Prepared Form Answers

Status: prepared for review; not submitted.

Audit reference being remediated: `20260808210920`

Use these answers consistently with the public production page at `https://airdox.info/tiktok-creator`. Do not reuse earlier wording that described AIRDOX as a private/internal AIRDOX-only uploader: TikTok's Intended Use rules require a genuine public creator application rather than a utility limited to accounts managed by the developer or their team.

## Step 1 - General information

### Full legal name

`[USER MUST ENTER THEIR FULL LEGAL NAME]`

This is the only required identity field that cannot be derived safely from the repository.

### Organization name

`AIRDOX`

### Organization website

`https://airdox.info`

### Describe your organization's work in relation to TikTok

```text
AIRDOX operates a public web-based Creator Tool at https://airdox.info/tiktok-creator. The tool allows TikTok creators to connect their own TikTok account, select and preview an original video they have the rights to use, edit the caption, manually choose the privacy and interaction settings returned for their account, make the required commercial-content disclosures, and explicitly approve one Direct Post.

AIRDOX retrieves current creator information before rendering the posting controls and validates the settings again immediately before upload. It does not publish in the background, copy arbitrary content from other platforms, or post to accounts that have not authorized the app. Videos and captions are streamed for the creator-requested post and are not retained in AIRDOX media storage.
```

### TikTok representative email

Leave blank unless the applicant has an actual working relationship with a named TikTok employee and can provide that employee's TikTok email address.

## Step 2 - API client information

### App ID

`7642957799622592529`

### Goal of the application and benefit of the Content Posting API integration

```text
AIRDOX provides a public, user-controlled Share to TikTok experience at https://airdox.info/tiktok-creator. Authorized creators use it to publish their own original short-form videos directly to their own TikTok profile.

The Content Posting API lets AIRDOX retrieve the creator's current nickname, privacy options, interaction availability, posting availability, and maximum video duration; render those values in the posting page; accept an editable caption and manual user choices; upload only after explicit per-post consent; and show TikTok's processing result.

The integration is designed for authentic creators and is not limited to accounts managed by AIRDOX or an internal team. Each creator authorizes user.info.basic and video.publish through TikTok OAuth and retains full control over the exact video and settings sent to TikTok.
```

### Approximate daily users

Select: `Less than 100`

### Explain the daily usage estimate

```text
AIRDOX is in the initial public rollout of its Creator Tool and expects fewer than 100 active publishing users per day. The estimate is based on the current size of the AIRDOX audience, the newly launched public workflow at https://airdox.info/tiktok-creator, and the fact that each creator must complete TikTok OAuth and manually review every post. We expect a small initial number of authorized creators and typically no more than a few Direct Post attempts per creator per day. We will request a revised capacity only if measured public usage grows beyond this estimate.
```

## Step 3 - Evidence

### Demo video

Upload only a final screen recording that passes every item in `docs/agent-system/tiktok-direct-post-audit-demo-script.md`.

Recommended filename:

`airdox-tiktok-direct-post-audit-demo-2026-08-v2.mp4`

Do not upload `META-UPLOAD.mp4`: it is a promotional reel, not an integration demo.

### API response fields stored in the database

```text
AIRDOX stores only the fields required to maintain an authorized creator session:

- open_id
- display_name
- avatar_url
- scope
- access_token, encrypted with AES-GCM
- refresh_token, encrypted with AES-GCM
- expires_in and refresh_expires_in as calculated expiration timestamps

AIRDOX also stores a hashed AIRDOX session identifier and operational timestamps such as last_upload_at, created_at, updated_at, and session expiration. Encryption IVs are stored with the encrypted token values.

The following TikTok response fields are used transiently to render or complete the creator-requested post but are not stored in the AIRDOX database: creator_username, creator_nickname, creator_avatar_url, privacy_level_options, comment_disabled, duet_disabled, stitch_disabled, max_video_post_duration_sec, upload_url, publish_id, post status, fail_reason, publicly available post IDs, error code, error message, and log_id.

AIRDOX does not store the uploaded video or caption in its database or media storage.
```

## Step 4 - Review assertions

Before moving to the final submission action, confirm that the review page shows:

- public Creator Tool wording, not internal/AIRDOX-only wording;
- organization URL `https://airdox.info` and App ID `7642957799622592529`;
- daily users `Less than 100` with the public-rollout estimate;
- the corrected, database-accurate stored-field list;
- the replacement end-to-end demo filename;
- no claim that Direct Post audit approval or public posting is already available.

Do not press the final `Submit`/`Reapply` button without an immediate, separate user confirmation.
