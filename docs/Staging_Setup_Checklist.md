# Staging setup checklist

Prepared 2026-09-25 from local repository and installed-package inspection only. No Supabase or Stripe service, dashboard, documentation site, or remote CLI endpoint was contacted. No credentials were read, generated, or printed. This is preparation, not execution of Milestone 1.5. Milestone 2B remains out of scope.

## Local findings

- `git check-ignore -v -- .env.staging.local` matches `.gitignore` line 3, `.env*`.
- `git ls-files -- .env.staging.local` returns nothing: the file is not tracked.
- `.env.staging.local` does **not currently exist** at the workspace root. Its filename is protected by the ignore rule; this does not establish that credentials are configured.
- Neither `supabase` nor `stripe` resolves through PowerShell `Get-Command`. Neither has an executable in `node_modules/.bin`. They are unavailable in this shell/project; an installation elsewhere outside PATH was not ruled out.
- Supabase and Stripe application SDKs are installed. SDK packages are not CLI installations.
- `supabase/config.toml` is absent. The four migration files and `supabase/seed.sql` exist.

## Exact application environment variables

These are all six entries in `.env.example`. Readers are `src/server/env.ts`, `src/server/db.ts`, and `src/modules/payments/stripe.ts`.

| Exact name | Expected value and purpose |
|---|---|
| `SUPABASE_URL` | Staging project's HTTPS API URL; validated as a URL. |
| `SUPABASE_PUBLISHABLE_KEY` | Staging publishable API key; passed to the user-scoped Supabase client alongside the user's access token. Only nonempty-string validation exists. |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server API key for the same staging project. Used by the bypass-RLS client for internal capabilities and webhook persistence. See format distinction below. |
| `APP_ORIGIN` | Exact application origin. Example defaults to `http://localhost:3000`; the current preview address is `http://127.0.0.1:3100`. Use the actual origin for the future run. |
| `STRIPE_SECRET_KEY` | Stripe sandbox/test secret API key. Application validation currently checks only that it is nonempty; it does not enforce test mode. Independently confirm provenance and test-key format before running. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the delivery source being tested: the local Stripe listener for CLI forwarding, or the particular dashboard webhook endpoint for hosted delivery. These are different secrets. |

There is no application `DATABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_ANON_KEY`, Stripe publishable-key variable, or `NEXT_PUBLIC_*` credential entry in this example. Do not substitute an unrecognized name. The CLI's account access token and database password are separate credentials, not replacements for application API keys. No database connection string is needed by the current application; a future direct PostgreSQL validation runner may need one separately.

### Supabase key-format distinction

The **variable name is legacy**, but application code does not require a legacy JWT-format `service_role` key. `requiredSecret()` accepts a nonempty string and `privilegedDatabase()` passes it to `createClient()` without decoding it as a JWT.

The installed `@supabase/supabase-js` version is **2.117.1**. Its `src/lib/fetch.ts` explicitly recognizes `sb_publishable_` and `sb_secret_` formats. Consequently, the current code/SDK can accept a modern secret key in **`SUPABASE_SERVICE_ROLE_KEY`**; no rename is required. Legacy `service_role` credentials also fit the existing interface. Actual hosted authorization with either format has not been tested here. A Supabase project secret key is not a user access token or JWT signing secret.

Keep the privileged key server-only. Never introduce a `NEXT_PUBLIC_*` alias or use the privileged client to demonstrate user RLS isolation.

### Loading the future private environment

Next.js does not automatically load an arbitrarily named `.env.staging.local` during normal development/production commands. Do not set `NODE_ENV=staging`. Once the file exists, a compatible Node runtime can load it into the server process explicitly, for example:

```powershell
node --env-file=.env.staging.local node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100
```

This is a future command, not executed in this preparation. It requires Node with `--env-file` support and an available port. Existing process environment variables can override file values; verify their provenance without printing values. Do not copy secrets into source files, fixtures, terminal transcripts, screenshots, or this checklist.

## CLI installation prerequisites

Install only the two required CLIs before future remote validation:

- **Supabase CLI:** use its official Windows release executable and place its directory on PATH, or its supported Scoop installation. A project-local CLI installation is another option but would change dependencies and the lockfile. Do not confuse the existing JavaScript SDK with this tool. Docker is needed for the local Supabase container stack, not merely for linking a hosted project and pushing migrations.
- **Stripe CLI:** use its official Windows release executable and place its directory on PATH, or its supported Scoop installation.

Use official vendor installation instructions when installation is authorized. No installers were downloaded or run. Open a fresh terminal after PATH changes and check:

```powershell
supabase --version
stripe --version
```

The command sequence below uses standalone executables on PATH. CLI versions and their installed `--help` output must be checked then; neither CLI is presently available to verify its flags locally.

## Future Supabase command sequence — not executed

Run from the repository root, only after confirming an isolated non-production target. Replace `STAGING_PROJECT_REF` with the dashboard project reference, not a secret.

```powershell
supabase init
supabase login
supabase link --project-ref STAGING_PROJECT_REF
supabase migration list
supabase db push --dry-run
supabase db push
supabase migration list
```

1. `init` creates local CLI configuration, currently missing. Review its generated changes; do not force-overwrite existing files or change migration semantics.
2. `login` authenticates the operator account. Use the CLI's private interactive authentication; do not place tokens on command lines or in documentation.
3. `link` selects the staging project. Supply the staging database password privately if prompted. Verify the selected project before continuing.
4. Inspect remote migration history and unrelated schema objects before push. The migrations contain broad public-schema grant/revoke operations, so this must be a dedicated staging project.
5. Review the dry-run plan before applying. Stop for unexpected history or schema conflicts; do not reset, repair history, or rewrite domain rules merely to get a successful push.
6. Confirm applied history afterward. The intended file order is:

   - `202609250001_foundation.sql`
   - `202609250002_authorization.sql`
   - `202609250003_supporting_records.sql`
   - `202609250004_boundary_hardening.sql`

No `--include-seed`, `db reset`, or migration repair is part of this sequence. Existing seed data must be reviewed for hosted suitability before any separately authorized use. The `.env.staging.local` application file does not automatically authenticate the CLI.

## Stripe webhook and future local forwarding

Existing route: **POST `/api/stripe/webhook`**, implemented in `src/app/api/stripe/webhook/route.ts`.

The route verifies the raw body against `stripe-signature`, then inserts the event into `webhook_events` with duplicate-event protection. Missing/invalid signatures return 400; persistence failure returns 503. It is an inbox only: it does not charge customers, transfer contractor funds, or reconcile payment status.

After installing the CLI, selecting the correct sandbox/test account, and starting the configured local server:

```powershell
stripe login
stripe listen --forward-to http://127.0.0.1:3100/api/stripe/webhook
```

Do **not** add `--live`. Confirm that the CLI account/context and API key refer to the intended sandbox/test environment. Privately save the listener's signing secret as `STRIPE_WEBHOOK_SECRET` and restart the application to load it before sending test events. The listener displays that secret, so do not capture its startup output in agent logs, shared screenshots, reports, or recorded terminals. This command was not run here.

Local CLI forwarding does not require registering a localhost URL as a dashboard endpoint. Successful webhook persistence also requires working staging Supabase credentials and the migrations. No trigger command or payment operation is authorized by this preparation task.

## Manual Supabase dashboard actions

Required operator setup before future validation:

- [ ] Create or select a dedicated non-production project under an organization you can administer. Confirm there are no production or unrelated application records. Record the project name/reference and non-production designation without recording secrets.
- [ ] Wait for the database to be ready. Ensure your account can link the project and apply migrations. Resolve any organization permissions or network restrictions that block CLI/database/API access.
- [ ] From project API settings, obtain the project URL, publishable key, and privileged secret key (or legacy `service_role` key). Store values privately in the exact environment names above. Do not retrieve JWT signing secrets as a substitute.
- [ ] Retain the project's database password privately for CLI linking. If it is unavailable, use the dashboard's supported password reset only after considering other staging clients. If a future runner requires a PostgreSQL URL, obtain the suitable direct/session-pooler connection details through Connect; do not invent a connection string.
- [ ] In Auth settings, verify password/email authentication is available for synthetic validation accounts and TOTP MFA enrollment is enabled/available. Do not weaken MFA enforcement or globally disable security checks to simplify testing.
- [ ] Confirm the Data API can expose the required `public` schema and that `private` is not exposed. Do not broaden schema exposure or table grants to bypass authorization errors.

Conditional actions, only if their corresponding validation path needs them:

- [ ] Configure the local site URL and explicit redirect allowlist if redirect-based Auth is tested. Current bearer-token verification does not require building a redirect/login UI. Do not add broad wildcard production redirects.
- [ ] If your organization restricts API-key creation, MFA, database connectivity, or project access, have its administrator enable the specific staging permission. Record the blocker if unavailable.

Actions that can be performed by the later authorized validation runner rather than manually in dashboards:

- Create synthetic confirmed Auth identities using the admin API without sending real email; create protected profile rows for admin, dispatcher, contractor, and customer roles. There is no separate `owner` role required by this checklist. Role assignment must be trusted provisioning, never user-editable metadata.
- Enroll/challenge TOTP for synthetic staff and obtain genuine AAL2 sessions. A dashboard setting alone does not prove staff MFA enforcement. No authentication UI needs to be built.
- Provision private `job-evidence`, `contractor-documents`, and `contractor-tax-documents` buckets with explicit actor/object policies. The current migrations do not provision these buckets or Storage policies. Merely toggling “private” is insufficient; use synthetic files and test access revocation.
- Apply migrations with the reviewed CLI sequence and execute the hosted authorization matrix in `Milestone_1_5_Staging_Validation.md`. Do not paste migration SQL manually in addition to CLI application.

## Manual Stripe dashboard actions

- [ ] Create/select the intended sandbox, or explicitly select the account's test environment. Confirm the organization/account and non-production context before retrieving keys or authorizing the CLI.
- [ ] Obtain its test secret API key privately and save it as `STRIPE_SECRET_KEY`. Confirm test-mode provenance; the current server does not reject a live key automatically.
- [ ] During the future `stripe login` browser authorization, authorize the intended test/sandbox account. Resolve account permissions if the correct environment cannot be selected.
- [ ] For **local CLI forwarding**, no dashboard webhook endpoint is required. Use the listener-issued signing secret, not one copied from an unrelated dashboard endpoint.
- [ ] Only if testing direct delivery to a deployed staging server later: create a test/sandbox webhook event destination in the dashboard (Workbench/Webhooks), using the actual HTTPS staging URL ending `/api/stripe/webhook`; choose the events required by that validation; privately save that endpoint's signing secret. No hosted URL currently needs to be invented or deployed for this preparation.

No live activation, real payment, real refund, Connect account, contractor transfer, product catalog, public checkout, or additional service setup is required for the present foundation.

## Completion and remaining prerequisites

Only this document was added. No application source, configuration, dependency, migration, or credential file was changed. Typecheck and lint were intentionally not run because the requested condition (source/configuration changes) did not occur. No automated or hosted validation was performed in this preparation.

Before Milestone 1.5 can resume: provide the private staging configuration through the agreed local mechanism, install the two CLIs, confirm dashboard access/project isolation, and authorize the separate hosted run. Real Auth/RLS, MFA, guest capabilities, configuration immutability, Storage policies, and Stripe delivery remain unverified. This checklist does not change the blocked validation report into a successful result.
