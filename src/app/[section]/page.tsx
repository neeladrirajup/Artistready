import { Platform } from '@/components/platform';
import { CreateProfile } from '@/components/create-profile';
import { MobileSignIn } from '@/components/mobile-signin';
export function generateStaticParams() { return ['saved', 'studio', 'about', 'filters', 'signin', 'signup', 'forgot-password'].map(section => ({ section })); }
export const dynamicParams = false;
export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === 'signup') return <CreateProfile />;
  if (section === 'signin' || section === 'forgot-password') return <MobileSignIn recovery={section === 'forgot-password'}/>;
  return <Platform section={section} />;
}
