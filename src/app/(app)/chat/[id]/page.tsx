import ChatPageClient from './ChatPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;

  return <ChatPageClient contactId={id} />;
}
