import ForoHeader from '../ForoHeader'

interface Props {
  title: string
  subtitle: string
  crumbs: { href: string; label: string }[]
  /** Moderator action cluster, rendered in the header's action slot. */
  action?: React.ReactNode
}

// Thread title / meta / breadcrumb area. Presentational only — it forwards an
// optional action slot (the moderation menu) supplied by the parent shell, so
// it needs no client interactivity of its own.
export default function ThreadHeader({ title, subtitle, crumbs, action }: Props) {
  return (
    <ForoHeader
      title={title}
      subtitle={subtitle}
      crumbs={crumbs}
      action={action}
    />
  )
}
