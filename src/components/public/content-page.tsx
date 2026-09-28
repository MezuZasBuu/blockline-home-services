import { Container, Section } from './container';
import { Card } from '@/components/ui/primitives';
import type { ReactNode } from 'react';

export function ContentSection({ id, title, children, className = '' }: { id?: string; title?: string; children: ReactNode; className?: string }) {
  return <Section id={id} className={className} aria-labelledby={title ? `${id}-title` : undefined}>
    <Container className="content-page">
      {title && id ? <h2 id={`${id}-title`}>{title}</h2> : title ? <h2>{title}</h2> : null}
      {children}
    </Container>
  </Section>;
}

export function ContentCard({ title, children }: { title: string; children: ReactNode }) {
  return <Card className="content-card">
    <h3>{title}</h3>
    {children}
  </Card>;
}

export function ContentList({ items }: { items: string[] }) {
  return <ul className="content-list">{items.map(item => <li key={item}>{item}</li>)}</ul>;
}
