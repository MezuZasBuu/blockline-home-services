import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Blockline Home Services | Philadelphia',
  description: 'A straightforward approach to caring for Philadelphia homes. Blockline is preparing to launch with dryer vent cleaning.',
  robots: { index: false, follow: false },
};
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
