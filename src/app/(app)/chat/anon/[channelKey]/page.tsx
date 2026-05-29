import AnonymousChatView from '@/features/anonymous-chat/components/AnonymousChatView';

interface PageProps {
  params: Promise<{ channelKey: string }>;
}

export default async function AnonymousChatPage({ params }: PageProps) {
  const { channelKey } = await params;

  return <AnonymousChatView channelKey={channelKey} />;
}
