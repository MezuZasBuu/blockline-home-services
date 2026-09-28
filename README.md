# Blockline Home Services

Milestone 1 implements the application and security foundation for a Philadelphia dryer-vent service business. Milestone 2A adds the Blockline visual system and public homepage shell. Public booking logic, dispatch UI, service delivery workflows, and live money movement are not implemented. Milestone 1.5 is blocked pending external staging infrastructure, as directed by the user.

See [the visual system](docs/Visual_System.md) for tokens, components, accessibility behavior, content boundaries, and image provenance. The public shell runs without external account credentials and collects no customer information.

## Local development

Requires Node.js 22+ and pnpm. Dependencies are pinned by `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm dev
```

Copy `.env.example` to `.env.local` and supply the Supabase project linked to this repository: URL, publishable key, service-role secret (`sb_secret_` keys use `SUPABASE_SERVICE_ROLE_KEY`), and exact application origin. You may instead keep staging values in `.env.staging.local`; the app loads that file first, then `.env.local` overrides. The prelaunch page and local tests work without real service credentials. Do not put privileged values in `NEXT_PUBLIC_*` variables or commit env files.

Verify API wiring (read-only):

```sh
pnpm db:verify
pnpm dev
# then open http://localhost:3000/api/health/supabase (development only)
```

Apply hosted migrations with the Session Pooler URL in `SUPABASE_DB_URL` (CLI only, not used by the Next.js server):

```sh
pnpm db:migration:list
pnpm db:push:dry-run
# after reviewing output: node scripts/supabase-db.mjs db push --skip-vault
```

Optional: `npx supabase login` and `npx supabase link --project-ref YOUR_REF` to associate the CLI with the same project. Migration application for Milestone 1.5 should follow `docs/Milestone_1_5_Staging_Validation.md`.

Run SQL files in `supabase/migrations` in filename order using the Supabase migration owner. Auth roles and `auth.users`, `auth.uid()`, and `auth.jwt()` must already exist (provided by Supabase). Use `supabase/seed.sql` only for development: it creates an inactive service and incomplete draft configuration, never a published price. There are no seeded passwords, staff accounts, real customers, or live payment credentials.

The automated tests run the actual migration SQL in PGlite, an embedded PostgreSQL engine. Tests emulate only Supabase's Auth identity functions and roles, then execute table permissions, RLS, triggers, and RPCs. This is not a substitute for final integration tests against hosted Supabase Auth, PostgREST, Storage, and Stripe test mode.

## Structure

- `src/app`: minimal application shell and foundation API routes.
- `src/modules/auth`: verified identity and server authorization.
- `src/modules/configuration`: validated versioned operating settings.
- `src/modules/guests`: random, hashed, booking-scoped capabilities.
- `src/modules/payments`: server-only Stripe adapter contracts and signature verification.
- `src/server`: environment validation, database clients, HTTP protections.
- `supabase/migrations`: schema, permissions, security functions, triggers.
- `tests`: synthetic data, database security/integration checks, domain and route tests.
- `docs`: implementation decisions and milestone report.

## API foundation

| Endpoint | Access | Function |
|---|---|---|
| `GET /api/admin/configurations` | Verified active admin with MFA | List configuration versions |
| `POST /api/admin/configurations` | Same, plus same-origin request | Create validated draft |
| `POST /api/admin/configurations/:id/publish` | Same | Validate and publish immutable version |
| `GET /api/contractor/assignments/:id` | Verified owning contractor | Restricted offer or active-assignment projection |
| `POST /api/guest/exchange` | Same origin plus unguessable single-use token | Establish HttpOnly booking-scoped cookie |
| `GET /api/guest/appointment` | Valid guest session cookie | Read only the authorized appointment |
| `POST /api/stripe/webhook` | Valid Stripe signature | Persist deduplicated event inbox |

Staff and contractor API requests currently use Supabase bearer access tokens. Roles are loaded from operator-controlled `profiles`; user metadata cannot grant staff privileges. Browser login, MFA enrollment, email delivery, and guest-link UI arrive with the corresponding product milestones. There is no public token-issuance route and no endpoint accepting a client-selected actor, charge amount, or contractor identity as authorization.

Provision the initial admin through a trusted Supabase operator after creating its Auth user. Insert its profile with role `admin`, and enroll MFA through Supabase before calling admin APIs. Never self-provision roles from signup metadata.

## Guest access lifecycle

Future booking creation will create a customer with `profile_id = null`; no account is needed. After that trusted transaction, an internal service issues a 256-bit random token. Only its SHA-256 hash is stored. A future emailed link should carry the token in its URL fragment, clear it from browser history, and exchange it with a same-origin POST; do not consume links on GET because email scanners may follow them.

Tokens expire after 30 minutes and are atomically single-use. Exchange creates a new random session capability, stored only as a hash, with a 24-hour expiry. The cookie is HttpOnly, SameSite Strict, Secure in production, and scoped to guest API routes. Revoking booking access revokes existing sessions too. A session never selects another booking by supplied ID. Account linking must require verified ownership later; matching an email string is insufficient.

Before exposing booking/recovery publicly, add trusted-edge rate limiting, generic recovery responses, and transactional email delivery. No email recovery or issuance endpoint is publicly exposed in this milestone.

## Progressive contractor access

Contractors have no direct base-table reads for jobs, customers, addresses, documents, or payments. Their RPC returns only service, ZIP, appointment window, administrator-defined scope, sanitized condition codes, payout, and offer status. Raw customer answers and photos are not returned in offers.

Customer name, phone, exact address, and access notes are returned only for an accepted, staff-confirmed assignment with unexpired access, current compliance, an active operational job, and an active contractor profile. Completion, cancellation, assignment release, suspension, compliance failure, or access expiry removes those fields on subsequent reads. Information already seen cannot be remotely erased; do not cache customer details or provide bulk downloads. Default access expires at the appointment end. Any future late-job extension needs a staff-authorized, audited operation.

## Configuration and compliance

Economics and rules live in draft/published configuration versions with effective timestamps. Published versions cannot be changed or deleted. Booking creation copies the full referenced settings into immutable accepted terms. New prices never rewrite old jobs. Required compliance uses the union of accepted-job requirements and the current effective requirements, so new safety requirements apply without silently dropping historical obligations.

The assignment trigger enforces eligibility even for direct server-side SQL. Offers, acceptance, confirmation, and rescheduling recheck required documentation and validity through appointment end. Expired or absent requirements fail closed. Compliance edits and assignment decisions lock the contractor row. Performance status never overrides compliance. Seeded incomplete configurations cannot publish.

## Payment architecture

Supported policy modes are `collect_at_booking_charge_after_verification`, `pay_after_verification`, and `charge_at_booking`; none is selected for production. Booking settings retain their selected policy and consent version.

The deferred design uses Stripe-hosted Checkout in setup mode to collect a card without an immediate charge. Stripe collects card data; Blockline server code creates Stripe objects and verifies webhooks. No card number/CVC belongs in the Blockline database or frontend code. After verified completion, a server-created PaymentIntent can use the saved method off-session, with recorded consent and a stable idempotency key.

Issuer authentication may still be required. Model `requires_action` and later provide a secure authentication/recovery link using the saved method. Do not promise that every future charge can succeed without customer interaction.

Milestone 1 provides parameter builders, prerequisites, schema, and a signature-verified durable webhook inbox. It does not create live SetupIntents, charge customers, process webhook business transitions, or transfer contractor payouts. The later processor must validate booking/customer/object association, expected amount/currency, ordering, and replay safety before marking payment methods ready or payments paid. Invalid signatures fail; storage failures return a retryable response. Only test-mode keys should be configured during development.

## Scope and unresolved launch configuration

Only dryer vent cleaning is supported. No other service, marketplace, membership, automated routing, native application, or automated contractor payout is built.

Still required: ZIP cluster, price, vent limit, surcharges, exclusions, qualification exception rules, margin threshold, contractor rates, customer terms and payment consent, compliance requirements and verification evidence, actual Supabase/Stripe accounts, email provider, and launch hosting. Administrator configuration currently has a protected API, not a dashboard form.
