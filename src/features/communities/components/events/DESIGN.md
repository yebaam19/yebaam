---
name: YEBAAM community events
description: Scoped visual contract for the implemented community event list, calendar, detail, and editor.
colors:
  primary-800: "rgb(8, 118, 50)"
  primary-900: "rgb(5, 80, 35)"
  primary-300: "rgb(190, 228, 205)"
  secondary-100: "rgb(255, 237, 197)"
  secondary-300: "rgb(255, 225, 140)"
  secondary-900: "rgb(180, 75, 3)"
  neutral-200: "rgb(229, 231, 235)"
  neutral-600: "rgb(75, 85, 99)"
  neutral-800: "rgb(31, 41, 55)"
  neutral-900: "rgb(17, 24, 39)"
  white: "#ffffff"
typography:
  title:
    fontFamily: Poppins
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.75rem
  detail-title:
    fontFamily: Poppins
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 2rem
  body-small:
    fontFamily: Poppins
    fontSize: 0.875rem
    lineHeight: 1.25rem
  metadata:
    fontFamily: Poppins
    fontSize: 0.75rem
    lineHeight: 1rem
rounded:
  calendar: 0.5rem
  workspace: 0.75rem
  field: 1rem
  button: 9999px
spacing:
  action-gap: 0.5rem
  field-gap: 1rem
  panel: 1rem
  panel-wide: 1.25rem
components:
  button-brand:
    backgroundColor: "{colors.primary-800}"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
  calendar-selected:
    backgroundColor: "{colors.primary-800}"
    textColor: "{colors.white}"
    rounded: "{rounded.calendar}"
  draft-label:
    backgroundColor: "{colors.secondary-100}"
    textColor: "{colors.secondary-900}"
    typography: "{typography.metadata}"
---

# Design System: Community events

## Overview

This local extension follows the user's compact, minimalist, responsive YEBAAM green/gold direction. It inherits the existing community shell and shared controls. No new identity, metaphor, or product positioning is established.

Visual authority remains the [global stylesheet](../../../../styles/tailwind.css), [application font](../../../../app/layout.tsx), shared [Button](../../../../ui/Button.tsx) and [Input](../../../../ui/Input.tsx), and neighboring [library](../library/DESIGN.md) and [plans](../plans/DESIGN.md) contracts. The local [surface brief](../../../../../.impeccable/surfaces/community-events.md) records the feature direction. Root `PRODUCT.md` was absent; this document records implemented evidence rather than supplying product assumptions.

The finish reviewer disposition is **ship** for five actual localhost captures: [desktop](../../../../../.impeccable/review/community-events-desktop.png), [create desktop](../../../../../.impeccable/review/community-events-create-desktop.png), [mobile](../../../../../.impeccable/review/community-events-mobile.png), [mobile calendar](../../../../../.impeccable/review/community-events-calendar-mobile.png), and [mobile sidebar](../../../../../.impeccable/review/community-events-sidebar-mobile.png). These cover empty list/calendar, the creation surface, and responsive navigation. Mobile DOM measurement recorded 390px scroll width in a 390px viewport; external screenshot canvas padding is not document overflow.

Populated detail, browser-persisted mutations, and dark mode were not captured. The separately reported SQL checks and 18 focused passing tests do not expand screenshot coverage. The subsequent focus-restoration correction in `EventActions` waits for pending completion and does not alter layout. This is a scoped visual record, not certification of every feature state or completion of the whole institutional specification.

## Colors

Primary green carries create/save actions, selected list/calendar controls, selected dates, links, and ordinary event status. Shared brand buttons pair white labels with the dark green surface and deeper green border. Gold carries textual draft markers and the inherited community selection language; event view selection itself stays green.

White workspaces, dark neutral text, muted descriptions, and thin neutral separators provide the reading hierarchy. Cancelled status and error feedback use the existing red utilities and retain words. Dark variants use dark neutral surfaces, white text, lighter green links/status, and a deep green draft surface with light gold text. These dark treatments are extracted from code, not visually approved captures.

## Typography

Inherit Poppins throughout. List and form headings use the title role; the event detail title uses detail-title. Event row titles are semibold inherited body text. Labels, date descriptions, field guidance, and feedback use body-small; timezone notes in detail, weekday names, counts, and status labels use metadata. Calendar dates use tabular numerals.

Long titles, organizers, locations, and descriptions wrap within the available width. Detail descriptions preserve line breaks and use relaxed line height. Do not enlarge metadata into a competing heading.

## Layout

The workspace is a single rounded surface with panel padding, increasing to panel-wide at the existing small breakpoint (40rem). Header actions, filters, view controls, and confirmation controls wrap. The month field flexes with a 10rem minimum; its submit action remains adjacent when space permits. Form date fields stack below the small breakpoint and form two equal columns above it, with shrinkable children.

List entries are unboxed rows divided by fine rules. Month queries return 30 events per page with cursor-based load more. When another page exists, explanatory copy states that the collection is partial; calendar counts reflect loaded events. Selecting a date filters the list below the calendar and exposes a return-to-whole-month control. Empty-month and empty-day guidance are distinct.

The calendar keeps seven equal columns with a 0.25rem gap, Monday-first weekday labels, and date controls at least 3.5rem tall. Detail covers use a contained 16:9 frame; form previews are contained with a 12rem maximum height. Both retain the original image rather than prescribing a crop. The inherited community navigation and mobile sidebar remain the surrounding shell.

## Elevation & Depth

Workspace boundaries, separators, and tonal selection provide depth. Events add no card shadows or floating management menu. Shared buttons retain their existing border and hover layers; confirmations and the library picker appear inline. No new animation vocabulary is introduced.

## Shapes

Use the workspace radius for the main section, calendar radius for dates, cover frames, and multiline fields, and shared field radius for single-line inputs. Shared buttons remain fully rounded. Shared inputs are 2.75rem tall; multiline fields grow by their configured rows. The date grid preserves its compact geometry on narrow screens rather than becoming a horizontally scrolling calendar.

## Components

- **View and month controls:** labeled native month input, explicit submit, and list/calendar buttons with `aria-pressed`. Selected views use brand green, unselected views use outline. Calendar days expose full date/count names and pressed state, with visible keyboard outlines.
- **Event states:** draft is a textual gold label. Upcoming, ongoing, finished, and cancelled labels derive from event dates or cancellation; time formatting and calendar boundaries use `America/Bogota`. Timezone guidance remains visible in the index, editor, and detail.
- **Editor:** reuse shared `Input` and `Button`, labeled multiline fields, native date/time and URL controls, and explicit RSVP/publication checkboxes. New events start unpublished with RSVP unchecked. Fields retain values on failed saves; pending work disables editing. Save is also disabled while the cover picker is open. The title receives initial focus. Discard navigates away; the form does not implement an unsaved-navigation confirmation.
- **Cover picker:** select an image through the existing library picker, with a link to the photo library for library management. Selection preserves the asset's publication, audience, and folder restrictions; it does not republish the image. An unavailable selected cover receives text feedback. Closing restores focus to the picker opener. Keep library loading, empty, error, and pagination behavior.
- **Detail:** cover when visible, textual status, wrapping title, labeled start/end/organizer/location, optional virtual link, description, and registration information. Sharing uses native share when available or copies the event link, with status feedback. Do not substitute public attendee lists for the own-attendance control.
- **Attendance:** published events may expose the signed-in user's optional RSVP. Show current attendance in text, disable the action while pending, and preserve inline failures. Existing attendees can withdraw even when new attendance is closed. Signed-out visitors receive sign-in guidance; closed registration has its own message.
- **Lifecycle actions:** management controls are capability-gated in presentation. Cancellation and archival require inline confirmation, disable competing actions while open, and preserve failures for retry. Confirm uses the incumbent brand button; back uses outline. Opening focuses confirm; backing out restores the initiating control. Successful cancellation restores focus to edit after pending completes; archival returns to the index. Backend checks, optimistic versions, and audit records remain authoritative.
- **Feedback:** shared `PlanFeedback` exposes errors as alerts. Pagination, save, and attendance controls show pending labels and disable repeat submissions. Share and current-attendance messages use status feedback. These code paths are not all represented in the five screenshots.

## Do's and Don'ts

- **Do** extend the existing green/gold system and shared controls with compact, wrapping layouts.
- **Do** preserve textual status, timezone guidance, keyboard focus, explicit pagination, and local errors.
- **Do** keep new drafts private and show only the caller's own attendance state.
- **Do** retain library privacy when selecting a cover and backend authorization for every mutation.
- **Don't** imply that loaded calendar counts represent unloaded pages.
- **Don't** treat hidden management controls as authorization or a visual review as proof of persisted behavior.
- **Don't** claim populated detail, browser mutation persistence, or dark rendering were verified by these captures.
