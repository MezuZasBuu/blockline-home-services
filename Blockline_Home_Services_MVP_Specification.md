# Blockline Home Services MVP Specification

Status: Approved specification. Milestone 1 foundation implemented; later product milestones remain pending. The approved amendments below supersede conflicting earlier proposal language.

## Approved implementation amendments

1. Guest-first booking: no mandatory account. Appointment access uses a secure booking-scoped token/magic-link experience; optional account creation must not block booking or checkout.
2. Configurable payment policy: support securely collecting a method at booking without charging immediately, then charging after verified completion using the saved method. Keep Stripe API operations server-side and payment state webhook-verified. Issuer-required authentication remains a possible exception requiring customer action.
3. Versioned economics: administratively configure prices, contractor payouts, vent limits, surcharges, exclusions, margin thresholds, qualification exceptions, and effective dates. Preserve historical accepted terms.
4. Compliance hard gates: configured applicable requirements are enforced server-side and in database assignment checks; missing/expired required compliance prevents assignment.
5. Progressive contractor access: unaccepted offers show only service, approximate area/ZIP, window, scope, unusual conditions, and payout. Customer identity and exact location require accepted and confirmed assignment. Reduce access after the operational need ends.
6. Preserve separate operational, customer-payment, contractor-payout, issue, review-request, and repeat-service statuses.
7. Build Phase 1 dryer vent cleaning only. Exclude other service categories, bidding, public contractor profiles, customer contractor selection, memberships, automated routing, native apps, and automated contractor payouts.
8. Work in small milestones. Each milestone requires tests, type checking, linting, authorization verification, implementation summary, and unresolved configuration notes. Milestone 1 covers repository/application foundation, schema/migrations, authentication/authorization, configuration, and seed/test data.

## Purpose and source

Blockline Home Services is a Philadelphia service business that owns the customer relationship, pricing, booking, scheduling, payment collection, quality control, contractor payouts, reviews, and repeat marketing. Vetted independent subcontractors perform the physical work.

This specification consolidates the architecture proposal and the revisions made after reviewing the full 18-page `Winter_Service_Business_Improved_Launch_Plan_v2.pdf`. The user's request controls the scope. The plan supplies operating requirements; recruitment scripts, legal drafting checklists, and illustrative numbers are reference material rather than instructions to publish messages, execute agreements, or adopt prices automatically. The initially attached EHS résumé is not an operating specification.

Launch with dryer vent cleaning in a small Philadelphia ZIP-code cluster. Customers book with and pay Blockline. The customer experience presents Blockline as the accountable service company. Public contractor directories, bidding, lead sales, and customer selection of contractors are outside scope.

## Recommended stack

| Layer | Recommendation | Purpose |
|---|---|---|
| Application | TypeScript, React, Next.js | One application for the public website and private portals |
| Interface | Tailwind CSS and accessible components | Responsive, consistent mobile and desktop interface |
| Database | Supabase PostgreSQL | Relational operational and financial records |
| Authentication | Supabase Auth | Customer and contractor email sign-in; staff MFA |
| Storage | Private Supabase Storage | Job photos, insurance documents, agreements, and restricted tax documents |
| Customer payments | Stripe Checkout | Customer payment to Blockline after routine job completion |
| Notifications | Transactional email provider | Confirmations, offers, payment requests, receipts, and reminders |
| Background work | Scheduled worker with database outbox | Expiry checks, reminder scheduling, delivery retries |
| Hosting | Managed application hosting | Separate staging and production environments |

Hosting remains an implementation decision. If Sites is used, verify its current support for ordinary public customer and contractor authentication before committing to its runtime. Customers should not need a ChatGPT account to book service.

Technical references consulted during planning:

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage access controls](https://supabase.com/docs/guides/storage/security/access-control)
- [Stripe Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment)

## Application architecture

Use a modular monolith: one codebase and deployment, with modules for leads, qualification, quotes, bookings, CRM, contractors, dispatch, quality, payments, economics, and customer follow-up.

```text
Public website and customer access ─┐
Contractor portal ──────────────────┼─ Application server ─ PostgreSQL
Admin dashboard ───────────────────┘          │
                                             ├─ Private file storage
                                             ├─ Stripe Checkout
                                             └─ Notification outbox and worker

Verified Stripe webhooks ─ Application server ─ Payment records
Scheduled worker ─ Expiry checks, email delivery, review and repeat reminders
```

Enforce permissions, qualification rules, prices, and status transitions on the server. Use database transactions for assignment acceptance, scheduling, and financial approvals. Snapshot price, scope, payout, and policy versions so later changes do not alter historical jobs.

Keep files private and issue short-lived access links after authorization. Log administrative changes, overrides, reassignment, refunds, financial adjustments, and issue resolution. Verify payment webhook signatures and deduplicate provider event IDs. A browser success page alone cannot mark a customer payment paid.

Use separate staging and production data, secrets, and payment environments. Include backup and restore procedures, operational error reporting, and migration versioning before launch.

## Database schema

This is the logical schema before SQL migrations. UUID primary keys and creation/update timestamps apply to primary records. References below become foreign keys. Store monetary amounts as integer cents with currency. Store appointment timestamps in UTC and display them in America/New_York time.

### Identity, customers, and acquisition

| Table | Main fields and relationships |
|---|---|
| `profiles` | Authentication user ID, role, account status |
| `customers` | Optional profile ID, name, email, phone, original acquisition source |
| `properties` | Customer ID, address, ZIP, property type, access and parking notes |
| `leads` | Contact details, optional customer/property IDs, acquisition source, qualification stage, outcome, linked booking |
| `acquisition_sources` | Channel name, campaign/reference, active status |
| `acquisition_spend` | Source ID, reporting period, spend, allocation method |
| `crm_notes` | Customer ID, optional job ID, staff author, note |
| `communication_preferences` | Customer ID, channel, purpose, consent status, source and timestamp |

### Services, qualification, and booking

| Table | Main fields and relationships |
|---|---|
| `services` | Name, active status, checklist version |
| `service_prices` | Service ID, version, base price, scope, exclusions, effective dates |
| `service_areas` | ZIP, service ID, active status |
| `qualification_rules` | Service ID, version, condition, standard/surcharge/manual-review result |
| `quotes` | Lead/customer/property IDs, service ID, scope and price snapshot, expiration, acceptance timestamp |
| `quote_items` | Quote ID, base service or surcharge, description, quantity, amount |
| `bookings` | Customer/property/service/quote IDs, qualification answers, review status, requested windows, accepted terms version |

### Contractor network

| Table | Main fields and relationships |
|---|---|
| `contractor_applications` | Contact/business details, source, experience, vehicle/tools, work examples, references, screening notes |
| `contractors` | Profile/application IDs, business details, operational status, trial status, performance tier, approval/suspension details |
| `contractor_documents` | Contractor ID, document type, private storage key, version, verification status, reviewer |
| `contractor_compliance` | Contractor ID, requirement type, insurer/policy or registration details, coverage limits, effective/expiry dates, verification status, document ID |
| `contractor_agreements` | Contractor ID, agreement version, signature date, document ID |
| `contractor_service_areas` | Contractor ID, service-area ID |
| `contractor_specialties` | Contractor ID, service ID, capability verification, own-equipment confirmation |
| `contractor_availability` | Contractor ID, usual windows and dated exceptions |
| `contractor_rates` | Contractor/service IDs, flat payout, effective dates |
| `contractor_job_scores` | Assignment ID, component scores, weights version, reviewer, supporting observations |

Workers' compensation status supports Covered, Exempt/No Employees, Needs Review, and Missing. Store supporting documentation and verification separately from the contractor's self-reported answer. Keep tax documents in a restricted category: dispatchers see completion status, not W-9 contents.

### Jobs and quality

| Table | Main fields and relationships |
|---|---|
| `jobs` | Booking ID, operational status, scheduled window, arrival/start/completion timestamps, original job ID for rework |
| `job_assignments` | Job/contractor IDs, offered payout snapshot, deadline, accepted/declined/expired status, response time |
| `job_events` | Job ID, event type, previous/new status, actor, reason, timestamp |
| `job_photos` | Job ID, uploader, before/after/cleanup category, private storage key, capture time when available, upload time |
| `job_checks` | Job ID, checklist version, item, result, notes, submitting contractor |
| `completion_confirmations` | Job ID, customer confirmation, method, timestamp, unresolved concerns |
| `completion_reviews` | Job ID, reviewer, approved/rework decision, reason, timestamp |
| `completion_overrides` | Job ID, missing requirement, authorized reviewer, reason, supporting evidence |
| `job_issues` | Job/assignment IDs, category, severity, owner, evidence, resolution, timestamps |
| `additional_service_requests` | Job ID, contractor notes/photos, Blockline quote, customer authorization, linked work |

Issue categories include callback, damage, complaint, no-show, access failure, incomplete work, safety issue, fraud, and suspected circumvention. Distinguish allegations from reviewed findings.

### Financials and retention

| Table | Main fields and relationships |
|---|---|
| `customer_payments` | Booking/job IDs, provider references, amount, currency, payment status |
| `refunds` | Payment ID, amount, reason, provider reference, status |
| `contractor_payouts` | Assignment ID, agreed amount, adjustments, approval, due date, status, external payment reference |
| `job_costs` | Job ID, cost category, estimated/actual amount, source, acquisition allocation, supporting reference |
| `review_requests` | Job ID, destination, scheduled/sent times, request status |
| `customer_feedback` | Job/customer IDs, rating, feedback, timestamp, source |
| `service_reminders` | Customer/property/service IDs, last job, next due date, seasonal interest, reminder status |
| `launch_reviews` | 10-job/20-job checkpoint, metric snapshot, decision, owner notes |
| `notification_outbox` | Event, recipient, template, scheduled time, attempts, delivery status, deduplication key |
| `webhook_events` | Provider, unique event ID, processing status |
| `audit_events` | Actor, action, affected record, relevant changes, timestamp |

Financial reporting must avoid counting payout records and corresponding job-cost entries twice. Define one authoritative source per cost category and retain references for reconciliation.

### Constraints and access rules

- One primary job per booking; rework is separately linked to the original job.
- At most one accepted active contractor assignment per job.
- Prevent overlapping confirmed appointments for the same contractor.
- Check territory, service capability, availability, operational approval, and required compliance before offering or assigning work.
- Recheck document validity for the scheduled appointment date, including after rescheduling.
- Expired required coverage blocks new assignments and flags affected upcoming appointments.
- Deduplicate payment provider events and financial operations.
- Customers access only their own records.
- Contractors access their own records and only job/customer information necessary for authorized work.
- Contractors cannot approve their own completion, change prices/payouts, or access the full CRM.
- Apply corresponding authorization to storage, not only database rows.

## Page map

| Audience | Pages |
|---|---|
| Public | Home, Dryer Vent Cleaning, Service Area, About/Contact, Contractor Application, Privacy, Service Terms |
| Booking | Qualification, scope/price review, preferred windows, address/contact, booking request, confirmation |
| Customer | Secure booking access, appointment details, completion confirmation, payment, receipt, service history, approved photos, rebooking |
| Contractor | Sign-in, application/onboarding, documents/compliance, availability, offers, assigned jobs, checklist/photos, additional-service requests, payout history |
| Admin | Overview, leads, bookings, dispatch calendar, jobs, CRM, applications, contractor records, compliance, quality review, incidents, financials, scorecards, follow-up, settings |

The admin overview prioritizes actionable queues: unassigned jobs, unanswered offers, upcoming appointments, pending quality review, expiring documents, failed/unpaid customer payments, payouts awaiting approval, and low-margin jobs.

The responsive customer experience uses Blockline branding for booking, support, service reports, receipts, and repeat marketing.

## User roles

| Role | Permissions |
|---|---|
| Visitor | View public information, begin booking, apply as contractor |
| Customer | Own appointments, completion confirmation, payments, reports, preferences, rebooking |
| Contractor applicant | Own application and staged onboarding documents |
| Active contractor | Own offers, assignments, evidence, issues/add-ons, payout history |
| Dispatcher | Leads, customers, qualification review, assignment, scheduling, customer support, issue handling |
| Owner/admin | All operations, pricing, approvals, compliance verification, completion overrides, refunds, payouts, staff permissions |

Initially one owner can also perform dispatch. Staff permissions remain explicit so responsibilities can be separated later.

## Dryer vent offer and qualification

Publish one approved flat-rate package with a precise scope, maximum vent-run length, ordinary-access definition, exclusions, surcharge amounts, expected appointment duration, and cancellation/rescheduling terms.

The plan's $149 customer price and $70–$85 subcontractor payout are illustrative. They are not approved production prices. The plan suggests targeting at least 30%–35% contribution margin before fixed overhead; the actual threshold remains configurable and requires an owner decision.

Qualification collects:

- Service address and ZIP.
- Property type, dryer location, and floor.
- Exterior termination location.
- Approximate vent length, including an unknown option.
- Last known cleaning date.
- Weak airflow versus full blockage.
- Stacked configuration and movement/access difficulty.
- Photos of the dryer area and exterior exit when needed.
- Parking, gate, building entry, and other access constraints.

Potential exception triggers include rooftop terminations, long runs, stacked units, difficult access, bird nests, commercial properties, severe blockage, and specialized equipment. These are review triggers, not automatic promises that Blockline offers each type of work at launch.

The rules return standard eligibility, a configured disclosed surcharge, or manual review. Unknown answers that materially affect scope must not silently qualify for standard pricing. Extra work requires a revised quote and customer authorization before performance.

## Booking and job lifecycle

1. Capture the lead and acquisition source.
2. Check launch ZIP eligibility and qualification answers.
3. Confirm standard scope or complete manual quoting.
4. Obtain customer acceptance of price, scope, and policies.
5. Record requested appointment windows.
6. Offer the job to an eligible contractor with the fixed payout and response deadline.
7. Record acceptance and confirm the appointment with the customer.
8. Track en route, arrival, and work in progress.
9. Collect completion evidence and customer confirmation.
10. Verify completion and request customer payment to Blockline.
11. Approve and record contractor payout under agreed terms.
12. Request a review and schedule appropriate follow-up.

Preferred appointment windows remain requests until Blockline confirms availability. Routine small jobs are paid on completion. Deposit functionality for larger future services is deferred unless explicitly needed.

```text
Lead → Needs qualification → Quoted → Accepted/Booked
     → Offered → Contractor accepted → Scheduled → En route
     → In progress → Awaiting evidence/review → Completed
```

A declined or expired offer returns to dispatch. Reassignment preserves earlier offers and responses. Cancellation, late arrival, no access, unsafe conditions, incomplete work, and rework have explicit reasons, event history, and follow-up ownership.

Keep operational, financial, and follow-up states separate:

| Process | States |
|---|---|
| Customer payment | Due/Pending, Paid, Failed, Partially refunded, Refunded, Disputed |
| Contractor payout | Pending requirements, Eligible, Approved, Sent, Paid, Failed, Held |
| Review request | Scheduled, Sent, Failed, Suppressed |
| Repeat service | Due later, Due soon, Overdue, Contacted, Rebooked, Opted out |

A completed job is not necessarily paid. A refund or callback does not erase the original completion history. Customer nonpayment should not silently change the contractor's contractual payout deadline; hold rules must follow the approved agreement.

## Contractor application and onboarding

Keep the initial application short. Collect sensitive tax and compliance documents after initial screening.

Application fields include contact/business identity, source, service experience, service areas, typical availability, own tools and vehicle, three work examples, optional references, insurance self-report, and ability to provide photos and accept/decline individual work.

```text
Applicant → Screening → Conditional → Eligible for paid trial
          → Active / Probation / Rejected
```

Maintain explicit Suspended and Terminated statuses. Paid-trial eligibility requires all assignment prerequisites; Conditional status alone never permits dispatch.

Onboarding includes a screening call, identity/contact and capability checks, signed agreement/version, agreed payout schedule, W-9, required insurance, workers' compensation documentation or reviewed exemption, applicable registration, and acknowledgment of documentation and issue-reporting procedures.

Use the plan's company rule of no customer assignment without acceptable required coverage. Uninsured candidates may remain Conditional. Keep legal applicability and company insurance requirements configurable from approved professional guidance; this specification does not independently verify the plan's legal claims or create legal agreements.

Before increasing acquisition, establish at least two vetted providers covering the launch service and ZIP cluster. Later primary/backup preferences may guide manual dispatch without forcing acceptance or exclusivity.

## Completion verification and issues

Require timestamped before and after photos, a cleanup photo, contractor notes, applicable airflow/blockage observations, completed checklist, and customer confirmation. Record capture times when available and upload times separately; upload timestamps alone do not prove when a photo was taken.

An authorized override records the missing requirement, reason, reviewer, and supporting evidence. Overrides remain visible in the audit trail and cannot be used by contractors to approve their own work.

Damage, access problems, complaints, and incomplete work trigger immediate dispatch escalation. Store issue ownership and resolution. Rework links to the original job, preserving related costs and contractor performance effects.

Blockline handles add-on requests, revised quotes, refunds, support, and callbacks. Contractors submit details/photos; customers approve any change before work proceeds.

## Payments and contractor payouts

Customer payments go to Blockline through hosted checkout after verified routine completion. Record invoices/amounts due, payment attempts, receipts, refunds, disputes, and provider references. Handle duplicate and out-of-order events safely.

Contractor payouts use the agreed assignment rate, documented adjustments, completion requirements, W-9 status, and approval. The MVP tracks payments made through an external method with reference and reconciliation status. Automated money transfers are a later feature.

Do not infer that creating a payout record sends money or that sending money guarantees settlement. Preserve Sent and Paid/Reconciled distinctions.

## Unit economics and KPIs

Estimated contribution profit equals quoted revenue minus expected contractor payout, processing fees, acquisition cost, and rework/refund reserve.

Actual contribution profit equals revenue net of refunds minus actual contractor cost, processing fees, allocated acquisition cost, actual rework, and other direct costs. Exclude pass-through taxes from revenue if applicable. Do not deduct both a reserve and the actual expense for the same event. Show provisional results while costs are incomplete and handle zero revenue without division errors.

Contribution margin equals contribution profit divided by the corresponding revenue basis. Flag jobs below the configured threshold. Flagged jobs require attention rather than an undisclosed change to accepted customer terms.

Dashboard metrics include lead-to-booking conversion, customer acquisition cost, average order value, contractor cost, contribution profit/margin, on-time arrival/completion, callback and refund rates, ratings, referral and repeat rates, and jobs per contractor. Filter by date, service, ZIP, acquisition channel, and contractor.

Record channel spending as well as lead sources. Define acquisition-cost allocation explicitly so channel totals reconcile and repeat jobs do not silently receive duplicate first-acquisition costs.

## Contractor scorecards

| Component | Proposed weight |
|---|---:|
| Work quality | 25% |
| On-time arrival | 15% |
| Customer professionalism | 15% |
| Photo/documentation compliance | 15% |
| Communication | 10% |
| Cleanup/property care | 10% |
| Callback performance | 10% |

Store per-assignment scores, scoring version, reviewer, and evidence; calculate rolling results with job counts. Also show completion rate, average duration, complaint rate, and dispatch responsiveness. Missing customer feedback is not an automatic zero.

The plan suggests Preferred at 90–100, Approved at 80–89, Probation at 70–79, and suspension review below 70. Treat these as proposed settings, with manual review initially. Keep performance tier separate from operational status and compliance eligibility. Serious reviewed incidents can cause suspension independently of score.

Automated loyalty tiers, payout bonuses, and priority routing are later enhancements. Any rate changes must preserve historical accepted payouts and acceptable unit economics.

## Review requests and repeat marketing

Use a consistent completion-based review-request rule without filtering customers by positive feedback. Log scheduling, delivery, failure, and suppression. Avoid duplicate requests.

Maintain configurable annual dryer-vent reminders and seasonal interest lists based on service history. Respect consent/preferences; stop marketing after opt-out and suppress obsolete reminders after rebooking. Initial follow-up uses email and an admin queue rather than a broad campaign platform.

Future service interest does not make an unapproved service bookable. Seasonal categories require separate scope, pricing, insurance, capability, and launch decisions.

## Launch validation

The plan proposes these checkpoints:

| Checkpoint | Target or review |
|---|---|
| First 10 days | 25–50 meaningful local impressions/conversations |
| Lead signal | At least five serious inquiries |
| Paid conversion | At least two or three paid jobs |
| Ten completed jobs | Review actual contribution, callbacks, and contractor performance |
| Twenty completed jobs | Review acquisition cost, repeat/referral activity, margins, reliability |

These are planning targets rather than guaranteed outcomes. At ten jobs, record an owner decision to continue, reprice, modify, or stop. Do not automatically activate another service. Expand geography or add one adjacent category only after reviewing the operating data and applicable requirements.

## MVP and later features

| MVP | Later |
|---|---|
| Dryer vent cleaning in a small ZIP cluster | Additional services and territories |
| One approved standard package with exception review | More advanced quoting |
| Manual assignment and confirmed scheduling | Automated matching and routing |
| Mobile-responsive contractor portal | Native mobile app |
| Email notifications | SMS and expanded integrations |
| Customer payment after routine completion | Larger-service deposit flows |
| External contractor payout tracking | Automated payout transfers |
| CRM, compliance, incidents, evidence, scorecards | Advanced accounting and analytics |
| Per-job contribution and channel reporting | More advanced forecasting |
| Review requests and seasonal/annual queues | Memberships and expanded campaigns |

Do not build contractor bidding, public contractor listings, lead resale, or customer comparison of contractors. Defer holiday lights, gutters, and other roof/ladder-adjacent work until separate review and validation.

## Implementation sequence

1. Finalize architecture, schema, permissions, migrations, and configurable operating rules.
2. Build the responsive Blockline public website.
3. Add dryer-vent pricing, scope, exclusions, and approved service-area content.
4. Build qualification, lead capture, quotes, and booking requests.
5. Build customer/property CRM, history, notes, and acquisition attribution.
6. Build contractor application and staged onboarding.
7. Add contractor documents/compliance, areas, capabilities, availability, rates, and scorecards.
8. Assemble the admin dashboard and launch-readiness queues.
9. Implement job creation, offers, acceptance, scheduling, and status tracking.
10. Add private before/after and cleanup-photo uploads.
11. Add customer confirmation, completion verification, exceptions, incidents, and rework.
12. Integrate completion-time customer payments, contractor payout tracking, and contribution calculations.
13. Add review requests.
14. Add repeat-service reminders, seasonal lists, and validation reporting.

Keep booking and payments in test mode until the full operational workflow and launch settings are ready.

## Verification before launch

Verify the complete lead-to-repeat-service flow, including qualification exceptions, quote acceptance, contractor eligibility, offer rejection/expiry, scheduling conflicts, rescheduling, evidence upload, customer confirmation, verification, payment, payout recording, and follow-up.

Test authorization boundaries for customers, contractors, dispatchers, administrators, and private files. Verify duplicate/out-of-order payment events, failed uploads, missing evidence, expiring insurance, cancellations, partial refunds, callbacks, cost reconciliation, consent changes, and reminder deduplication. Check mobile usability, keyboard access, clear form errors, and accessible status communication.

## Decisions still required

| Decision | Current status |
|---|---|
| Launch ZIP cluster | Not specified |
| Final customer price | $149 is illustrative |
| Maximum included vent length and ordinary-access definition | Not specified |
| Surcharge amounts and excluded job types | Triggers described; final rules needed |
| Contractor rates and payout schedule | $70–$85 illustrative; timing/terms needed |
| Minimum contribution-margin threshold | Plan suggests 30%–35%; owner setting needed |
| Cancellation, no-access, refund, callback, and damage procedures | Required but terms not finalized |
| Company-approved insurance requirements and applicable registrations | Verification and configuration needed |
| Launch contractors | At least two vetted providers covering launch area |
| Production hosting, domain, payment and email accounts | Implementation setup needed |

The operating plan supplies the structure. These values must be finalized before accepting real customer bookings. They should remain configurable rather than embedded in source code.
