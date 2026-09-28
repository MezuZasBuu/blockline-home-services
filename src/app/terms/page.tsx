import type { Metadata } from 'next';
import { PublicShell } from '@/components/public/public-shell';
import { PageHero } from '@/components/public/page-hero';
import { ContentSection } from '@/components/public/content-page';

export const metadata: Metadata = {
  title: 'Service terms | Blockline Home Services',
  description: 'Draft service terms for Blockline Home Services. Policies will be finalized before bookings open.',
};

export default function TermsPage() {
  return <PublicShell>
    <main id="main-content" className="legal-page" tabIndex={-1}>
      <PageHero
        eyebrow="Legal — draft"
        title="Service terms"
        intro="These draft terms describe the relationship Blockline intends to offer customers when dryer vent cleaning bookings open. Cancellation, refund, callback, and damage procedures are not finalized and will be published in full before launch."
        note="Effective date: to be announced. Booking is not open on this pre-launch site."
      />

      <ContentSection id="terms-body">
        <h2>The service relationship</h2>
        <p>When you book with Blockline Home Services, you are purchasing a defined home service from Blockline—not hiring an independent contractor directly. Blockline coordinates scheduling, communications, quality expectations, and payment collection. Field work is performed by vetted professionals operating under Blockline standards and agreements.</p>

        <h2>Scope and pricing</h2>
        <p>Each booking will reference an agreed scope and price captured at the time of acceptance. Standard-package eligibility depends on qualification answers. Jobs that require manual review, surcharges, or revised scope will not be charged as standard without your authorization.</p>
        <p>Published marketing material does not replace the terms snapshot attached to your booking. Configuration changes after you book do not rewrite what you already accepted.</p>

        <h2>Scheduling and access</h2>
        <p>You agree to provide safe, accurate access information and to be available—or to designate an adult authorized to grant access—during the scheduled window. Blockline will communicate arrival expectations through approved channels once operations begin.</p>
        <p>Same-day cancellation, no-access, and rescheduling rules are owner decisions still being finalized. They will appear here in complete form before customer bookings are accepted.</p>

        <h2>Payment</h2>
        <p>For routine jobs, customer payment is designed to occur after Blockline verifies completion—not merely when a checkout page returns success. You authorize Blockline to charge the payment method you provide according to the payment policy version disclosed at booking.</p>
        <p>Chargebacks and disputes will be handled according to published procedures and applicable law. Duplicate or out-of-order payment events are deduplicated in the system design.</p>

        <h2>Quality, callbacks, and issues</h2>
        <p>Blockline may require photo evidence, checklist completion, and customer confirmation before treating a job as complete. If work does not meet the agreed scope, report the issue through published support channels. Rework, when authorized, links to the original job record rather than erasing history.</p>
        <p>Refund and partial-refund rules, callback windows, and property-damage escalation paths require owner approval and will be added before launch.</p>

        <h2>Communications</h2>
        <p>By booking, you consent to service-related messages about appointments, access, completion, payment, and follow-up care Blockline is authorized to offer. Marketing messages will honor your preferences and applicable law.</p>

        <h2>Limitations</h2>
        <p>Service availability is limited to approved geographic clusters. Blockline may refuse or reschedule work that cannot be performed safely, legally, or within the agreed scope. Nothing on this pre-launch site constitutes an offer to contract until booking is open and you complete an authorized flow.</p>

        <p className="content-callout">This document is a structural draft aligned with the Blockline MVP. It must be reviewed and approved before it governs real customer relationships.</p>
      </ContentSection>
    </main>
  </PublicShell>;
}
