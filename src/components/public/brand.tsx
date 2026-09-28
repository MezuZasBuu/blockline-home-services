import Link from 'next/link';

export function Brand({ footer = false }: { footer?: boolean }) {
  return <Link className={`brand${footer ? ' brand--footer' : ''}`} href="/" aria-label="Blockline Home Services — home">
    <span className="brand-name">BLOCKLINE<span className="brand-period" aria-hidden="true">.</span></span>
    <span className="brand-descriptor">Home Services</span>
  </Link>;
}
