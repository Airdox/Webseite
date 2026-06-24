# Auth Workflow Proof

Generated: 2026-06-07T04:01:10.309Z

This proof run drives the real AIRDOX React UI in Chromium and mocks only external services: Turnstile, API auth responses, and the Google/Facebook OAuth popup callback. The screenshots prove the UI contract from registration through authenticated VIP access.

## Production Mode

The production website currently uses the standard email/password login as the primary login path. Google and Facebook login are prepared in code but intentionally not enabled live until real provider credentials and platform approvals are available.

Live check after deploy: `/api/oauth/config` returns `{"ok":true,"providers":[]}` on `https://airdox.info`, so social login buttons are not shown in production.

## Security Controls Checked

- Registration keeps CAPTCHA enforcement: frontend requires a Turnstile token and the worker verifies it server-side when `REQUIRE_CAPTCHA` is not disabled.
- Registration rate limiting remains active per IP, successful registrations per IP, and account identifier.
- Password registration now enforces 12-128 characters server-side.
- New password hashes use versioned PBKDF2-SHA-256. Legacy salted SHA-256 hashes still verify and are upgraded after successful password login.
- OAuth uses provider allowlisting, localhost-only dev bypass, state cookie verification, `SameSite=Lax`, `HttpOnly`, and `Secure` on HTTPS.
- VIP audio/session access still validates the saved token through `/api/auth` before rendering archive access.

## Evidence

1. Login modal with configured social providers: [01-login-modal-social-options.png](01-login-modal-social-options.png)
2. Registration form with CAPTCHA token: [02-registration-form-captcha-verified.png](02-registration-form-captcha-verified.png)
3. Registration success and automatic return to login: [03-registration-success-login-ready.png](03-registration-success-login-ready.png)
4. Password login success: [04-password-login-success.png](04-password-login-success.png)
5. Authenticated VIP user after password login: [05-authenticated-vip-user-password-login.png](05-authenticated-vip-user-password-login.png)
6. Authenticated VIP user after Google social login callback: [06-authenticated-vip-user-google-social-login.png](06-authenticated-vip-user-google-social-login.png)
7. Authenticated VIP user after Facebook social login callback: [07-authenticated-vip-user-facebook-social-login.png](07-authenticated-vip-user-facebook-social-login.png)

## Re-run

```powershell
node scripts/capture-auth-workflow-proof.mjs
```
