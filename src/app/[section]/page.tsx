import { Platform } from '@/components/platform';
import { CreateProfile } from '@/components/create-profile';
export function generateStaticParams() { return ['saved', 'studio', 'about', 'filters', 'signin', 'signup', 'forgot-password'].map(section => ({ section })); }
export const dynamicParams = false;
export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === 'signup') return <CreateProfile />;
  return <Platform section={section} />;
}
