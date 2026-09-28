import type { ReactNode } from 'react';
import { PublicFooter } from './footer';
import { PublicHeader } from './header';

export function PublicShell({ children }: { children: ReactNode }) {
  return <div id="top">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <PublicHeader />
    {children}
    <PublicFooter />
  </div>;
}
