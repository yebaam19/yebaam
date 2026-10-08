---
name: YEBAAM community audiovisual header
description: Local contract for the community identity, featured videos, and inline presentation editor.
colors:
  primary-800: "rgb(8, 118, 50)"
  primary-300: "rgb(190, 228, 205)"
  secondary-300: "rgb(255, 225, 140)"
  secondary-500: "rgb(247, 170, 0)"
  secondary-900: "rgb(180, 75, 3)"
  neutral-200: "rgb(229, 231, 235)"
  neutral-800: "rgb(31, 41, 55)"
  neutral-900: "rgb(17, 24, 39)"
typography:
  title:
    fontFamily: Poppins
    fontSize: 1.25rem
    fontWeight: 700
    lineHeight: 1.75rem
  title-wide:
    fontFamily: Poppins
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 2rem
  section-title:
    fontFamily: Poppins
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.75rem
  body-small:
    fontFamily: Poppins
    fontSize: 0.875rem
    lineHeight: 1.25rem
  metadata:
    fontFamily: Poppins
    fontSize: 0.75rem
    lineHeight: 1rem
rounded:
  field-thumbnail: 0.5rem
  panel-player: 0.75rem
spacing:
  action-gap: 0.5rem
  field-padding: 0.75rem
  section-gap: 1rem
  panel-padding: 1.25rem
  reader-gap: 1.5rem
---

# Design System: Community audiovisual header

## Overview

This local extension follows the user's compact, minimalist, responsive YEBAAM direction. Community identity and a short introduction accompany featured audiovisual content; authorized editors stage the presentation inline. It extends the existing community header without establishing a new visual identity.

Visual authority remains the [global stylesheet](../../../../styles/tailwind.css), [application font](../../../../app/layout.tsx), [shared Button](../../../../ui/Button.tsx), and built components in this directory. The [surface brief](../../../../../.impeccable/surfaces/community-showcase.md) defines the local scope.

The [desktop](../../../../../.impeccable/review/community-showcase-desktop.png) and [mobile](../../../../../.impeccable/review/community-showcase-mobile.png) captures show the actual `localhost:3000` editor and header without featured videos. The finish review returned **ship** after the keyboard-cancel focus fix was checked, including visible focus evidence. The final verdict scores only that focus correction as resolved: populated reader/player appearance, real Cloudflare playback, publication, persistence, and dark-mode rendering are not established by these captures. Reader guidance below records the built code, not additional browser verification.

## Colors

YEBAAM green identifies the shared brand save action, play control, and keyboard focus. Light green supplies dark-mode focus. Gold remains secondary: the identity fallback uses the established gold tone, draft text uses dark gold with a lighter dark-mode variant, and the player poster has a light-gold focus outline. Existing category badges retain their category-specific colors.

White panels and dark neutral text become neutral-800 panels with white text in dark mode. Fine neutral separators and subdued explanatory text keep the header compact. Player frames are near-black; errors retain the shared red treatment. Palette values above preserve the stylesheet's native RGB notation.

## Typography

Inherit Poppins throughout. The community name uses the title role, increasing to title-wide at the medium breakpoint (48rem). The editor heading uses section-title. Labels, statistics, introduction, feedback, and player titles use small body text; badges, draft labels, thumbnail captions, and durations use metadata sizes.

The introduction preserves line breaks, wraps long content, and uses relaxed leading within a prose-width maximum. Community names and asset titles also wrap rather than widening the panel. Durations use tabular numerals.

## Layout

The header has panel-padding on every side. With playable references, identity and introduction form the first column and the principal player the second: the extra-large breakpoint (80rem) introduces a 0.85fr/1.15fr split with reader-gap spacing. Below it, content stacks. Without videos, no empty player column appears; the existing identity switches from stacked to horizontal at the medium breakpoint.

The editor opens below the header content, separated by a fine rule and panel-padding spacing. Fields span the available width. Action groups and ordered-video rows wrap on narrow screens, as the mobile capture demonstrates. Publication guidance remains directly below its checkbox.

The source-defined player uses one 16:9 principal frame and a three-column strip for up to three other videos. Titles and optional durations follow their media. Containers can shrink; poster images fit inside the frame without cropping.

## Elevation & Depth

The existing header retains a small shadow on its white or dark-neutral surface. A top divider distinguishes the inline editor; row dividers organize selected videos. Shared buttons retain their existing layered treatment. Editing, selection, errors, and removal confirmation do not introduce a new floating workspace.

## Shapes

The panel and main player use panel-player corners. The textarea and thumbnail frames use field-thumbnail corners. The identity portrait remains an 80px circle with its existing border and image-edit control. Shared buttons and badges remain fully rounded; the poster's play control is circular.

## Components

- **Identity and edit entry:** retain the name, portrait, category/privacy badges, and statistics. The capability-dependent outline edit button disables while editing; an unpublished record carries a textual draft marker.
- **Inline editor:** the labeled four-row textarea receives initial focus, permits vertical resizing, and limits the introduction to 1,200 characters. Selection uses the existing video-only `LibraryAssetPicker`; upload and asset editing stay in the library through a link labeled as opening a new tab.
- **Ordered selection:** stage at most four unique video references. The first is the trailer. Named up/down buttons expose ordering without drag dependence; boundary actions disable. Replace and remove remain explicit. Inline removal confirmation removes the reference, preserving the library media.
- **Publication and feedback:** the publication checkbox has visibility guidance and remains independent of save. Save uses the shared brand button; cancel uses outline. Pending work disables relevant controls and changes the save label. Failed validation or saving retains entered values and exposes an alert.
- **Focus:** retain the shared button's visible green outline and lighter dark-mode outline. Closing the editor restores focus to its initiating control. Closing the picker restores its opener, with the editor heading as fallback when replacement removes that opener. The interaction guard is local to this header.
- **Player, from source:** a named poster button starts playback explicitly; choosing another thumbnail also expresses play intent. Consecutive playback is an initially unchecked option. Keep one principal Cloudflare player, accessible title, loading status, error alert with retry, and polite title updates. Actual playback remains a separate verification task.
- **Visibility:** management capabilities determine which controls appear. Publication and asset visibility remain backend responsibilities; the explanatory copy does not itself establish authorization.

## Do's and Don'ts

- **Do** reuse Poppins, YEBAAM green/gold, shared controls, and the existing library picker.
- **Do** preserve compact spacing, wrapping labels/actions, clear publication guidance, and failed inputs.
- **Do** retain visible keyboard focus, named ordering controls, and explicit play intent.
- **Do** verify populated readers, remote playback, and persistence separately from these editor captures.
- **Don't** create another upload surface or delete library media when removing a featured reference.
- **Don't** promote this local header composition into a global design rule or treat its scoped review as full feature verification.
