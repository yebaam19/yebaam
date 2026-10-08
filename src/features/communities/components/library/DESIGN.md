---
name: YEBAAM community library
description: Scoped contract for the built library extension within the existing community interface.
typography:
  title:
    fontFamily: Poppins
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.75rem
  form-title:
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
  navigation: 0.5rem
  workspace: 0.75rem
  field: 1rem
spacing:
  panel: 1rem
  panel-wide: 1.25rem
  control-gap: 0.75rem
---

# Design System: Community library

## Overview

This local extension inherits YEBAAM's established interface: compact, responsive, minimalist, and built from shared controls. Documents use readable rows with inline management; image and video variants use media grids. This contract establishes no new identity or palette.

Visual authority remains the [global stylesheet](../../../../styles/tailwind.css), [application font](../../../../app/layout.tsx), [shared controls](../../../../ui/), [community tabs](../CommunityTopTabs.tsx), and neighboring [institutional plans](../plans/DESIGN.md).

The finish review returned **ship** for six document states in the isolated actual-component preview: [desktop](../../../../../.impeccable/review/community-library-desktop.png), [mobile](../../../../../.impeccable/review/community-library-mobile.png), [tablet](../../../../../.impeccable/review/community-library-tablet.png), [mobile form error](../../../../../.impeccable/review/community-library-mobile-error.png), [dark reader](../../../../../.impeccable/review/community-library-dark-reader.png), and [empty](../../../../../.impeccable/review/community-library-empty.png), using 1440px, 390px, and 768px viewport widths. Data was labeled fictional and remote writes were disabled. These captures do not prove authenticated production integration, successful uploads/downloads, or photo/video rendering. Overall feature progress remains in [community-profile.md](../../../../../docs/architecture/community-profile.md); this extension does not establish completion of the full PDF specification.

## Colors

The user explicitly corrected the palette to YEBAAM green and gold. Primary actions use the shared `brand` button (`primary-800`, white labels); selected institutional tabs, plan axes, and formatting controls use pale gold (`secondary-100`) with dark green text, changing to a dark green surface with light gold text in dark mode. Earlier fixture screenshots predate this correction and are historical layout evidence only.

Use existing YEBAAM brand green for primary upload/save actions, links, and progress; the active institutional tab pairs pale gold with dark green text. White surfaces, gray text and separators, and restrained gray icons carry the document hierarchy. Shared fields retain the application's green primary focus treatment; tabs and action controls retain their existing green focus outlines.

Brand gold accompanies textual draft/hidden markers; red accompanies errors and confirmed destructive actions. Dark variants use dark gray surfaces, light text, subdued separators, and lighter links and feedback. The dark reader capture covers the document reading state only.

## Typography

Inherit Poppins. Workspace headings use the title role; inline panel headings use the form-title role. Document titles are semibold small body text, descriptions and labels use small body text, and dates, sizes, file extensions, uploader names, and editor-only visibility information use the metadata role. Long titles and descriptions wrap; queued filenames can break anywhere. Do not make metadata compete with the title.

## Layout

The workspace uses panel padding, increasing to panel-wide at the existing small breakpoint (40rem). Headers and action groups wrap. Below that breakpoint, search spans the first row and the folder filter shares the next row with its submit action. Above it, search, folder, and submit occupy one row. Asset editing stacks folder and audience fields on mobile and pairs them at the small breakpoint.

Documents remain a single column, separated by thin rules, with a small leading document icon and flexible content. Media variants have one column initially, two at the small breakpoint, and three at the extra-extra-large breakpoint (96rem); images use a cropped 4:3 frame. Those media variants are recorded from code, not screenshot approval.

The community tabs scroll horizontally, keep their labels on one line, and scroll the active tab into view after path changes. Inline editing panels appear above filters and results. Asset and folder collections expose explicit load-more actions rather than an unbounded rendered list. Empty-library and filtered-no-results states use different guidance.

## Elevation & Depth

Surface color, fine borders, and document separators provide hierarchy. The workspace adds no card shadow; the active tab retains its small shadow and shared buttons retain their existing layered treatment. Inline management uses native disclosures rather than floating menus.

## Shapes

Use the workspace radius for the main surface and inline panels, the navigation radius for the tab rail and media frames, and the shared field radius for inputs. Shared buttons remain fully rounded. Document rows stay unboxed. Tabs, document links, disclosure triggers, and checkbox labels have minimum 44px heights; shared buttons retain their minimum 44px touch hit areas.

## Components

- **Navigation and actions:** tabs expose `aria-current`; controls preserve visible keyboard focus. Blue identifies upload/save, outline identifies filtering/cancellation/pagination, plain identifies inline management, and red identifies confirmed deletion. Management disclosures name their asset for assistive technology.
- **Document rows:** show title, optional description, date, optional size/uploader, and file extension. Download points to the asset file route; PDF and plain-text documents additionally offer a named new-tab preview. Link presence is not evidence of successful remote delivery.
- **Editor:** shared labeled input, textarea, and selects retain entered values on failed saves. Title, description, and folder title limits are 200, 4000, and 120 characters. Only one workspace panel opens at once; filters and other mutation controls are disabled while it is open. Opening moves focus to the panel; closing restores focus to its trigger. This is not a general guard against leaving the route with an unsaved edit.
- **Feedback:** form and pagination errors use `role="alert"`; mutation and upload states use `role="status"`; the result region exposes busy state. The route error surface provides retry, and loading uses concise textual status. The captured form failure is the preview's disabled-write response, not a production outage test.
- **Upload queue:** select up to 20 files, or one replacement, and process sequentially. The queue names each file and its queued/uploading/processing/saving/saved/error state, with progress during upload. Retry skips saved entries and preserves received remote IDs for finalization. Closing an unfinished queue requires inline confirmation; browser unload receives a guard. These controls do not establish resumability across reloads or a universal client-navigation guard. Limits come from [upload-limits.ts](../../../../lib/upload-limits.ts): 10 MiB per image/document and 200 MiB per video. PDF-only mode restricts selection to PDF. Transfers use the existing upload service.
- **Privacy presentation:** editing capabilities determine management controls. Editors see audience and draft markers; readers receive the reading layout without these management controls. Asset editing exposes editors/members/public audiences and a separate publication checkbox; new folder visibility starts unchecked. Keep privacy hints and textual states. These UI controls are not authorization: backend visibility, folder restrictions, and community privacy remain authoritative and are not certified by the isolated preview.
- **Deletion:** name the selected asset or folder in an inline confirmation, preserve cancel, and disable destructive actions while pending. Folder management stays within the same workspace panel.

## Do's and Don'ts

- **Do** reuse shared typography, community colors, fields, and button variants.
- **Do** keep document rows compact while preserving wrapping, touch targets, visible focus, and readable metadata.
- **Do** preserve entered data after failure, explicit audience/publication controls, and inline error feedback.
- **Do** verify authenticated navigation, file delivery, queue behavior, and media variants separately from document preview captures.
- **Don't** turn this local row/grid composition into a rule for unrelated surfaces.
- **Don't** replace privacy enforcement with hidden buttons or treat the visual review as backend validation.
- **Don't** describe the six document captures as approval of every library state or completion of the full institutional specification.
