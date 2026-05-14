/** Feature flag for the entire "Club de Coleccionistas" / music archive module.
 *
 * Re-exports from the central `FEATURE_FLAGS` registry to keep one source of
 * truth, but is read here in route layouts and middleware where importing the
 * sidebar config would be heavyweight.
 *
 * Set `NEXT_PUBLIC_MUSIC_CLUB_ENABLED=false` at build time to disable both
 * the sidebar/nav entries and the `/musica/**` + `/admin/music/**` routes
 * (the layout gates issue a 404 when the flag is off).
 *
 * The flag is evaluated at build time because it is a `NEXT_PUBLIC_*` env
 * var — to flip it, redeploy. If we need an instant kill switch later, move
 * the flag to a server-side table (`feature_flags`) and read it per request.
 */
import { isFeatureEnabled } from '@/config/features-flag';

export const MUSIC_CLUB_ENABLED = isFeatureEnabled('MUSIC_CLUB_ENABLED');
