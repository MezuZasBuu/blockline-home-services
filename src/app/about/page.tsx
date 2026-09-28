import type { Metadata } from 'next';
import { PublicShell } from '@/components/public/public-shell';
import { PageHero } from '@/components/public/page-hero';
import { ContentCard, ContentList, ContentSection } from '@/components/public/content-page';
import { ButtonLink } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'About & contact | Blockline Home Services',
  description: 'What Blockline Home Services is building in Philadelphia and how to reach the company before launch.',
};

export default function AboutPage() {
  return <PublicShell>
    <main id="main-content" tabIndex={-1}>
      <PageHero
        eyebrow="About Blockline"
        title={<>One accountable company<br />for your <em>home.</em></>}
        intro="Blockline Home Services is a Philadelphia company that owns the customer relationship—pricing, scheduling, payment, quality control, and follow-up—while vetted independent professionals perform the field work under Blockline operating standards."
        note="We are pre-launch. Public phone, email, and support hours will be published before bookings open."
      />

      <ContentSection id="is" title="What Blockline is">
        <ContentList items={[
          'A neighborhood-oriented home maintenance brand under one umbrella',
          'The customer-facing operator for dryer vent cleaning at launch',
          'A system designed to learn what converts, where, and with which providers—without exposing internal mechanics on the marketing site',
        ]} />
      </ContentSection>

      <ContentSection id="is-not" className="approach-section" title="What Blockline is not">
        <ContentList items={[
          'A public contractor marketplace or directory',
          'A lead-resale or bidding platform',
          'A multi-service catalog at launch',
          'A promise that every future seasonal service is bookable because it appears on a roadmap',
        ]} />
        <p>Customers work with Blockline. We do not market the fulfillment model as “broker” or “dispatch.”</p>
      </ContentSection>

      <ContentSection id="positioning" title="How we talk about the work">
        <p>Our working direction is clear pricing, vetted local professionals, and Blockline handling the process end to end. Final public copy remains subject to launch review.</p>
        <div className="content-grid">
          <ContentCard title="Before launch">
            <p>This site explains the offer we are preparing, our approach, and policies in draft form. It does not collect bookings or customer information yet.</p>
          </ContentCard>
          <ContentCard title="After launch">
            <p>Support contact paths, confirmation templates, and reminder messaging will be published alongside approved service terms—not before operational readiness.</p>
          </ContentCard>
        </div>
      </ContentSection>

      <ContentSection id="contact" className="neighborhood-section" title="Contact">
        <p>Blockline is preparing for a controlled soft launch in Philadelphia. We have not published a customer support phone number, mailing address, or general inbox on this pre-launch site.</p>
        <p className="content-callout">When bookings open, this section will list the approved ways to reach Blockline for scheduling questions, day-of issues, and post-service support. Until then, please use the public pages here to understand what we are building.</p>
        <ButtonLink href="/terms">Service terms (draft) <span aria-hidden="true">↗</span></ButtonLink>
      </ContentSection>
    </main>
  </PublicShell>;
}
