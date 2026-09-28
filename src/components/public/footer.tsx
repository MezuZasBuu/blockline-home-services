import { Brand } from './brand';
import { Container } from './container';
import { footerNav } from './site-nav';

export function PublicFooter() {
  return <footer className="site-footer">
    <Container>
      <div className="footer-main">
        <Brand footer />
        <p>For your home.<br />For your block.</p>
        <nav aria-label="Footer navigation">
          {footerNav.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Blockline Home Services</span>
        <span>Preparing for launch in Philadelphia.</span>
        <a href="#top">Back to top <span aria-hidden="true">↑</span></a>
      </div>
    </Container>
  </footer>;
}
