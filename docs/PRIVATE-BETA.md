# Orbiter private beta

## Backend setup

Use the existing Free Supabase project. The publishable key in `web/cloud-config.json` is public, not an administrator credential. Do not put a database password, secret key, service-role key or Cloudflare token in the repository.

1. Authentication → Users → Add user: create your beta owner's email with auto-confirm enabled.
2. Disable new-user signups. Keep Email authentication enabled.
3. Keep the default Magic Link email template. Clickable sign-in uses PKCE; no SMTP or email-body edit is required for owner testing. Numeric codes remain optional if custom SMTP/templates are configured later.
4. Run migrations in filename order from `supabase/migrations/`. The generated `build/Orbiter-cloud-setup.sql` combines them and enables the specified owner. It is ignored by Git because it includes the owner's email.
5. Confirm the final query reports one beta member. Other authenticated users cannot read or write Orbiter data until explicitly added to `orbiter_beta_members` through the SQL editor.

Default Supabase email delivery is restricted to project team addresses and low request limits. Configure a production SMTP provider before opening the beta to additional recipients. No paid service is required for this initial owner test.

## Website deployment

```powershell
npm run build:core
python scripts/prepare_cloud.py
```

In Cloudflare → Workers & Pages → Create application → Pages → Upload assets, create an `orbiter-beta` project and upload `build/Orbiter-private-beta.zip`. Deploy it, then open its assigned HTTPS `pages.dev` URL. No custom domain is required. The static app shell is public; account data and access are restricted by Supabase authentication and the database allowlist.

Set the Supabase Site URL to `https://floral-base-792d.kg-sato-main.workers.dev`. Under **Authentication → URL Configuration → Redirect URLs**, add exactly:

- `https://floral-base-792d.kg-sato-main.workers.dev/Application.html`
- `http://127.0.0.1:18743/auth-callback`

Upload the refreshed ZIP to the existing Workers static-assets deployment; `workers.dev` and `pages.dev` both work. Request a fresh email after updating. Website links must open in the same browser that requested them. Windows links must open on the same PC while Orbiter is running; the loopback callback exchanges the one-use code in Rust with its encrypted PKCE verifier. It does not grant website content native privileges or return access tokens to the browser. Native and browser sessions remain separate sign-ins to the same account.

The root landing page preserves callback parameters when forwarding to Application.html. Callback parameters are removed after browser sign-in. No workspace is imported solely because a link was clicked.

Only allowlisted static assets enter the ZIP. SQLite files, local backups, tools, fictional previews, native executables and repository metadata are excluded. The service worker caches application assets only, never Supabase responses or tokens.

## Connecting existing data

Open Workspace → Account, sign in using the newest emailed link, then choose a backed-up merge or account download. Different records merge independently; edits to different object fields merge automatically. Incompatible changes and deletion/edit conflicts require choosing a version. The active timer stays on its original device.

Browser account queues use IndexedDB and native queues use SQLite. Signing out restores local mode; queues remain associated with their original account. Windows protects refresh credentials and device capabilities using DPAPI. Crates open online and use atomic idempotent operations; offline native focus is recorded and delivered later. Imported/manual focus history does not generate XP.

Device capabilities prevent ordinary browser UI from generating native credit; they are not hardware attestation or anti-cheat protection against an account owner modifying their client. This is a personal study app, not a competitive rewards service.

## Release gate

Before claiming cloud sync live, validate email delivery, two-client edits, offline reconnection, conflicts, account isolation, pending focus, duplicate crate recovery, and installation with the real project. Keep source uncommitted unless separately authorized. Publishing a GitHub release is outside this setup.

References: [Supabase OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/).
