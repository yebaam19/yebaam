import { hasMusicArchiveAdminAccess } from '@/features/music-archive/server/music-authorization.server'
import { describe, expect, it } from 'vitest'

type AuthorizationClient = Parameters<typeof hasMusicArchiveAdminAccess>[0]

function accessClient(rows: { platform?: boolean; music?: boolean }): AuthorizationClient {
  return {
    from(table: string) {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({
                  data:
                    table === 'platform_admins'
                      ? rows.platform
                        ? { user_id: 'user-1' }
                        : null
                      : rows.music
                        ? { user_id: 'user-1' }
                        : null,
                }),
              }
            },
          }
        },
      }
    },
  } as unknown as AuthorizationClient
}

describe('hasMusicArchiveAdminAccess', () => {
  it('allows a platform admin', async () => {
    await expect(hasMusicArchiveAdminAccess(accessClient({ platform: true }), 'user-1')).resolves.toEqual({
      allowed: true,
      isPlatformAdmin: true,
    })
  })

  it('allows a scoped music editor without platform-admin privileges', async () => {
    await expect(hasMusicArchiveAdminAccess(accessClient({ music: true }), 'user-1')).resolves.toEqual({
      allowed: true,
      isPlatformAdmin: false,
    })
  })

  it('rejects a regular user', async () => {
    await expect(hasMusicArchiveAdminAccess(accessClient({}), 'user-1')).resolves.toEqual({
      allowed: false,
      isPlatformAdmin: false,
    })
  })
})
