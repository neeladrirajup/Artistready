import type { Metadata } from 'next';
import './globals.css';
import './artist-preferences.css';
import './profile-photos.css';
import './profile-measurements.css';
import './casting-profile.css';
import './profile-sharing.css';
import './create-profile.css';
import './onboarding-details.css';
import './created-profile.css';
import './profile-career.css';
import './mobile-signin.css';
import './required-fields.css';
import './profile-section-icons.css';
import './profile-identity-facts.css';
import './measurement-spacing.css';
export const metadata: Metadata = { title: 'Artistready — People. Projects. Opportunities.', description: 'Find your next collaborator. Explore cinematic artist portfolios, discover creative talent, and build your shortlist. Sample-data design preview.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
