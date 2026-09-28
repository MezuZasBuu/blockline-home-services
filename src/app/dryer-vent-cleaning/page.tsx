import type { Metadata } from 'next';
import { PublicShell } from '@/components/public/public-shell';
import { PageHero } from '@/components/public/page-hero';
import { ContentCard, ContentList, ContentSection } from '@/components/public/content-page';
import { ButtonLink } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Dryer vent cleaning | Blockline Home Services',
  description: 'How Blockline is preparing a defined dryer vent cleaning offer for Philadelphia homes, with clear qualification and review rules before launch.',
};

const qualificationInputs = [
  'Service address and ZIP code',
  'Property type',
  'Dryer location and floor',
  'Exterior termination location',
  'Approximate vent-run length, including an unknown option',
  'Last known cleaning date',
  'Weak airflow versus full blockage',
  'Stacked configuration and difficulty moving or accessing the appliance',
  'Photos of the dryer area and exterior exit when needed',
  'Parking, gate, building-entry, and other access constraints',
];

const manualReviewTriggers = [
  'Rooftop terminations',
  'Unusually long vent runs',
  'Stacked units or difficult appliance movement',
  'Bird nests or obstruction removal',
  'Commercial properties',
  'Severe blockage',
  'Conditions requiring specialized equipment',
  'Any answer that changes the ordinary-access assumption or makes scope uncertain',
];

export default function DryerVentCleaningPage() {
  return <PublicShell>
    <main id="main-content" tabIndex={-1}>
      <PageHero
        eyebrow="Phase 1 service"
        title={<>Dryer vent cleaning,<br /><em>defined before we book.</em></>}
        intro="Blockline is launching with one standard dryer vent cleaning package. Qualification and exception rules decide whether a home is eligible for the standard offer, needs a disclosed surcharge, or requires manual review."
        note="Scope, pricing, and launch neighborhoods are not finalized. Booking is not open yet."
      />

      <ContentSection id="why" title="Why we’re starting here">
        <p>Dryer vent cleaning has a manageable skill floor, a fast booking cycle, and limited capital burden for Blockline—without taking on roof, ladder, electrical, or construction-adjacent risk on day one.</p>
        <p>The goal is a repeatable loop: qualify the job, agree on scope, dispatch a vetted professional, verify completion, and follow up with the customer through Blockline—not a marketplace or bidding site.</p>
      </ContentSection>

      <ContentSection id="package" className="approach-section" title="One defined package">
        <p>Customers will book a single standard package with disclosed exception logic. Unknown answers that materially affect scope will not silently qualify for the standard package.</p>
        <div className="content-grid">
          <ContentCard title="What you can expect from Blockline">
            <p>Clear communication, an agreed scope before work begins, coordination of the visit, and Blockline as your point of contact after the job.</p>
          </ContentCard>
          <ContentCard title="What is still being finalized">
            <p>Customer price, included vent length, ordinary-access assumptions, surcharge amounts, and the first launch ZIP cluster. Illustrative planning numbers are not published here.</p>
          </ContentCard>
        </div>
      </ContentSection>

      <ContentSection id="qualification" title="Qualification we are designing for">
        <p>When booking opens, we will ask structured questions so the system—and our team—can classify the job correctly.</p>
        <ContentList items={qualificationInputs} />
      </ContentSection>

      <ContentSection id="exceptions" className="neighborhood-section" title="When manual review is required">
        <p>These conditions typically change scope, equipment, or access assumptions. They trigger review rather than automatic standard pricing.</p>
        <ContentList items={manualReviewTriggers} />
        <p className="content-callout">Payment is designed to follow verified completion, not a browser success screen. Operational, payment, and payout states stay separate in the product foundation.</p>
        <ButtonLink href="/about">About Blockline <span aria-hidden="true">↗</span></ButtonLink>
      </ContentSection>
    </main>
  </PublicShell>;
}
