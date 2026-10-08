---
name: YEBAAM community questions
description: Scoped visual contract for the implemented community questions, official answers, and category workspace.
colors:
  primary-800: "rgb(8, 118, 50)"
  primary-900: "rgb(5, 80, 35)"
  primary-300: "rgb(190, 228, 205)"
  secondary-900: "rgb(180, 75, 3)"
  secondary-300: "rgb(255, 225, 140)"
  neutral-200: "rgb(229, 231, 235)"
  neutral-300: "rgb(209, 213, 219)"
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
  body-small:
    fontFamily: Poppins
    fontSize: 0.875rem
    lineHeight: 1.25rem
  label:
    fontFamily: Poppins
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.25rem
  metadata:
    fontFamily: Poppins
    fontSize: 0.75rem
    lineHeight: 1rem
rounded:
  multiline: 0.5rem
  workspace: 0.75rem
  field: 1rem
  button: 9999px
spacing:
  action-gap: 0.5rem
  compact-gap: 0.75rem
  panel: 1rem
  panel-wide: 1.25rem
components:
  button-brand:
    backgroundColor: "{colors.primary-800}"
    textColor: "{colors.white}"
    rounded: "{rounded.button}"
  button-outline:
    rounded: "{rounded.button}"
  button-plain:
    rounded: "{rounded.button}"
  field:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.field}"
    height: 2.75rem
  private-status:
    textColor: "{colors.secondary-900}"
    typography: "{typography.metadata}"
  workspace:
    backgroundColor: "{colors.white}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.workspace}"
---

# Design System: Community questions

## Overview

This compact Operate/Read surface extends the incumbent YEBAAM community shell: green actions, restrained gold privacy markers, Poppins, flat white workspaces, and shared responsive controls. It establishes no new identity or metaphor. Root `PRODUCT.md` was absent; this record derives from implemented source and the established [surface direction](../../../../../.impeccable/surfaces/community-questions.md).

Visual authority remains the [global stylesheet](../../../../styles/tailwind.css), [application font](../../../../app/layout.tsx), shared [Button](../../../../ui/Button.tsx), [Input](../../../../ui/Input.tsx), [Select](../../../../ui/Select.tsx), and neighboring [events contract](../events/DESIGN.md). This document applies only to questions and answers.

**Key Characteristics:**

- Compact, wrapping controls and divided reading rows.
- Explicit private publication and textual status.
- Guarded inline editors with local feedback and focus restoration.

The finish review disposition is **ship at bounded UI scope**. Actual authenticated `localhost:3000` evidence uses CSS viewports 1440×1000 and 390×800, with full-page captures: [desktop list](../../../../../.impeccable/review/questions/desktop.png), [mobile list](../../../../../.impeccable/review/questions/mobile.png), [desktop form](../../../../../.impeccable/review/questions/desktop-form.png), [mobile form](../../../../../.impeccable/review/questions/mobile-form.png), [desktop detail](../../../../../.impeccable/review/questions/desktop-detail.png), [mobile detail](../../../../../.impeccable/review/questions/mobile-detail.png), [desktop categories](../../../../../.impeccable/review/questions/desktop-categories.png), and [mobile categories](../../../../../.impeccable/review/questions/mobile-categories.png).

The session reported browser saving and reloading a private question and private official answer, close/reopen, search/mine filters, category cancellation, and private category creation with focus returned to its create control. Verification records were subsequently archived through the normal RPC under the same author identity; the database confirmed that all three remained unpublished and were archived. It also reported 180 passing community tests, including seven focused UI tests for stable IDs, drafts, focus, roles, and pagination. These are separate evidence types: screenshots cover Spanish light mode only. Dark mode, English rendering, every permission combination, and complete institutional PDF coverage are not certified by this visual record.

## Colors

Primary green carries ask/save/answer controls, question links, FAQ markers, and official-answer labels. Brand buttons pair white labels with a deeper green optical border. Gold distinguishes private status in words; the surrounding community navigation retains its incumbent green/gold selection treatment.

White panels, dark neutral text, muted guidance/bylines, and thin separators keep reading order clear. Hidden state, moderation reasons, and errors use the incumbent red utilities with text. Code provides dark neutral surfaces, light text, lighter green accents, and light gold privacy labels; these are source-derived variants, not captured visual approval.

**The Textual Status Rule.** Privacy, open/closed state, FAQ, and moderation state remain readable words; color does not carry their meaning alone.

## Typography

Inherit Poppins. Workspace and question detail headings share the title role; row titles are semibold inherited body text. Descriptions and guidance use body-small, field labels use label, and author/date/status use metadata. Official-answer labels are semibold body-small. Shared inputs and selects retain their larger mobile text and compact small-breakpoint text.

Question and answer bodies preserve line breaks, wrap long content, and use relaxed line height in detail. List excerpts clamp to two lines. Byline dates use the active locale with `America/Bogota` and semantic time markup. No display type, uppercase kicker, or new font pairing is introduced by this surface.

## Layout

A single rounded workspace follows the community shell, with panel padding increasing to panel-wide at the existing small breakpoint (40rem). Headers, actions, and confirmation buttons wrap. Search spans the panel; category/view/state controls stack on narrow screens and form two equal columns from the small breakpoint. Category controls can shrink, and long titles, names, and bodies wrap.

Questions, answers, and categories use vertically divided rows rather than nested cards. Explicit load-more controls extend bounded cursor pages and expose pending/error states. The category picker can load more options, preserve a selected category outside the first page, and display unavailable selection text. The surrounding community navigation becomes the existing collapsible sections control on mobile.

## Elevation & Depth

Depth comes from panel boundaries, fine separators, and status color. This module adds no shadows, floating toolbars, modal editors, or decorative motion. Shared buttons retain their optical border and hover overlay. Inline editors and confirmations stay in reading flow. The route loading placeholder uses the inherited pulse animation and disables it for reduced motion.

**The Inline Workspace Rule.** Reading, editing, confirmation, and feedback occupy the same local workspace; competing controls become unavailable while an editor or mutation owns it.

## Shapes

Use the workspace radius for the main panel, multiline radius for textareas, and field radius for shared single-line inputs. Buttons and selects retain the shared pill silhouette. Inputs retain their field height; textareas grow by row count. Checkboxes stay compact, aligned with multiline publication guidance. Status is plain text, not a new badge component.

## Components

- **Search and filters:** labeled search, category, all/FAQ/mine/moderation, and open/closed controls submit URL-backed filters. Mine appears for signed-in users; moderation appears only with that capability. Reset clears unsent input changes as well as returning to the unfiltered route. Empty results and loading failures have distinct text.
- **Question editor:** labeled title, body, category, publication checkbox, save, and discard. New questions begin private; explanatory copy states who can read them and what publication changes. Save failures retain fields and the same generated request ID; pending saves disable the fieldset. The title receives initial focus. Discard navigates back; it does not implement an unsaved-navigation prompt.
- **Question detail:** textual status, wrapping title, author/date, optional category, private guidance, moderation reason when hidden, and full body. Owner editing is unavailable for closed or hidden questions. Representatives can categorize and mark eligible published questions as FAQ. Moderators can close/reopen and hide/restore. Ordinary readers do not receive these staff controls; SQL/RPC authorization remains authoritative.
- **Official answers:** separated rows with explicit official label, privacy/moderation state, byline, and body. Active representatives receive the answer composer when the question is open and visible. New answers begin private; their publication is explicit. Own eligible answers can be edited. Answer fields and IDs survive failed saves. The optional `refreshKey` in [useLibraryPage](../../hooks/useLibraryPage.ts) replaces changed server page data without remounting answer rows, preserving the focus-return target after save.
- **Categories:** compact name/position/publication editor plus divided rows. New categories begin unpublished. Edit controls include the category name in their accessible label. Cancellation restores the opener; pagination, unrelated edits, and navigation are disabled while the workspace editor is open. Category selection elsewhere does not silently publish a category.
- **Removal and moderation:** inline confirmation for archival; hiding also requires a reason. Archive confirmation initially focuses cancel, while hiding focuses the reason field. Cancellation restores the initiating control. Failed submissions preserve inputs and show a local alert. Restore uses the existing action flow. Moderation reasons remain visible in the authorized detail view.
- **Shared controls and feedback:** brand primary, outline secondary, and plain tertiary buttons retain disabled opacity and visible keyboard focus. Inputs use the shared green focus ring; selects retain native semantics and the shared focus treatment. `PlanFeedback` exposes failures as alerts and status as a live status region. Route errors provide retry; loading declares busy status. Guarded editors prevent unrelated mutations, pagination, and local back controls from discarding drafts.

## Do's and Don'ts

- **Do** reuse the incumbent Poppins, green/gold palette, shared controls, and compact wrapping layout.
- **Do** keep publication explicit, status textual, errors local, and keyboard focus recoverable.
- **Do** preserve stable mutation IDs and unsent editor fields after failed requests.
- **Do** retain server authorization and privacy checks independently of visible controls.
- **Don't** turn the official-answer label into permission for ordinary readers to answer.
- **Don't** reset answer rows by remounting the whole answers section after refreshed server data.
- **Don't** infer dark-mode, English, complete permission, or full institutional-specification coverage from the light Spanish screenshots.
