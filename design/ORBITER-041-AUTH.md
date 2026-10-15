# Orbiter 0.4.1 — clickable email sign-in

- Website authentication now uses Supabase PKCE magic links, with numeric codes retained as an optional fallback.
- Email redirects return directly to Application.html; the root landing page also preserves callback query/hash parameters.
- Callback parameters are removed from the browser URL after processing. Sign-in opens account controls but never imports a workspace automatically.
- Windows creates an encrypted pending PKCE verifier and expected email, then exchanges the one-use callback code inside Rust at loopback port 18743. Access and refresh credentials are never returned to the browser.
- The callback retains exact Host checking, a separate rate limit, expiration, expected-email matching and single-use server exchange.
- Add the exact production Application.html URL and http://127.0.0.1:18743/auth-callback to Supabase redirect allowlists. Keep the current default email template.
- Re-upload the generated website archive and install the refreshed unsigned Windows build. Source changes alone do not update either deployment.

Validation: the intercepted browser fixture exercises PKCE challenge generation, code exchange, URL cleanup, account panel opening, and unchanged guest data. Existing offline/conflict/guest-restoration scenarios still pass. All 27 native tests pass, including the RFC 7636 S256 vector and credential protection. Live email round trips and cross-device/native sync still need manual confirmation after deploying.

No SMTP credentials, private session tokens or service-role keys were added to source. Changes remain uncommitted.
