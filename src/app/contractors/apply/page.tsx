import type { Metadata } from 'next';
import { PublicShell } from '@/components/public/public-shell';
import { PageHero } from '@/components/public/page-hero';
import { ContentCard, ContentList, ContentSection } from '@/components/public/content-page';
import { ButtonLink } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Contractor application | Blockline Home Services',
  description: 'How independent professionals can work with Blockline Home Services in Philadelphia. Applications are not open yet.',
};

const lifecycleStages = [
  'Applicant',
  'Screening',
  'Conditional',
  'Eligible for paid trial',
  'Active, probation, or rejected—with explicit suspended and terminated states',
];

const onboardingTopics = [
  'Identity, contact, and capability verification',
  'Service areas and availability',
  'Tools, equipment, and vehicle expectations',
  'Work examples and optional references',
  'Signed agreement version and agreed payout schedule',
  'W-9 before first payment',
  'Insurance and workers’ compensation documentation or reviewed exemption, per company policy',
  'Applicable registrations as required',
  'Acknowledgment of photo, customer-service, issue-reporting, and completion requirements',
];

const futureApplicationFields = [
  'Business and contact identity',
  'How you heard about Blockline',
  'Dryer vent and related service experience',
  'ZIP codes you can reliably serve',
  'Typical weekly availability',
  'Own tools, vehicle, and ability to upload job evidence',
  'Three examples of comparable work',
  'Optional references',
];

export default function ContractorApplyPage() {
  return <PublicShell>
    <main id="main-content" tabIndex={-1}>
      <PageHero
        eyebrow="Field professionals"
        title={<>Work with Blockline,<br /><em>not around it.</em></>}
        intro="Blockline coordinates Philadelphia dryer vent cleaning for homeowners. Vetted independent contractors perform the physical work under Blockline standards, agreements, and quality expectations."
        note="Online applications are not open yet. This page describes the process we are building—there is no form to submit on this pre-launch site."
      />

      <ContentSection id="model" title="How fulfillment works">
        <p>Blockline is not a public marketplace. Customers do not browse contractor profiles or choose among providers. Offers show only what is needed to decide: service, general area or ZIP, appointment window, scope summary, and offered payout.</p>
        <p>Customer name, exact address, phone, and identifying photos are revealed only after an assignment is accepted and confirmed, during the operational access window—and removed when that need ends.</p>
      </ContentSection>

      <ContentSection id="lifecycle" className="approach-section" title="Contractor lifecycle">
        <p>Conditional status alone never authorizes dispatch. Compliance, insurance, agreements, and performance tiers remain separate concepts in the system.</p>
        <ContentList items={lifecycleStages} />
      </ContentSection>

      <ContentSection id="onboarding" title="Onboarding and compliance we will require">
        <p>Exact insurance and registration requirements need company and professional confirmation before launch. No customer assignment happens without acceptable required coverage.</p>
        <ContentList items={onboardingTopics} />
      </ContentSection>

      <ContentSection id="application" className="neighborhood-section" title="What the application will ask">
        <p>When applications open, expect structured questions—not a free-text résumé dump. The list below is representative of the MVP application design.</p>
        <div className="content-grid">
          <ContentCard title="Representative fields">
            <ContentList items={futureApplicationFields} />
          </ContentCard>
          <ContentCard title="Quality expectations">
            <p>Completion evidence includes timestamped before and after photos, cleanup photos, checklist items, contractor notes, and customer confirmation. Callbacks and incidents create explicit records rather than overwriting history.</p>
          </ContentCard>
        </div>
        <p className="content-muted-label">Pre-launch</p>
        <p>Do not email documents or personal tax forms to addresses found elsewhere on the web. Blockline will publish the official application channel when vetting opens.</p>
        <ButtonLink variant="secondary" href="/about">About Blockline <span aria-hidden="true">↗</span></ButtonLink>
      </ContentSection>
    </main>
  </PublicShell>;
}
