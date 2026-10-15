import { artists } from '@/lib/artists';
import { Platform } from '@/components/platform';
export function generateStaticParams() { return artists.map(({ id }) => ({ id })); }
export const dynamicParams = false;
export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Platform section="artist" artistId={id} />;
}
