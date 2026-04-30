/**
 * Compute the CSS transform string for a profile cover image given the
 * stored offset (0..100) and zoom (100..400 = 1.0×..4.0×).
 *
 * Applied to an `<img>` element that is also `object-fit: cover` filling its
 * container; the parent must be `overflow: hidden`.
 *
 * Math: `object-cover` already fills + overflows. `scale(z)` enlarges from
 * center. `translate(%)` is relative to the image's own laid-out box. To
 * reveal the part at `ox`/`oy` (0..100% of the overflow), translate by
 * `(50 - offset) × (z - 1)` percent on each axis.
 */
export interface CoverTransform {
  /** 0..100 — 50 is center. */
  offsetX: number;
  /** 0..100 — 50 is center. */
  offsetY: number;
  /** 100..400 in integer percent (100 = 1.0×). */
  zoom: number;
}

export function coverTransformStyle(t: Partial<CoverTransform> | null | undefined): React.CSSProperties {
  const ox = clamp(t?.offsetX ?? 50, 0, 100);
  const oy = clamp(t?.offsetY ?? 50, 0, 100);
  const zoomPct = clamp(t?.zoom ?? 100, 100, 400);
  const z = zoomPct / 100;
  const tx = (50 - ox) * (z - 1); // percent of image
  const ty = (50 - oy) * (z - 1);
  return {
    transform: `translate(${tx}%, ${ty}%) scale(${z})`,
    transformOrigin: 'center center',
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
