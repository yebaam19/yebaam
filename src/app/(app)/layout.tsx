import Header from '@/components/Header/Header'
import { ApplicationLayout } from './application-layout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ApplicationLayout header={<Header hasBorderBottom={false} />}>{children}</ApplicationLayout>
}
