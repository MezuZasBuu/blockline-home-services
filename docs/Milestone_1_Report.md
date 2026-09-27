# Milestone 1 implementation report

Completed scope: repository/application foundation, database migrations, authentication and authorization foundation, versioned configuration, development seed, and synthetic test fixtures. The remaining product milestones have not been built.

## Implemented

- Next.js and TypeScript modular-monolith foundation, prelaunch page, environment template, dependency lockfile, lint/type/test scripts, and CI workflow.
- Four ordered PostgreSQL migrations covering identity, guest customers, properties, leads, accepted booking terms, contractors, compliance, assignments, operational evidence, separate financial and follow-up states, supporting Phase 1 records, and audit history.
- Deny-by-default table permissions and row-level security. End users use narrow authorized functions rather than broad base-table access.
- Supabase-verified authentication; roles come from protected profile records, never user-controlled metadata. Active staff accounts require MFA for administrative/dispatch functions.
- Guest-only customers require no authentication user. Single-use 256-bit capabilities exchange into HttpOnly booking-scoped sessions. Only hashes are stored. Expiration, replay protection, and revocation are enforced in the database.
- Administrator configuration API for draft creation, listing, and publication. Economics, territory, scope, qualification rules, surcharges, exclusions, compliance requirements, and payment policy are versioned. Published configuration and accepted booking terms are immutable.
- Database triggers prevent offers and assignments to contractors with missing/expired required compliance. Acceptance, confirmation, and rescheduling recheck requirements. Assignment decisions serialize through contractor locks; conflicting accepted appointments are rejected.
- Restricted offer projection. Customer name, phone, exact address, and access notes require owning contractor, accepted assignment, staff confirmation, active account, current eligibility, an operational job, and an unexpired access window. Completion, cancellation, release, suspension, or expiry removes identity fields on subsequent reads.
- Separate operational job, customer-payment, contractor-payout, issue, review-request, and repeat-service state types and records.
- Server-only Stripe setup/deferred-charge parameter builders, prerequisite validation, signed webhook ingestion, and duplicate-safe durable event inbox.
- Development seed with an inactive dryer-vent service and incomplete draft. Synthetic test data uses unrelated sample prices and fictitious identities; there are no published production prices or seeded credentials.
- Approved implementation amendments incorporated into the specification.

## Validation results

| Check | Result |
|---|---|
| Automated tests | 35 passed across three suites |
| Database/security integration tests | 22 passed; actual migrations executed in embedded PostgreSQL |
| HTTP handler/authentication/webhook tests | Six passed |
| Domain/configuration/payment-contract tests | Seven passed |
| TypeScript | Passed with no errors |
| ESLint | Passed with zero warnings |
| Production Next.js build | Passed |
| Running-app HTTP smoke checks | Six expected responses verified |

Runtime checks confirmed the prelaunch page returns 200; unauthenticated admin, guest appointment, and contractor endpoints return 401; unsigned Stripe webhooks return 400; guest token exchange via GET returns 405. All checked routes return `Cache-Control: no-store`.

Authorization tests cover anonymous denial, profile self-promotion denial, another contractor's assignment denial, staff MFA and disabled accounts, incomplete and malformed configuration, immutable prices, absent/expiring compliance, newly effective requirements, assignment conflicts, identity redaction before confirmation and after operational access ends, token replay/expiry/revocation, and independent state records.

Stripe boundary tests use locally generated test signatures and mocked storage; no external Stripe API was called. Database integration tests use PGlite with a minimal Supabase Auth identity contract, not a live Supabase project. CI is configured but has not been run on a remote repository.

## Assumptions

1. Guest links expire after 30 minutes and exchanged sessions after 24 hours. These are security defaults, not finalized customer-service policy.
2. Staff confirmation is distinct from contractor acceptance. Identity access expires at the appointment end by default and closes immediately when work is completed/cancelled. A later staff-authorized extension flow may be needed for delayed jobs.
3. Compliance uses both the accepted booking requirements and newly effective current requirements. Historical requirements are not silently weakened.
4. Staff and contractor authentication is currently an API foundation using verified bearer tokens. Login, MFA enrollment UI, guest-link email/UI, and optional customer account linking belong to subsequent milestones.
5. Hosted Stripe Checkout collects card details. All Blockline Stripe operations remain server-side. Saved methods may still require issuer authentication; the later payment workflow must handle `requires_action` without treating the job as paid.
6. Administrative configuration currently has an API, not a dashboard form. Required insurance details are configured and verified by authorized staff; the software does not decide legal applicability.

## Not activated or included

- No public booking workflow, production account provisioning, or live service launch.
- No real Supabase migrations applied, hosted Auth/Storage integration verified, or private buckets provisioned.
- No real payment-method collection, charges, refunds, webhook business-state processing, or contractor transfers.
- No transactional email provider, guest recovery endpoint, or public recovery issuance. Add trusted-edge abuse controls before exposing those flows.
- No other service categories, public contractor profiles, bidding, customer contractor selection, memberships, automated routing, native apps, or automated payouts.

## Configuration still required

Launch ZIPs; approved price and contractor payout; vent length and scope; surcharges and exclusions; qualification exceptions; margin threshold; consent/payment policy; cancellation/refund/callback terms; required compliance and acceptable supporting evidence; Supabase/Stripe test projects; email provider; hosting/domain.

## Next milestone

Milestone 2 is the responsive customer-facing website using the approved Blockline positioning. Continue in bounded milestones and repeat tests, type checking, linting, and authorization verification after each milestone. Do not enable booking or accept live payments until the relevant later workflows and launch configuration are complete.
