import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function VerifyShortlinkPage({ params }: PageProps) {
  const { code } = await params;
  redirect(`/verification/certificate/${encodeURIComponent(code)}`);
}
