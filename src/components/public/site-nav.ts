export type SiteNavItem = { href: string; label: string };

export const primaryNav: SiteNavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/dryer-vent-cleaning', label: 'Dryer vent cleaning' },
  { href: '/service-area', label: 'Service area' },
  { href: '/about', label: 'About & contact' },
  { href: '/contractors/apply', label: 'Contractor application' },
];

export const legalNav: SiteNavItem[] = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Service terms' },
];

export const footerNav: SiteNavItem[] = [...primaryNav.filter(item => item.href !== '/'), ...legalNav];
