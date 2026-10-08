---
name: YEBAAM community About
description: Local contract for the built institutional About reader and inline editor.
typography:
  title:
    fontFamily: Poppins
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.75rem
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
  media: 0.5rem
  workspace: 0.75rem
  input: 1rem
spacing:
  panel: 1rem
  panel-wide: 1.5rem
  reading-sections: 1.75rem
  media-gap: 1.25rem
---

# Design System: Community About

## Overview

This local extension records the built About surface inside the existing community shell. It follows the user's compact, minimalist, responsive direction: institutional identity leads, contact facts remain easy to scan, and supporting media follows the reading content. Authorized editors work inline with the established controls.

Visual authority remains the [global stylesheet](../../../../styles/tailwind.css), [application font](../../../../app/layout.tsx), [shared controls](../../../../ui/), and neighboring [plans](../plans/DESIGN.md) and [library](../library/DESIGN.md) contracts. This file establishes no new global identity or palette.

The finish reviewer returned **ship** for five isolated real-component captures: [desktop](../../../../../.impeccable/review/community-about-desktop.png), [mobile editor error](../../../../../.impeccable/review/community-about-mobile-editor-error.png), [dark tablet reader](../../../../../.impeccable/review/community-about-tablet-reader-dark.png), [mobile empty](../../../../../.impeccable/review/community-about-mobile-empty.png), and [desktop media error](../../../../../.impeccable/review/community-about-desktop-media-error.png). Data and failures are clearly marked synthetic fixtures. This evidence covers the captured UI states; it does not prove authenticated integration, persistence, authorization, or actual Cloudflare Stream playback. Overall feature progress remains in [community-profile.md](../../../../../docs/architecture/community-profile.md).

## Colors

The workspace uses white with gray-900 text in light mode and gray-800 with white text in dark mode. Gray separators and secondary text keep institutional prose primary. Existing community blue identifies edit/save actions, external links, and selected formatting controls. Shared fields retain their existing green primary focus treatment.

Amber accompanies the textual unpublished-content marker. Red accompanies inline errors. Dark variants soften separators and use lighter links and feedback. The reviewed dark state is the tablet reader; it does not certify every editor or media state.

## Typography

Inherit Poppins. The workspace heading and official community name use the title role. Institutional prose sections and the media heading use the section-title role. Labels, facts, actions, and feedback use small body text; fact labels and inherited media metadata use the metadata role. Reading content uses the existing `prose prose-sm` styling with `dark:prose-invert`.

Long names, prose, contact values, and link labels can wrap anywhere. Rich text keeps its own heading and list hierarchy. The official name comes from the community identity and is displayed as context in the editor rather than duplicated as an editable field.

## Layout

The single workspace uses panel padding, increasing to panel-wide at the existing small breakpoint (40rem). The header and action groups wrap. Shrinkable containers preserve the reading width on narrow screens; no second page shell is introduced.

The official name and description lead. Populated contact facts follow in a definition list between thin horizontal rules, with one column below the small breakpoint and two above it. Website and social links wrap beneath the facts. History, mission, vision, objectives, and values follow as populated prose sections bounded by `max-w-prose`, separated by the reading-sections spacing. Empty facts and empty secondary prose sections are omitted.

The inline editor replaces the reading content. A section selector presents one rich-text field at a time while retaining the other fields in local state. Contact fields stack on mobile and pair at the small breakpoint; the website spans the available width. Social-link rows wrap their label, URL, and remove action. Supporting media follows a top divider in a one-column grid, becoming two columns at the small breakpoint, with the media-gap spacing.

## Elevation & Depth

Surface color and fine separators establish hierarchy without added workspace shadows. Shared buttons retain their incumbent layered treatment. Editing, media selection, feedback, and unlink confirmation remain inline.

## Shapes

The workspace and rich-text editor use the workspace radius. Library image frames use the media radius and a cropped 4:3 aspect ratio; video rendering is delegated to the existing Stream component. Inputs use the input radius, while shared selects and buttons remain fully rounded. Reading sections remain unboxed.

## Components

- **Workspace:** the title and capability-dependent create/edit action share a wrapping header. Section settings reuse `PlanSectionSettings`. Missing setup, empty reader, and empty editor states have distinct guidance. An unpublished About record carries a textual draft notice.
- **Reader:** use semantic headings, a definition list for facts, and labeled navigation for external links. External links have 44px minimum heights, visible focus, and accessible labels indicating the new tab. Optional content disappears without leaving decorative empty containers.
- **Editor:** reuse shared labeled `Input` and `Select` controls and the existing dynamically loaded `PlanTextEditor`. The selector receives initial focus; its rich-text control exposes an accessible multiline textbox and 44px formatting buttons. Save is blue; cancel is outline. Social links have individual labels, explicit remove actions, and a maximum of ten entries.
- **Publication and feedback:** a separate publication checkbox and explanatory copy accompany the form. Failed validation or mutation leaves entered values available for retry. Errors use `role="alert"`; mutation feedback uses `role="status"`. The captured failures are fixture behavior, not evidence of a real backend outage or successful save.
- **Editing guard:** reuse the plan interaction provider to prevent competing workspace mutations while an editor is open. Closing returns focus to the initiating control when it remains mounted. This is a local interaction guard, not a general protection against navigating away with unsaved content.
- **Media:** reuse `LibraryAssetView`, the image/video-only library picker, and named inline unlink confirmation. Media metadata includes editor-only audience and draft information. Pagination uses an explicit load-more control with inline error feedback. Readers with no media see no empty gallery; editors retain the add action and empty guidance. Selection links an existing library asset and does not create a separate upload flow.
- **Privacy presentation:** capabilities determine which management controls appear. Publication and asset visibility remain backend responsibilities; hidden controls and preview fixtures do not establish authorization correctness.

## Do's and Don'ts

- **Do** reuse the established typography, community blue, shared controls, and library media renderer.
- **Do** keep prose bounded, facts compact, labels visible, and actions wrapping on narrow screens.
- **Do** preserve entered content on failure and keep draft, publication, and error states explicit.
- **Do** verify authenticated persistence, visibility, and remote media separately from the visual fixtures.
- **Don't** turn this local reading layout into a global rule for unrelated features.
- **Don't** remove keyboard focus, touch targets, semantic headings, or status feedback to reduce density.
- **Don't** present the scoped screenshot verdict as completion of the full institutional specification.
