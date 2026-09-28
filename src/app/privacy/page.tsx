import type { Metadata } from 'next';
import { PublicShell } from '@/components/public/public-shell';
import { PageHero } from '@/components/public/page-hero';
import { ContentSection } from '@/components/public/content-page';

export const metadata: Metadata = {
  title: 'Privacy | Blockline Home Services',
  description: 'Draft privacy notice for Blockline Home Services. Not yet effective for customer bookings.',
};

export default function PrivacyPage() {
  return <PublicShell>
    <main id="main-content" className="legal-page" tabIndex={-1}>
      <PageHero
        eyebrow="Legal — draft"
        title="Privacy notice"
        intro="This draft describes how Blockline Home Services intends to handle personal information when customer booking and contractor onboarding go live. It is not legal advice and will be updated before accepting real customer data."
        note="Effective date: to be announced before launch. This pre-launch site does not collect customer or contractor submissions."
      />

      <ContentSection id="privacy-body">
        <h2>Who we are</h2>
        <p>Blockline Home Services is a Philadelphia home-services company preparing to offer dryer vent cleaning under the Blockline brand. When operations begin, Blockline will be the data controller for customer and contractor information processed through our website, applications, and service delivery tools.</p>

        <h2>Information we expect to process</h2>
        <p>Depending on your relationship with Blockline, we may process contact details, service addresses, qualification answers, appointment preferences, payment status (not full card numbers—card data stays with the payment processor), service photos, communications preferences, contractor compliance documents, and support correspondence.</p>
        <p>We design the product so contractors receive only the minimum customer information required for each operational stage, and so customers access only their own records.</p>

        <h2>How we use information</h2>
        <p>We use personal information to provide and improve services, schedule and dispatch work, verify completion, process payments and payout records, comply with legal obligations, prevent fraud and abuse, and communicate about appointments and follow-up care Blockline has been authorized to offer.</p>
        <p>We do not sell personal information. We do not use the marketing site to profile visitors for unrelated advertising while booking remains closed.</p>

        <h2>Storage and security</h2>
        <p>Operational data is designed to live in access-controlled databases with row-level security for customer and contractor roles. Job evidence and contractor documents are intended for private storage buckets with policies that mirror database authorization. Staff access to sensitive functions is designed to require multi-factor authentication.</p>
        <p>No system is perfectly secure. We will maintain administrative, technical, and organizational measures appropriate to the sensitivity of the data we hold.</p>

        <h2>Retention</h2>
        <p>We retain information for as long as needed to provide services, meet legal and tax obligations, resolve disputes, and enforce agreements. Financial, audit, and job-history records may be kept longer than marketing contact details.</p>

        <h2>Your choices</h2>
        <p>When services are live, customers will be able to exercise applicable rights—such as access, correction, or deletion where permitted by law—through published contact channels. Contractor applicants and active contractors will have portal access to their own records subject to compliance and safety requirements.</p>

        <h2>Updates</h2>
        <p>We will post an updated notice with an effective date before collecting information through booking or applications. Material changes will be communicated through reasonable channels when required.</p>

        <p className="content-callout">Questions about this draft will be answered through official Blockline contact information published at launch—not through unverified addresses on third-party sites.</p>
      </ContentSection>
    </main>
  </PublicShell>;
}
