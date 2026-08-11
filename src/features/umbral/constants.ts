/**
 * El Umbral — copy y límites del stunt (clave-1.pdf).
 *
 * Deliberately Spanish-only and outside the i18n catalog: the page is a
 * piece of lore, not app chrome. Translating a riddle dilutes the legend,
 * and the stunt's audience is the platform's Spanish-speaking territory.
 *
 * Tone rule from the brief: curiosity without threat. Nothing here may read
 * as ominous, occult-instructional, or fear-inducing — it only has to make
 * you want to tell someone about it.
 */

export const UMBRAL_PATH = '/umbral';

/** 72: cap consistent with the legend (and a sane input bound). */
export const CLAVE_MAX_LENGTH = 72;

/** Attempts per user per hour before the door "stops listening". */
export const CLAVE_RATE_LIMIT_PER_HOUR = 7;

/** Set in the angelic alphabet as the page's only headline. Decodable via the legend. */
export const UMBRAL_HEADING = 'DI LA CLAVE';

/** La advertencia — non-threatening, curiosity-first. */
export const UMBRAL_WARNING =
  'No hay nada al otro lado. Y, aun así, algunos vuelven todos los días.';

/** Under the share control. Frames receiving the link as membership. */
export const UMBRAL_SHARE_LINE = 'Si alguien te envió este enlace, ya eres parte de esto.';

export const UMBRAL_SHARE_CTA = 'Enviar este enlace';
export const UMBRAL_SHARE_COPIED = 'Enlace copiado';

export const UMBRAL_INPUT_PLACEHOLDER = 'escribe la clave';
export const UMBRAL_SUBMIT_CTA = 'Pronunciar';
export const UMBRAL_LISTENING = 'El umbral escucha…';

/**
 * Replies when a clave is pronounced. Chosen deterministically from a hash
 * of the attempt, so the same wrong clave always earns the same reply — the
 * door appears to remember, which is worth more legend than randomness.
 * None of them confirm or deny that a real clave exists.
 */
export const UMBRAL_RESPONSES = [
  'El umbral escuchó. No se abrió.',
  'Esa no es la clave. O no todavía.',
  'Silencio. Un silencio un poco distinto al de antes.',
  'Nada se movió. Casi nada.',
  'La clave no se adivina. Se recuerda.',
  'Hoy no. El umbral no explica por qué.',
  'Algo, al otro lado, tomó nota.',
] as const;

export const UMBRAL_RATE_LIMITED =
  'El umbral ya te escuchó suficiente por ahora. Vuelve más tarde.';

export const UMBRAL_ERROR = 'El umbral no respondió. Inténtalo otra vez.';

export const UMBRAL_ATTEMPT_COUNT_LABEL = 'llamado n.º';

/** Gate shown when an anonymous visitor tries to pronounce a clave. */
export const UMBRAL_GATE_TITLE = 'Para pronunciar una clave necesitas un nombre.';
export const UMBRAL_GATE_BODY =
  'El umbral solo escucha a quien existe. Crea tu perfil en Yebaam y vuelve a intentarlo: este enlace te estará esperando.';
export const UMBRAL_GATE_SIGNUP_CTA = 'Crear mi perfil';
export const UMBRAL_GATE_LOGIN_CTA = 'Ya tengo cuenta';

/**
 * Data-collection notice (Ley 1581 / Macro Art.2 y Art.5, Contrato cl.22-23):
 * lore-toned but explicit — pronounced claves are stored. Links to the
 * privacy policy so the finality is formally disclosed, not just implied.
 */
export const UMBRAL_PRIVACY_LINE = 'El umbral recuerda cada clave pronunciada.';
export const UMBRAL_PRIVACY_LINK_LABEL = 'política de privacidad';
export const UMBRAL_PRIVACY_LINK_HREF =
  '/normativa/terminos#parte-vi-politica-de-privacidad-extendida';

/** <title> / social copy. The description is the advertencia itself. */
export const UMBRAL_META_TITLE = 'El Umbral';
export const UMBRAL_META_DESCRIPTION = 'No hay nada al otro lado.';
