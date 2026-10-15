import { Platform } from '@/components/platform';
export function generateStaticParams() { return ['saved', 'studio', 'about', 'filters', 'signin', 'signup', 'forgot-password'].map(section => ({ section })); }
export const dynamicParams = false;
export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <Platform section={section} />;
}
