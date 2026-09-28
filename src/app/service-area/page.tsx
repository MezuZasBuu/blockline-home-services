import type { Metadata } from 'next';
import { PublicShell } from '@/components/public/public-shell';
import { PageHero } from '@/components/public/page-hero';
import { ContentCard, ContentSection } from '@/components/public/content-page';
import { ButtonLink } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Service area | Blockline Home Services',
  description: 'Blockline is Philadelphia-first. Launch ZIP clusters and neighborhood coverage will be announced before bookings open.',
};

export default function ServiceAreaPage() {
  return <PublicShell>
    <main id="main-content" tabIndex={-1}>
      <PageHero
        eyebrow="Philadelphia-first"
        title={<>A city of neighborhoods,<br /><em>one launch at a time.</em></>}
        intro="Blockline Home Services is built for Philadelphia homes. We will start in a small, operationally coherent ZIP cluster rather than promising citywide coverage on day one."
        note="The launch ZIP cluster is not finalized. A map and list of neighborhoods will be published before bookings open."
      />

      <ContentSection id="approach" title="How we are choosing coverage">
        <p>Launch geography is an owner decision tied to provider redundancy, drive time, and quality control—not a marketing boundary drawn on a map before operations are ready.</p>
        <p>We are not publishing specific ZIP codes, street lists, or coverage polygons until the cluster is approved for launch.</p>
      </ContentSection>

      <ContentSection id="operations" className="approach-section" title="What “in area” will mean">
        <div className="content-grid">
          <ContentCard title="For customers">
            <p>Your address ZIP will be checked during qualification. Homes outside the active cluster will not be able to complete a standard booking until we expand deliberately.</p>
          </ContentCard>
          <ContentCard title="For fulfillment">
            <p>Blockline targets at least two vetted providers able to perform the same launch service in the same territory before scaling acquisition—so one cancellation does not shut down scheduling.</p>
          </ContentCard>
        </div>
      </ContentSection>

      <ContentSection id="next" className="neighborhood-section" title="Stay oriented">
        <p>Our public homepage and dryer vent service page describe the first offer. Service terms and privacy policies will be in place before customer bookings are accepted.</p>
        <ButtonLink variant="secondary" href="/dryer-vent-cleaning">Dryer vent cleaning <span aria-hidden="true">↗</span></ButtonLink>
      </ContentSection>
    </main>
  </PublicShell>;
}
