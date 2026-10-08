---
name: YEBAAM institutional plans
description: Local contract for the built institutional plan workspace within the existing community interface.
typography:
  title:
    fontFamily: Poppins
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.75rem
  point-title:
    fontFamily: Poppins
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.75rem
  body-small:
    fontFamily: Poppins
    fontSize: 0.875rem
    lineHeight: 1.25rem
rounded:
  navigation: 0.5rem
  workspace: 0.75rem
  field: 1rem
spacing:
  panel: 1rem
  panel-wide: 1.5rem
  columns: 1.25rem
---

# Design System: Institutional plans

## Overview

This is a scoped record of the built plan components, not a replacement for YEBAAM's visual system. The user direction is responsive, compact, minimalist, and consistent with existing colors and controls. Reading and editing share one workspace; management tools appear only for the corresponding capabilities.

Visual authority remains the [global stylesheet](../../../../styles/tailwind.css), [application font](../../../../app/layout.tsx), [shared controls](../../../../ui/), and [institutional navigation](../CommunityInstitutionalNav.tsx). No new visual identity, palette, or illustrative style is established here.

The review evidence is the isolated real-component preview in `.impeccable/review/community-plan-{desktop,mobile,tablet,mobile-error,reader,draft-guard}.png` at the repository root. It covers light rendering and draft preservation. It does not establish authenticated application integration or dark-mode visual verification. Overall feature completion remains tracked in [community-profile.md](../../../../../docs/architecture/community-profile.md).

The attachment extension adds a separate, bounded review: `.impeccable/review/community-attachments-{desktop,picker-desktop,mobile-error,tablet-confirm,reader-dark}.png`. These captures use the real components and shared CSS with fictional document data and no remote writes. They cover the resting editor and inline picker at 1440px, retained picker feedback after a fixture write failure at 390px, unlink confirmation at 768px, and the document reader in dark mode at 768px. The mobile check recorded a 390px document scroll width. The review disposition is ship for these captured document states only; it does not verify the PDF viewer/download flow, authenticated application integration, image/video variants, or every dark editor state. No new raster assets ship with this extension.

## Colors

The user explicitly corrected the palette to YEBAAM green and gold. Primary actions use the shared `brand` button (`primary-800`, white labels); selected institutional tabs, plan axes, and formatting controls use pale gold (`secondary-100`) with dark green text, changing to a dark green surface with light gold text in dark mode. Earlier fixture screenshots predate this correction and are historical layout evidence only.

White surfaces, dark text, muted gray descriptions, and thin gray separators carry the workspace. YEBAAM primary green identifies actions, links and formatting controls; secondary gold highlights selected tabs and axes. All colors come from the existing global primary, secondary and neutral tokens.

Brand gold text marks unpublished content and hidden sections. Red marks error feedback and destructive confirmation. Draft and hidden states always include words. Shared fields retain their existing green primary focus treatment; navigation retains its green focus outline.

Dark variants use dark gray workspace surfaces, darker editor surfaces, light text, and softened green/gold/red states as defined in the components. The original plan review did not capture these variants; the attachment review adds only the dark document-reader state described above.

## Typography

Poppins is inherited from the application. Section and axis headings use the title role; point and form headings use the point-title role. Descriptions, labels, navigation, and feedback generally use the small body role; axis descriptions retain the inherited body size. Headings wrap long strings. Rich content uses the existing small prose styling, with a readable prose width rather than filling every available horizontal pixel.

## Layout

At the existing extra-large breakpoint (80rem), the workspace is a master/detail grid: an axis column with a minimum width of 180px and one fractional share, followed by a detail column with three shares and a zero minimum. Column spacing follows the frontmatter. Below that breakpoint, axes start collapsed behind a full-width disclosure, keeping the selected axis and points near the top of the reading flow. Selecting an axis closes the disclosure.

Workspace padding grows from the panel spacing to panel-wide at the small breakpoint (40rem). Headers and action groups wrap; long titles can break; grid children allow shrinking. Institutional tabs scroll horizontally when needed. Point rows are separated by rules. Forms are inserted in context. The layout does not introduce a second page shell.

Attachments follow the point's reading content and precede its collapsed management actions. Document rows span the full detail width. The implemented image/video layout uses two columns from the small breakpoint and a single column below it. The picker opens inline above the existing attachments; its labeled type selector, search field, and submit action wrap with the available width. File titles and original filenames wrap inside shrinkable result rows.

## Elevation & Depth

The workspace uses surface color, separators, and borders for hierarchy, without added card shadows. The shared button's existing layered treatment remains authoritative. Point management uses an inline native disclosure rather than an elevated menu.

## Shapes

Workspace and editor containers use the workspace radius; axis links use the navigation radius; shared fields use the field radius. Shared buttons remain fully rounded. Rounded forms have visible borders. Point rows themselves remain unboxed.

## Components

- **Navigation:** selected tabs and axes have gold tonal backgrounds and `aria-current`. Axes expose an expanded state and a controlled navigation region on narrower screens.
- **Actions:** reuse shared `Button` variants: brand green for save/create, plain for inline management, outline for cancellation and pagination, red for confirmed deletion. The point action list uses native `details`/`summary`; reorder controls include explicit movement buttons as well as drag affordances.
- **Drafts:** unpublished titles carry a textual draft marker. Readers receive the same reading hierarchy without editing controls; visibility and authorization remain backend responsibilities.
- **Forms:** reuse shared `Input` and `Textarea`, visible labels, required titles, length limits, and an explicit publish checkbox. Submit is handled without resetting uncontrolled fields after a failed action. Errors remain next to the form with `role="alert"`; progress/status feedback uses `role="status"`.
- **Rich editor:** the existing Tiptap editor provides bold, italic, heading, list, quote, undo, and redo controls. Toolbar buttons have accessible names, pressed states where applicable, and 44px square targets. Content has an accessible multiline textbox role and a minimum height of 10rem.
- **Editing guard:** one workspace editor or mutation is active at a time. Other mutations and axis links are blocked while editing; a status message explains that editing must finish. A failed save leaves fields and rich content available for retry. This is a workspace guard, not a general unsaved-navigation guard for leaving the page.
- **Deletion:** show the item's named confirmation inline, with destructive and cancel actions. Preserve pending/disabled feedback and the same error reporting path.
- **Attachments:** reuse `LibraryAssetView` for document rows and media rendering. Document metadata stays secondary to the file title, with download and supported preview links below. Editors see file audience and draft status; readers have no attach/unlink controls and no empty attachment section. Attaching preserves the library file's audience, folder, and publication state; the picker states this explicitly.
- **Attachment picker:** reuse shared `Select`, `Input`, and outline buttons in a neutral rounded inset. Default to documents; offer image and video types and an explicitly submitted title/description search. Results show title, original filename, audience, and a textual draft marker where applicable. Already attached results have a disabled named state. Loading uses status feedback; failed initial reads offer retry; empty results have explanatory copy. Cursor pagination uses load-more controls for both results and attached files. Mutation errors remain beside the open picker.
- **Unlinking:** a named inline confirmation explains that the file remains in the library and in other plan points. Its confirm action uses the incumbent brand green button, because it removes this relationship rather than deleting the file. Cancellation and mutation feedback remain local to the row.
- **Attachment focus and editing:** opening the picker focuses its search field; opening unlink confirmation focuses its confirm action. Closing returns focus to the initiating control when it remains mounted. Both flows share the existing single-workspace-editor guard, disabling unrelated mutations while preserving failed work for retry.

## Do's and Don'ts

- **Do** extend the existing shared controls, typography, and community selection colors.
- **Do** keep action groups wrapping, reading text bounded, and management details collapsible on small screens.
- **Do** preserve entered text after failures and prevent unrelated workspace mutations from replacing an active draft.
- **Do** keep attachment audience and draft labels explicit, and distinguish unlinking from deleting the library file.
- **Do** verify real application navigation and dark rendering separately from the isolated preview.
- **Don't** turn this local master/detail layout into a rule for unrelated features.
- **Don't** remove textual states, keyboard movement controls, visible focus, or inline errors to reduce visual density.
- **Don't** present the scoped preview review as proof that the complete institutional feature is finished.
