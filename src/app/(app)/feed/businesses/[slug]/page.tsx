import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BusinessProfilePage({ params }: Props) {
  const { slug } = await params
  redirect(`/negocios/${slug}`)
}
