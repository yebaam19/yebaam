import UserProfilePageClient from './UserProfilePageClient';

// Profile data is fetched client-side via the supabase browser client (auth-bound).
// Force-dynamic stops Turbopack from attempting to generate static paths for this
// route, which has been causing Jest-worker crashes in Next 16.2.3 dev mode.
export const dynamic = 'force-dynamic';

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params;

  return <UserProfilePageClient username={username} />;
}
