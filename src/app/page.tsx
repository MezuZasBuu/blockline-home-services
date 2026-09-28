import Image from 'next/image';
import { PublicShell } from '@/components/public/public-shell';
import { Container, Section } from '@/components/public/container';
import { ButtonLink, Card } from '@/components/ui/primitives';

export default function Home() {
  return <PublicShell>
    <main id="main-content" tabIndex={-1}>
      <Container>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="small-rule" aria-hidden="true" /> Philadelphia home services</p>
            <h1 id="hero-title">Good care.<br />Right at <em>home.</em></h1>
            <p className="hero-intro">Your home has a lot going on. Taking care of it should feel straightforward.</p>
            <p className="hero-description">Meet Blockline. We’re building a simpler way to care for Philadelphia homes, starting with dryer vent cleaning.</p>
            <div className="hero-actions">
              <ButtonLink href="/dryer-vent-cleaning">Explore our first service <span aria-hidden="true">↗</span></ButtonLink>
              <a className="text-link" href="/about">Meet Blockline</a>
            </div>
            <p className="launch-note">Coming to Philadelphia. Booking is not open yet.</p>
          </div>
          <figure className="hero-visual">
            <Image className="hero-photo" src="/images/blockline-rowhomes.png" alt="An illustrative Philadelphia-inspired block of brick rowhomes with blue doors and stone steps." width={1536} height={1024} sizes="(min-width: 960px) 46vw, 92vw" preload />
            <figcaption><span>A little care goes a long way.</span><span className="figure-index">01 / HOME</span></figcaption>
          </figure>
        </section>
      </Container>

      <div className="brand-strip"><Container><p>Home maintenance, with someone to handle the details.</p><span>That’s the Blockline idea.</span></Container></div>

      <Section id="dryer-vent-cleaning" aria-labelledby="service-title">
        <Container className="service-layout">
          <div className="section-heading"><p className="eyebrow">01 / Our first service</p><h2 id="service-title">One less thing<br />on your home’s list.</h2><p>We’re starting with a small but important part of home maintenance: the dryer vent.</p></div>
          <Card className="service-card">
            <div className="service-card-top"><span className="service-number">01</span><span className="status-label">Preparing for launch</span></div>
            <h3>Dryer vent<br />cleaning</h3>
            <p>A straightforward service, organized by Blockline from the first conversation to the follow-up.</p>
            <dl className="service-details"><div><dt>Service details</dt><dd>Scope and pricing coming soon</dd></div><div><dt>Availability</dt><dd>Launch neighborhoods to be announced</dd></div></dl>
            <p className="service-card-note">We’ll share the full offer before bookings open.</p>
            <ButtonLink variant="secondary" href="/dryer-vent-cleaning">Read the service overview <span aria-hidden="true">↗</span></ButtonLink>
          </Card>
        </Container>
      </Section>

      <Section id="our-approach" className="approach-section" aria-labelledby="approach-title">
        <Container>
          <div className="approach-heading"><p className="eyebrow">02 / The Blockline approach</p><h2 id="approach-title">One company.<br />Someone to count on.</h2><p>We’re building Blockline around clear communication and care for the place you live.</p></div>
          <div className="principles">
            <article><span className="principle-number">01</span><h3>Clear from the start.</h3><p>Our approach starts with an agreed scope and price, so you know what to expect.</p></article>
            <article><span className="principle-number">02</span><h3>Details, handled.</h3><p>Blockline will coordinate the service and keep you informed along the way.</p></article>
            <article><span className="principle-number">03</span><h3>Care that follows through.</h3><p>Questions about your service? Blockline will be your point of contact.</p></article>
          </div>
        </Container>
      </Section>

      <Section id="philadelphia" className="neighborhood-section" aria-labelledby="neighborhood-title">
        <Container className="neighborhood-layout">
          <p className="eyebrow">03 / Right here in Philadelphia</p>
          <div><h2 id="neighborhood-title">A city of neighborhoods.<br /><em>A company for your home.</em></h2><p>From the front steps to the everyday routines inside, home is personal. We’re bringing that same neighborhood perspective to home maintenance.</p><p className="neighborhood-note">We’ll announce our first service area before launch.</p><ButtonLink variant="secondary" href="/service-area">Service area <span aria-hidden="true">↗</span></ButtonLink></div>
        </Container>
      </Section>
    </main>
  </PublicShell>;
}
