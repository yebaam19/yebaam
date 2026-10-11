import 'server-only'
import { getServerClient } from '@/utils/supabase/server'
import {
  getOccupationDistribution,
  getOccupationByDepartment,
  getOccupationByGender,
} from '@/features/admin/server/occupation-stats.server'

export async function getDashboardStats() {
  const client = await getServerClient()

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    spacesEnabled,
    spacesDisabled,
    topicsWeek,
    postsWeek,
    adminsCount,
    distribution,
    byDepartment,
    byGender,
  ] = await Promise.all([
    client.from('forum_spaces').select('id', { count: 'exact', head: true }).eq('enabled', true),
    client.from('forum_spaces').select('id', { count: 'exact', head: true }).eq('enabled', false),
    client.from('forum_topics').select('id', { count: 'exact', head: true }).gte('created_at', since),
    client.from('forum_posts').select('id', { count: 'exact', head: true }).gte('created_at', since),
    client.from('platform_admins').select('user_id', { count: 'exact', head: true }),
    getOccupationDistribution(),
    getOccupationByDepartment(),
    getOccupationByGender(),
  ])

  return { spacesEnabled, spacesDisabled, topicsWeek, postsWeek, adminsCount, distribution, byDepartment, byGender }
}
