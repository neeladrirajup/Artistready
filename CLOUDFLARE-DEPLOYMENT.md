# Artistready on your Cloudflare account

The independent deployment uses Worker `artistready`, D1 database
`artistready-prod`, and R2 bucket `artistready-media`. The database was created in
the Cloudflare account connected to Wrangler and its three SQL migrations were
applied on 20 October 2026. R2 must be activated in that account before the
bucket can be created.

## Protect access first

This deployment uses Cloudflare Access for identity. Configure an Access
application for the `artistready` Worker, covering its production and preview
URLs, and grant only the intended viewers. The Worker itself returns HTTP 401
when Access is absent or does not provide an email identity. A visitor-supplied
`oai-authenticated-user-id` header is removed; the Worker creates the profile
identity from the verified Access email instead. This is a new identity namespace
from the existing Sites-hosted account, so existing records need an explicit
data migration.

The existing `/signin`, `/mobile-signin`, and related screens are design previews;
they do not authenticate users. Cloudflare Access supplies the real login for
this deployment.

## Deploy

After R2 activation, create `artistready-media` in the same account. Run:

```powershell
npm install
npm run typecheck
npm run deploy:cloudflare
```

`deploy:cloudflare` builds a separate Worker entry point, replaces the local D1
placeholder in the generated Wrangler config with the ID in
`cloudflare-deploy.json`, binds the media bucket, then runs Wrangler deploy.
`node scripts/deploy-cloudflare.mjs --prepare-only` builds and writes that config
without publishing. Normal `npm run build` still builds the Sites version.

Do not treat a successful Worker upload as a completed migration. Verify the
Access login, D1 profile data, and all R2 media under the new URL. The current
Sites-hosted profile and uploads remain separate until copied deliberately.

The owner's existing profile and media can be transferred using the local,
gitignored `.migration-private` export. After checking the Access email and
authorizing the transfer of profile details and private preferences, run
`node scripts/migrate-cloudflare-profile.mjs --access-email=<email> --confirm-transfer`.
This refuses to overwrite an existing destination profile. Keep the private
export and generated SQL out of source control.
