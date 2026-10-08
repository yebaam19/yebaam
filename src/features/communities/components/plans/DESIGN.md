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

## Colors

White surfaces, dark text, muted gray descriptions, and thin gray separators carry the workspace. Existing Tailwind blue shades identify the selected institutional tab, selected axis, active formatting controls, and primary save/create actions. These do not replace the global primary palette.

Amber text marks unpublished content and hidden sections. Red marks error feedback and destructive confirmation. Draft and hidden states always include words. Shared fields retain their existing green primary focus treatment; navigation retains its blue focus outline.

Dark variants use dark gray workspace surfaces, darker editor surfaces, light text, and softened blue/amber/red states as defined in the components. Those variants are implemented but were not visually captured in this review.

## Typography

Poppins is inherited from the application. Section and axis headings use the title role; point and form headings use the point-title role. Descriptions, labels, navigation, and feedback generally use the small body role; axis descriptions retain the inherited body size. Headings wrap long strings. Rich content uses the existing small prose styling, with a readable prose width rather than filling every available horizontal pixel.

## Layout

At the existing extra-large breakpoint (80rem), the workspace is a master/detail grid: an axis column with a minimum width of 180px and one fractional share, followed by a detail column with three shares and a zero minimum. Column spacing follows the frontmatter. Below that breakpoint, axes start collapsed behind a full-width disclosure, keeping the selected axis and points near the top of the reading flow. Selecting an axis closes the disclosure.

Workspace padding grows from the panel spacing to panel-wide at the small breakpoint (40rem). Headers and action groups wrap; long titles can break; grid children allow shrinking. Institutional tabs scroll horizontally when needed. Point rows are separated by rules. Forms are inserted in context. The layout does not introduce a second page shell.

## Elevation & Depth

The workspace uses surface color, separators, and borders for hierarchy, without added card shadows. The shared button's existing layered treatment remains authoritative. Point management uses an inline native disclosure rather than an elevated menu.

## Shapes

Workspace and editor containers use the workspace radius; axis links use the navigation radius; shared fields use the field radius. Shared buttons remain fully rounded. Rounded forms have visible borders. Point rows themselves remain unboxed.

## Components

- **Navigation:** selected tabs and axes have blue tonal backgrounds and `aria-current`. Axes expose an expanded state and a controlled navigation region on narrower screens.
- **Actions:** reuse shared `Button` variants: blue for save/create, plain for inline management, outline for cancellation and pagination, red for confirmed deletion. The point action list uses native `details`/`summary`; reorder controls include explicit movement buttons as well as drag affordances.
- **Drafts:** unpublished titles carry a textual draft marker. Readers receive the same reading hierarchy without editing controls; visibility and authorization remain backend responsibilities.
- **Forms:** reuse shared `Input` and `Textarea`, visible labels, required titles, length limits, and an explicit publish checkbox. Submit is handled without resetting uncontrolled fields after a failed action. Errors remain next to the form with `role="alert"`; progress/status feedback uses `role="status"`.
- **Rich editor:** the existing Tiptap editor provides bold, italic, heading, list, quote, undo, and redo controls. Toolbar buttons have accessible names, pressed states where applicable, and 44px square targets. Content has an accessible multiline textbox role and a minimum height of 10rem.
- **Editing guard:** one workspace editor or mutation is active at a time. Other mutations and axis links are blocked while editing; a status message explains that editing must finish. A failed save leaves fields and rich content available for retry. This is a workspace guard, not a general unsaved-navigation guard for leaving the page.
- **Deletion:** show the item's named confirmation inline, with destructive and cancel actions. Preserve pending/disabled feedback and the same error reporting path.

## Do's and Don'ts

- **Do** extend the existing shared controls, typography, and community selection colors.
- **Do** keep action groups wrapping, reading text bounded, and management details collapsible on small screens.
- **Do** preserve entered text after failures and prevent unrelated workspace mutations from replacing an active draft.
- **Do** verify real application navigation and dark rendering separately from the isolated preview.
- **Don't** turn this local master/detail layout into a rule for unrelated features.
- **Don't** remove textual states, keyboard movement controls, visible focus, or inline errors to reduce visual density.
- **Don't** present the scoped preview review as proof that the complete institutional feature is finished.
