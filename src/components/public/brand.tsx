export function Brand({ footer = false }: { footer?: boolean }) {
  return <a className={`brand${footer ? ' brand--footer' : ''}`} href="#top" aria-label="Blockline Home Services — home">
    <span className="brand-name">BLOCKLINE<span className="brand-period" aria-hidden="true">.</span></span>
    <span className="brand-descriptor">Home Services</span>
  </a>;
}
