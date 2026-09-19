import { getServiceClient } from '@/utils/supabase/server'

/** Best-effort fan-out after an article is first published. */
export async function notifyClubMembersOfArticle(args: {
  clubId: string
  articleId: string
  articleSlug: string
  articleTitle: string
  clubSlug: string
  authorId: string
}): Promise<void> {
  const service = getServiceClient()
  const { data: members, error } = await service.from('club_members').select('user_id').eq('club_id', args.clubId)
  if (error) {
    console.error('[music-articles] notify: list members failed', error.message)
    return
  }

  const rows = ((members ?? []) as Array<{ user_id: string }>)
    .filter((member) => member.user_id !== args.authorId)
    .map((member) => ({
      type: 'music_article',
      recipient_id: member.user_id,
      actor_id: args.authorId,
      related_type: 'music_article',
      related_id: args.articleId,
      message: args.articleTitle,
      link: `/musica/clubes/${args.clubSlug}/articulos/${args.articleSlug}`,
    }))
  if (rows.length === 0) return

  const { error: insertError } = await service.from('notifications').insert(rows)
  if (insertError) {
    console.error('[music-articles] notify: insert failed', insertError.message)
  }
}
