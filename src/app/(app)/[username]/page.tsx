import UserProfilePageClient from './UserProfilePageClient';

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params;

  return <UserProfilePageClient username={username} />;
}
