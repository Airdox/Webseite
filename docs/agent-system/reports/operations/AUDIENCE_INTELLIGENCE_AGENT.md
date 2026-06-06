# Audience Intelligence Agent

## Purpose

The Audience Intelligence Agent turns consented website behavior into growth recommendations for AIRDOX. It is designed to learn which content, routes, calls to action, and campaign sources create the strongest signals for reach, engagement, newsletter growth, and booking intent.

The agent must optimize for useful audience understanding without creating invasive personal profiles. It works with aggregate, consented, pseudonymous event signals.

## Primary Outcomes

- Identify the content that creates the strongest engagement.
- Detect which user journeys lead to set plays, newsletter signups, booking clicks, and contact intent.
- Recommend the next best website and content actions.
- Feed the Growth Command Agent with ranked audience insights.
- Help content agents reuse high-performing sets, pages, captions, and campaign angles.

## Signal Priorities

The agent should prioritize high-intent behavioral signals over raw traffic volume.

High-value signals:

- `set_play`
- `set_complete`
- `booking_click`
- `contact_submit`
- `newsletter_signup`
- `epk_download`
- `share_click`
- `return_visit`
- `deep_scroll`
- `copy_link`

Medium-value signals:

- `route_view`
- `section_view`
- `video_play`
- `external_social_click`
- `tracklist_open`
- `cta_view`

Low-value signals:

- passive page load
- short single-page sessions
- bot-like repeated hits

## Data Rules

Allowed:

- anonymous or pseudonymous session IDs
- consent status
- route
- content ID
- content type
- event type
- timestamp
- campaign/source group
- coarse device class
- coarse locale
- referrer category

Not allowed:

- raw IP addresses
- email addresses inside analytics events
- names
- phone numbers
- free-text form content
- exact location
- cross-site user identity
- hidden fingerprinting

## Recommended Event Shape

```json
{
  "timestamp": "2026-05-16T15:30:00.000Z",
  "sessionIdHash": "anon-session-hash",
  "consent": {
    "analytics": true,
    "marketing": false
  },
  "type": "set_play",
  "route": "/sets/live-set-may-2026",
  "contentId": "live-set-may-2026",
  "contentType": "music_set",
  "campaign": "instagram-reel",
  "referrerGroup": "social",
  "deviceClass": "mobile",
  "locale": "de-DE",
  "value": 1
}
```

## Outputs

- `docs/agent-system/latest-audience-intelligence.json`
- `docs/agent-system/latest-audience-intelligence.md`

## How It Should Be Used

The Growth Command Agent should consume the latest audience intelligence report and prioritize:

1. Pages with high engagement but weak conversion.
2. Content with strong social traffic but weak metadata.
3. Sets with strong play intent but no newsletter or booking follow-up.
4. Campaigns that attract returning users.
5. Pages that create booking clicks.

## Recommended Next Integrations

- Add the agent to `job-catalog.json` under `growth`.
- Add an npm script such as `agent:audience`.
- Feed consented frontend analytics events into a JSONL export or backend endpoint.
- Show the latest top insights in the FlightDeck or AgentSystemSection.
