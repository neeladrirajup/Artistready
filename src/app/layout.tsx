import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Artist Ready — A stage for your next chapter', description: 'Discover artists, explore creative portfolios, and bring your next story to life. Artist Ready design preview with sample profiles.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
