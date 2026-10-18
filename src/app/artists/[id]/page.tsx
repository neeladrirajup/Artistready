import { artists } from '@/lib/artists';
import { Platform } from '@/components/platform';
export function generateStaticParams() { return [...artists.map(({ id }) => ({ id })), { id: 'my-profile' }]; }
export const dynamic = 'force-dynamic';
export default async function ArtistPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{preview?:string}> }) {
  const { id } = await params;
  const query=await searchParams;
  return <Platform section="artist" artistId={id} preview={id==='my-profile'&&query.preview==='1'} />;
}

