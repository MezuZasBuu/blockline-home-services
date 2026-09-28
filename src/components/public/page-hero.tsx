import { Container } from './container';
import type { ReactNode } from 'react';

type PageHeroProps = {
  eyebrow: string;
  title: ReactNode;
  intro: string;
  note?: string;
};

export function PageHero({ eyebrow, title, intro, note }: PageHeroProps) {
  return <Container className="page-hero">
    <p className="eyebrow"><span className="small-rule" aria-hidden="true" /> {eyebrow}</p>
    <h1>{title}</h1>
    <p className="page-hero-intro">{intro}</p>
    {note ? <p className="launch-note">{note}</p> : null}
  </Container>;
}
