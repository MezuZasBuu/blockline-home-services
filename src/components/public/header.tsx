'use client';

import { useEffect, useRef, useState } from 'react';
import { Brand } from './brand';
import { Container } from './container';

const links = [
  { href: '#dryer-vent-cleaning', label: 'Our first service' },
  { href: '#our-approach', label: 'The Blockline approach' },
  { href: '#philadelphia', label: 'Our neighborhood' },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 60rem)');
    const closeOnWide = () => { if (wide.matches) setOpen(false); };
    wide.addEventListener('change', closeOnWide);
    return () => wide.removeEventListener('change', closeOnWide);
  }, []);

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); button.current?.focus(); }
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open]);

  return <header className="site-header" ref={header}>
    <Container className="header-inner">
      <Brand />
      <button ref={button} className="menu-toggle" type="button" aria-expanded={open} aria-controls="public-navigation"
        onClick={() => setOpen(!open)}>
        <span>{open ? 'Close' : 'Menu'}</span>
        <span className={`menu-icon${open ? ' menu-icon--open' : ''}`} aria-hidden="true"><span /><span /></span>
      </button>
      <nav id="public-navigation" aria-label="Main navigation" className={`public-nav${open ? ' public-nav--open' : ''}`}>
        {links.map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}
      </nav>
      <span className="header-location">Philadelphia, PA</span>
    </Container>
  </header>;
}
