# Milestone 1.5 hosted staging validation

## Latest credential refresh recheck — 2026-09-26

**Status: read-only prerequisites still fail; no deployment or hosted mutations authorized by the conditional continuation were performed.** This recheck follows the user's confirmation that the private staging credentials were refreshed. Earlier test results below are historical, not rerun results for this recheck.

| Requested check | Fresh result |
|---|---|
| Environment secrecy / Git exclusion | Loaded the designated workspace `.env.staging.local` privately; still ignored and untracked. No values printed or copied. |
| Publishable API access | REST HTTP 401 |
| Privileged API access | REST HTTP 401; installed SDK Auth admin HTTP 401 |
| Database authentication | Session Pooler rejects password authentication |
| Target/project consistency | Pooler username project reference matches configured Supabase API project reference; session port 5432. Account/project isolation cannot be independently verified without authenticated access. |
| Remote migration history | Not readable because database authentication failed; no history changes made |

Additional local format checks found exactly one definition each of `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_DB_URL`; all are nonempty and have no surrounding whitespace. The publishable value has the recognized modern prefix. The privileged value has neither the recognized modern secret-key prefix nor a decodable legacy JWT format. Values were not displayed, transformed, or replaced.

Stopped before migration dry run/application, synthetic user creation, MFA/RLS/guest/Storage testing, and webhook delivery. No linking, personal-access-token, or Management API operation was used. No source, migration, or environment file changed; only this report was updated. Local tests/typecheck/lint/build were not repeated in this read-only recheck; their most recent successful results are recorded below. Milestone 2B remains untouched.

To resume, privately verify the saved entries in the exact workspace environment file against the staging project's API keys and Session Pooler connection details. The privileged entry must be the project's server API secret key or legacy service-role key, not another credential type. Verify the database password and URL encoding separately. Do not send any values in chat. Milestone 1.5 remains not ready for approval.

## Latest attempt: direct database connection — 2026-09-26

**Status: blocked by database password authentication and Supabase API-key rejection. No remote database mutations performed.** This update supersedes all earlier instructions to log in, link a project, list projects, or troubleshoot personal access tokens. Only the direct database path is authorized going forward.

### Connection and deployment results

- Reconfirmed `.env.staging.local` is ignored by `.gitignore` and is not tracked. Loaded it privately with Node's environment parser; no credential values or database URL were printed or written to reports/source.
- Inspected installed Supabase CLI 2.118.0 help for `db query`, `migration list`, and `db push`. Each supports `--db-url`; `db push` supports `--dry-run` and `--skip-vault`.
- Parsed the supplied `SUPABASE_DB_URL` privately. It already uses the **Session Pooler on port 5432**, and its project reference matches the configured Supabase API URL. The user's dedicated non-production designation is recorded. This confirms configuration consistency, not successful inspection of the database or proof that it contains no production data.
- Attempted a read-only transaction to inspect expected database/platform schemas, presence of migration history, and public/private table inventory using CLI `db query --db-url`. PostgreSQL rejected the connection with **password authentication failed**. The failure is authentication, not an observed IPv6 routing failure; switching to Session Pooler has already occurred in the supplied configuration.
- Could not inspect remote migration history/schema. Consequently **no dry run or migration application was attempted**. Applying before inspection would violate the requested sequence. Remote migration history was not modified.
- No `supabase link`, `projects list`, Management API call, personal-access-token troubleshooting, Dashboard SQL, reset, history repair, or seed execution was used.

The pending sequence remains: read-only target/schema/history inspection; `migration list --db-url`; `db push --db-url --dry-run --skip-vault`; review the plan; `db push --db-url --skip-vault`; verify migration history. The private URL is supplied only through the local helper's child-process argument, never as a literal tool command or logged argument. The four existing migration files remain unchanged and must apply in their existing order.

### Other validation results

| Area | Result this attempt |
|---|---|
| Supabase publishable REST access | HTTP 401 |
| Supabase privileged REST access | HTTP 401 |
| Supabase Auth admin through installed SDK | HTTP 401; no user data returned or printed |
| Hosted synthetic Auth / genuine MFA / AAL2 | Blocked; no identities created |
| RLS, customer/contractor isolation, disabled-account and self-promotion denial | Not run; gateway key rejection is not evidence of application authorization behavior |
| Compliance / assignment gates / restricted identity lifecycle | Not run hosted |
| Guest hashing, expiry, replay, revocation and booking scope | Not run hosted; existing local suite passes |
| Published configuration / historical terms and payout immutability | Not run hosted |
| Private Storage | No buckets, objects, or policies created/changed; hosted authorization testing blocked |
| Stripe sandbox API | Read-only SDK request authenticated; returned `livemode=false`. No balance amounts or account details printed |
| Stripe signature verification | Locally signed synthetic payload verified with configured signing secret; modified payload correctly rejected |
| Stripe forwarding and durable inbox | Not validated end-to-end; Supabase credentials prevent persistence. Local signature verification does not establish Stripe event delivery |
| Stripe mutations | None: no customer object, charge, refund, transfer, or real event created; no live mode |
| PGlite differences | No hosted domain comparison yet. Authentication failures are infrastructure blockers, not demonstrated database behavior differences |

### Local checks and changes

- Full automated suite: **40 passed across four files** (22 database, six route/auth, seven domain, five public shell).
- TypeScript: **passed**, `tsc --noEmit`.
- ESLint: **passed**, zero warnings; existing `.pnpm-store` dependency cache excluded.
- Production build: **passed**, Next.js 16.3.6; all eight pages generated.
- Added only ignored `tmp/staging-cli/direct-db.cjs` as a credential-safe CLI wrapper and this documentation update. The wrapper validates target-reference consistency, captures output, suppresses raw failure output, and redacts connection details from successful output. It contains no credential values.
- No source, dependency, configuration, migration, or private environment values changed in this attempt. No new tests were added because no hosted domain discrepancy has been discovered. Existing work preserved; Milestone 2B not started.

### Remaining action and approval recommendation

Privately verify the Session Pooler database password and its URL encoding in `SUPABASE_DB_URL`. Also verify both Supabase API keys belong to the project identified by `SUPABASE_URL`; both currently return 401. Save corrections only in the ignored environment file and confirm readiness without sharing any values. No CLI linking or personal access token is needed. No alternate pooler address or credential was guessed.

**Milestone 1.5 is not ready for approval.** Hosted migrations, Auth/MFA, database/Storage authorization, guest capabilities, and end-to-end webhook persistence remain unverified. Continue only this milestone once credentials work.

## Historical reconciliation and resumed attempt — 2026-09-26

**Status: PAUSED for Supabase account authorization and correction of staging API credentials. Not ready for approval.** The historical attempt below is retained; its missing-file statement is superseded by this update.

### Repository reconciliation

- Inspected working-tree and staged Git diffs and status. Neither diff has entries because the repository has no commits and all project files are untracked. There is no Git baseline from which to attribute edits to Cursor or prove exact changes since the earlier attempt.
- Read `AGENTS.md`, `CLAUDE.md`, README, the approved specification/amendments, all five existing documents in `docs`, and reviewed the current migrations, server authentication/authorization, guest capabilities, payment adapters/routes, configuration model, public shell, tests, and build/security configuration.
- Current reviewed security behavior remains consistent with the approved modular monolith: protected profile roles, active-account checks, staff AAL2 gates, denied direct business-table access, narrow contractor projection, compliance checks, immutable configuration/price snapshots, hashed guest capabilities, separate state records, and server-only Stripe inbox. No material architecture/security conflict was identified in that review. This is not a claim of hosted validation or byte-for-byte equivalence to a prior checkout.
- Confirmed change relative to the prior recorded attempt: `.env.staging.local` now exists with nonempty Supabase URL, publishable-key, privileged-key, application-origin, and Stripe test-key entries. The webhook secret was initially blank as the user intended. Existing documentation describing absent infrastructure is historical, not current evidence.
- No existing source, migrations, dependencies, or Cursor work was overwritten or discarded. No commit was created.

### Measured results

| Requested category | Current measured result |
|---|---|
| Staging target | Configured URL has hosted Supabase format and Auth health returns HTTP 200. The user identifies it as dedicated non-production. Account/project identity and database isolation cannot yet be independently confirmed. |
| Credential exclusion | `git check-ignore -v .env.staging.local` matches `.gitignore` line 3; `git ls-files -- .env.staging.local` is empty. No secret values were printed or included in this report. |
| Supabase API access | Publishable REST request: HTTP 401. Privileged REST request: HTTP 401. Installed SDK Auth admin request: HTTP 401. Response bodies and values were suppressed. These are failed credential checks, not successful anonymous/RLS-denial tests. |
| Privileged-key format | Configured value was neither recognized as a modern `sb_secret_` key nor decodable as a legacy service-role JWT. No transformation or replacement was guessed. |
| Supabase CLI | Official portable CLI 2.118.0 installed under ignored `tmp/staging-cli/supabase`. Account project listing unavailable; interactive login requested. No project linked. |
| Hosted migrations | None applied in this attempt. All four existing migration files preserved. Hosted migration history/schema inspection is blocked by account/database access. |
| Hosted Auth scenarios | No synthetic identities created. Admin, dispatcher, contractor, customer sessions and genuine TOTP/AAL2 tests pending. Health response alone is not an Auth integration pass. |
| RLS/customer/contractor isolation | Not run. User-authenticated sessions and migrated schema unavailable. No privileged bypass was substituted for an RLS test. |
| Compliance/assignment/identity lifecycle | Not run hosted. Offer/acceptance/confirmation, expiration/release/completion/cancellation/suspension, and required-compliance gates remain pending. |
| Guest capabilities | Hosted hash storage, expiry, replay, revocation, and booking scope pending. Local existing tests pass. |
| Configuration/history | Hosted publication/versioning, historical price, accepted terms, and payout immutability pending. |
| Private Storage | No buckets or policies created or changed. All three proposed buckets and synthetic object authorization tests pending valid credentials and schema access. |
| Stripe | Official portable CLI 1.52.0 installed under ignored `tmp/staging-cli/stripe`. Configured key passes `sk_test_` format check. `stripe listen --print-secret --skip-update` authenticated in default test mode using the key through a child-process environment, without putting it on a command line. |
| Stripe signing secret | Listener-issued secret saved directly into the previously blank `STRIPE_WEBHOOK_SECRET` entry in ignored `.env.staging.local`. Other entries preserved, with a concurrent-change check before writing. CLI stdout/stderr captured privately in memory and never printed or saved as a transcript. |
| Stripe webhook forwarding | Persistent forwarding/event delivery to `/api/stripe/webhook` and signature-to-database persistence remain untested. The secret-retrieval process exited; no listener remains running. Invalid Supabase credentials block successful inbox persistence. No real or test charge, refund, transfer, or customer object was created. |
| PGlite/hosted differences | No domain-behavior comparison is possible yet. Credential rejection is an infrastructure finding, not a PGlite discrepancy. Existing local harness limitations below still apply. |

### Changes made

- Added this current update while preserving the prior attempt as history.
- Installed only the two required portable CLIs in ignored `tmp`; no package or lockfile changes and no system PATH changes.
- Added an ignored, temporary `tmp/staging-cli/stripe-prepare.cjs` helper to capture the listener secret and update only the intended blank environment entry. The helper contains no credential values.
- Updated only the authorized signing-secret entry in the private staging environment. Neither Supabase entry was changed.
- No migration correction or new test was warranted: no hosted domain discrepancy has been observed. No Milestone 2B or public booking work began.

### Fresh local checks

| Check | Result |
|---|---|
| Full automated suite | PASS: 40 tests, four files; 22 database, six route/auth, seven domain, five public-shell |
| TypeScript | PASS: `tsc --noEmit` |
| ESLint | PASS: zero warnings, existing local `.pnpm-store` dependency cache excluded |
| Production Next.js build | PASS: Next.js 16.3.6, all eight generated pages; no infrastructure connection implied |

The initial sandbox test attempt could not load the Vitest configuration because esbuild was denied filesystem access. The approved rerun outside the sandbox passed. Initial sandbox network probes were also blocked; approved read-only probes reached Supabase and returned the statuses above. Supabase CLI needed its normal local settings-directory access even for version/help. None of these issues was addressed by weakening an application authorization rule.

### Required operator actions to resume

1. In a private editor, verify **both** `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` against the API keys belonging to the configured dedicated staging project. Both returned 401. Use the exact environment names; do not paste values into chat. Keep the listener-issued Stripe secret private.
2. In your own PowerShell terminal at the repository root, run:

   ```powershell
   .\tmp\staging-cli\supabase\supabase.exe login
   ```

   Complete browser authorization for the account owning the staging project. Enter any verification code only in that terminal. Do not share the code or account token in chat.
3. Confirm completion without sending secrets. Then the next authorized operations are read-only project/isolation checks, CLI initialization/linking, migration-history inspection/dry-run, and the hosted matrix. A separate database permission/password may still be required; none was supplied in the current staging file and no substitute was invented.

Stripe browser login is not currently required: its configured test key authenticated. Milestone 1.5 remains incomplete until the hosted results above are measured. No later milestone may start automatically.

CLI installation/authentication references checked for this attempt: [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started), [official Supabase CLI repository](https://github.com/supabase/cli), and [Stripe CLI API-key usage](https://github.com/stripe/stripe-cli/wiki/using-stripe-api-keys). Installed CLI help was also inspected.

## Historical attempt — 2026-09-25

Status: BLOCKED at the staging configuration file check on 2026-09-25. The user has reauthorized Milestone 1.5 and identified `.env.staging.local` as non-production, but that file is absent from this workspace. Milestone 2B and later product work are not authorized and have not started.

## Access check

Verified before any attempted credential use:

- `git check-ignore .env.staging.local` confirms the filename is ignored.
- `git ls-files -- .env.staging.local` returns no tracked file.
- The exact expected path, `C:\Users\Chris\Documents\ChatGPT\Home services\.env.staging.local`, does not exist.
- Only `.env.example` and the framework's `next-env.d.ts` match environment-related filenames in the workspace root.
- No Supabase, Stripe, staging, or database-connection variables are present in the process environment.

No secret values were read or printed. No remote project was contacted or changed, no identities were created, and no production data or credentials were used. The user was asked only to save the specified local file or identify its actual path, not to disclose values in chat.

Hosted work is authorized but cannot begin until the specified staging configuration is accessible. Once accessible, the next step is a read-only target/provenance check before any migration or resource mutation. The user's non-production designation is recorded; the actual configured project cannot yet be independently checked.

## Migrations applied

None applied to a hosted database. The following existing migrations remain unchanged and passed execution in the current PGlite suite:

1. `202609250001_foundation.sql`
2. `202609250002_authorization.sql`
3. `202609250003_supporting_records.sql`
4. `202609250004_boundary_hardening.sql`

Before hosted application, confirm the target and inspect existing migration history and schema. The existing migrations include broad grants/revokes over public-schema objects, so use an isolated staging project and check for unrelated objects before running them. Do not reset an existing project or alter the intended domain rules to make deployment succeed. Record each actual migration outcome and any platform-specific error.

## Hosted authorization tests

Not performed. The hosted test matrix is pending:

| Identity / state | Required verification |
|---|---|
| Anonymous | No business-table reads/writes, no guest-token minting, no privileged configuration functions |
| Admin at AAL1 | Cannot administer configuration or dispatch |
| Admin after actual TOTP challenge at AAL2 | Can administer configuration; direct API calls still enforce immutable published settings |
| Dispatcher at AAL2 | Can offer/confirm eligible assignments but cannot administer configuration |
| Contractor A / B | Can read only own profile and assigned offer projection; cannot self-promote or inspect another contractor's assignment |
| Offer not accepted | No name, exact address, phone, raw customer answers, or identifying photos |
| Accepted but not confirmed | Customer identity still excluded |
| Accepted and confirmed | Identity available only while the operational access window and eligibility remain valid |
| Completed, cancelled, released, expired, or suspended | Customer identity removed from subsequent projection reads |
| Missing/expired required compliance | Offer, acceptance, and confirmation fail; rescheduling beyond validity fails |
| Customer A / B and guest A / B | No other-customer records; guest capability resolves only its own appointment |
| Guest token/session | Single-use exchange, expiry and revocation remain effective over the real API |
| Service role | Only exercised from trusted validation code, never used as evidence that a user RLS check passed |

Use synthetic confirmed test identities created through the Auth admin API without sending email. Establish real sessions through Supabase Auth. Enroll/challenge/verify TOTP for synthetic staff accounts and use the resulting signed access tokens; do not forge an `aal2` claim or use SQL `set_config` as a substitute for hosted authentication. Keep generated passwords, tokens, MFA secrets, and service keys out of logs and reports.

The current application checks both verified Auth identity and the protected profile record. The database additionally requires `auth.jwt()->>'aal' = 'aal2'` for staff functions. The hosted run must verify both layers and that refreshed tokens carry the expected assurance level.

## Private storage

No buckets or policies have been provisioned or validated. Milestone 1 intentionally had no storage migration; its tests do not exercise the Supabase Storage service.

The proposed staging bucket separation is:

| Private bucket | Intended contents | Required boundary |
|---|---|---|
| `job-evidence` | Synthetic before/after and cleanup files | No anonymous or unaccepted-offer access; assignment-scoped access ends with operational need |
| `contractor-documents` | Synthetic work examples, COIs and agreements | Contractor ownership; appropriate staff review; no cross-contractor access |
| `contractor-tax-documents` | Synthetic tax-document placeholders | Owner/admin restriction; no dispatcher or other-contractor access |

Finalize explicit storage policies against the hosted schema as part of provisioning. Private-bucket settings alone do not prove actor-specific isolation. Test upload, download, list, overwrite, delete, signed-URL issuance, cross-prefix access, and anonymous public URL attempts with small synthetic fixtures only. Prove that metadata and content are both protected. Use no actual W-9, identity, property, or insurance document.

Signed URLs are bearer access capabilities; expiry and any residual access after assignment closure must be measured and reported. Do not claim that withdrawing database permission instantly revokes a previously issued signed URL. Keep any validation URLs short-lived and never publish them in the report.

## Discrepancies and comparison

No hosted discrepancies have been observed because no hosted run occurred. Known limits of the current local harness are not findings of hosted failures:

- PGlite supplies test-only Auth identity functions and database roles. It does not issue real JWTs or exercise token refresh, revoked sessions, or TOTP enrollment/challenges.
- PGlite executes SQL functions directly. It does not exercise PostgREST schema exposure, function discovery, schema cache, HTTP error mapping, or Supabase platform default grants.
- PGlite does not run Supabase Storage or validate `storage.objects` policies, upload behavior, signed URLs, or cache effects.
- The current Stripe handler tests use local synthetic signatures and mocked persistence; they do not validate hosted webhook delivery.

No additional automated tests were added: there is not yet a hosted discrepancy requiring a regression test. Any discovered discrepancy must be recorded with its hosted evidence before introducing a focused correction/test.

## Code and configuration changes

- Updated this status report with the renewed authorization, exact missing-file blocker, Git exclusion evidence, and current local verification results.
- Existing domain code and four migrations are unchanged.
- No staging or Stripe credential values were created, guessed, copied, or configured.
- No hosted resources, storage permissions, UI, booking, payment collection, dashboard, email, additional services, or Milestone 2 functionality were added.

## Local verification rerun

| Check | Result |
|---|---|
| Existing Vitest suite | PASS: 40 tests across four files |
| Database tests | PASS: 22 PGlite tests |
| Handler/authentication tests | PASS: six tests |
| Domain tests | PASS: seven tests |
| Public-shell tests | PASS: five tests |
| Typecheck | PASS: `tsc --noEmit` |
| Lint | PASS: ESLint with zero warnings; local dependency cache excluded |
| Production build | PASS: Next.js build |

The passing production build is a compilation check. It is not a hosted deployment or proof of configured infrastructure.

The initial repository-wide ESLint process stalled while traversing the local package-cache directory. It was stopped and rerun successfully with `--ignore-pattern '.pnpm-store/**' --max-warnings=0`. Application, test, and configuration sources remained in scope. No lint rule or application behavior was changed.

## Unresolved infrastructure risks

1. The designated `.env.staging.local` file is absent; staging project identity, ownership, isolation, and credential provenance cannot yet be verified.
2. Hosted migrations, grants/RLS, PostgREST discovery, and privileged-function behavior remain untested.
3. Actual staff MFA assurance and contractor/customer sessions remain untested.
4. Storage buckets, policies, signed-URL behavior, and operational access revocation remain unprovisioned/unverified.
5. Stripe test-key and webhook-secret provenance remain unverified; no Stripe variables are configured.
6. There is no evidence yet of a PGlite-versus-hosted discrepancy or equivalence.

Milestone 1.5 must remain incomplete until the hosted matrix is executed and this report is replaced with measured results.

## Requested completion categories

| Category | Current result |
|---|---|
| Hosted migrations applied | None; all four existing migrations remain unchanged |
| Hosted Supabase Auth scenarios | Not run; no accessible staging configuration |
| Hosted RLS/database authorization | Not run; local database tests pass but are not hosted evidence |
| Private Storage buckets/policies | Not provisioned or validated |
| Hosted guest capabilities | Not run; local hashing, expiry, replay, revocation and scope tests pass |
| Hosted compliance/assignment gates | Not run; local gate tests pass |
| Stripe test mode | Not configured or contacted; local signature-handler tests pass with synthetic fixtures only |
| PGlite versus hosted differences | No actual comparison possible; harness limitations are listed above |
| Code/migration changes | None in this attempt; report updated only |
| Local checks | PASS: 40 automated tests, TypeScript, ESLint with zero warnings, and production Next.js build |
| Remaining blocker | Missing `.env.staging.local` at the user-designated workspace path |
| Approval recommendation | Not ready for Milestone 1.5 approval; hosted acceptance criteria are unverified |

## Reference documentation consulted

- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control): policies on `storage.objects` and privileged service-key bypass.
- [Supabase TOTP MFA](https://supabase.com/docs/guides/auth/auth-mfa/totp): enrollment, challenge/verification, and AAL1-to-AAL2 session transition.
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security): authenticated identity and policy behavior.
