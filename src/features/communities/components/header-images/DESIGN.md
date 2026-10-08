---
name: YEBAAM community identity images
description: Local contract for cover and profile image framing dialogs.
colors:
  primary-800: "rgb(8, 118, 50)"
  primary-300: "rgb(190, 228, 205)"
  neutral-100: "rgb(243, 244, 246)"
  neutral-200: "rgb(229, 231, 235)"
  neutral-600: "rgb(75, 85, 99)"
  neutral-800: "rgb(31, 41, 55)"
  neutral-900: "rgb(17, 24, 39)"
typography:
  title:
    fontFamily: Poppins
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.75rem
  body-small:
    fontFamily: Poppins
    fontSize: 0.875rem
    lineHeight: 1.25rem
  hint:
    fontFamily: Poppins
    fontSize: 0.75rem
    lineHeight: 1rem
rounded:
  preview: 0.5rem
  dialog: 0.75rem
spacing:
  action-gap: 0.5rem
  section-gap: 0.75rem
  panel-padding: 1rem
  panel-padding-wide: 1.5rem
---

# Design System: Community identity images

## Overview

This local extension preserves YEBAAM's compact community header and shared visual language. Owners preview image framing in a focused dialog before saving. Visual authority remains the [global stylesheet](../../../../styles/tailwind.css), [shared Button](../../../../ui/Button.tsx), and components in this directory; the [surface brief](../../../../../.impeccable/surfaces/community-header-images.md) defines scope.

The actual localhost [desktop cover](../../../../../.impeccable/review/community-images-desktop.png) and [mobile profile](../../../../../.impeccable/review/community-images-mobile.png) captures were reviewed with disposition **ship**, with no material fixes for those editor states. Their CSS viewports are 1440 × 1000 and 390 × 800; blank canvas outside those bounds is capture padding. These captures do not establish a real upload/save roundtrip or dark-mode rendering. Behavioral guidance below records the built implementation.

## Colors

YEBAAM green marks the selected preview-size button, save action, range controls, and keyboard focus. The unselected preview choice uses the shared outline button. Light green supplies dark-mode range and focus treatment. Existing gold identity imagery remains image content, without introducing a new editor accent.

The white dialog uses dark neutral text, subdued explanatory text, pale image placeholders, and fine separators. Dark mode switches the dialog to neutral-900, placeholder to neutral-800, and text to white or light neutrals. Errors use the existing red treatment. Frontmatter preserves the stylesheet's RGB notation.

## Typography

Inherit Poppins. The dialog heading uses the title role; guidance, field labels, numeric values, confirmation text, and feedback use body-small. File constraints use hint. The framing legend is semibold; numeric values use tabular figures, percentages for position, and two decimal places with a multiplication sign for zoom. Shared buttons retain their responsive typography.

## Layout

Center a single dialog with a maximum width of 36rem inside a vertically scrollable viewport. Outer clearance is 0.75rem, increasing to 1.5rem at the small breakpoint (40rem). Panel padding follows panel-padding and panel-padding-wide at that breakpoint. Keep section-gap vertical spacing and action-gap between wrapping controls; the mobile file hint can occupy its own line.

Cover preview choices show a full-width 3:1 wide frame or a 16:9 mobile frame capped at 18rem. These correspond to the responsive banner shapes. Profile preview is a centered 9rem circle. Position and zoom controls fill the available width. Save/cancel and removal-confirmation actions wrap, separated from preceding content by a fine rule and 1rem top padding.

## Elevation & Depth

A half-opacity black backdrop dims the existing page while a large shadow lifts the dialog. The dialog sits above the app at layer 60. Image previews remain flat; shared buttons retain their existing layered border and hover treatments.

## Shapes

Use dialog corners for the panel and preview corners for cover frames. Clip overflow at every image frame. Profile previews remain circular; action buttons use the shared fully rounded shape. Preserve native range controls with a 2.25rem interaction height.

## Components

- **Protected-focus dialog:** use the existing Headless UI dialog, named title, and description. Preserve its focus containment and return to the opener. Pending work prevents dismissal and disables relevant actions. Keep visible shared button and range focus outlines.
- **Framed image:** preview and displayed header share `FramedImage`, with cover fit, percentage object position, matching transform origin, and zoom scale. Framing changes presentation only; retain the original Cloudflare image.
- **Preview selector:** wide/mobile choices are buttons with pressed state. The selected choice is solid green and the alternate is outline; retain labels alongside color state.
- **Framing controls:** use labeled native ranges for horizontal and vertical position (0–100, step 1) and zoom (1–3, step 0.05). Reset restores the shared default framing. Disable controls until the image loads, during saving, and during removal confirmation.
- **Replacement and feedback:** choose or replace a local image through the existing file control and preview it before upload. Save uses the shared brand button; cancel uses outline. Keep entered framing and the preview after an error, expose errors as alerts and pending feedback as status. Reuse a successful upload on a save retry.
- **Removal:** require inline confirmation before removing the header image reference. Move focus to confirmation, and restore it to the removal opener when keeping the image. Preserve the underlying original; reference removal does not delete Cloudflare media.

## Do's and Don'ts

- **Do** reuse shared buttons, Poppins, native keyboard-operable ranges, and the same image framing renderer for previews and saved presentation.
- **Do** preserve compact spacing, wrapping actions, clear selected state, and visible keyboard focus.
- **Do** treat upload/save persistence and dark-mode appearance as separate verification work from these captures.
- **Don't** crop or overwrite the original image, upload on selection alone, or write changes when canceling.
- **Don't** promote this local dialog layout into a new global design system.
