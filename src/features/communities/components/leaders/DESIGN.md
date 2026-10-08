---
name: YEBAAM community leaders
description: Local contract for the built community leader directory and inline profile management.
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
  card-title:
    fontFamily: Poppins
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1.5rem
  body-small:
    fontFamily: Poppins
    fontSize: 0.875rem
    lineHeight: 1.25rem
  metadata:
    fontFamily: Poppins
    fontSize: 0.75rem
    lineHeight: 1rem
rounded:
  video: 0.5rem
  workspace: 0.75rem
  input: 1rem
spacing:
  panel: 1rem
  panel-wide: 1.5rem
  grid-gap: 1rem
  reading-sections: 1.75rem
---

# Design System: Community leaders

## Overview

This local extension records the built leader directory and detail workspace within YEBAAM's existing community interface. The user direction is compact, minimalist, responsive, and consistent with established colors and controls. Photo, name, and responsibility lead the directory; biography, trajectory, optional media, and explicitly published contact information form the detail view. Authorized editors manage content inline.

Visual authority remains the [global stylesheet](../../../../styles/tailwind.css), [application font](../../../../app/layout.tsx), [shared controls](../../../../ui/), and neighboring [About](../about/DESIGN.md), [plans](../plans/DESIGN.md), and [library](../library/DESIGN.md) contracts. The [surface brief](../../../../../.impeccable/surfaces/community-leaders.md) records the local direction. This file establishes no new global identity or palette.

The fresh finish reviewer returned **ship**, with no material fixes, for seven isolated real-component captures: [desktop](../../../../../.impeccable/review/community-leaders-desktop.png), [mobile editor error](../../../../../.impeccable/review/community-leaders-mobile-editor-error.png), [dark tablet reader](../../../../../.impeccable/review/community-leaders-tablet-dark-reader.png), [mobile contact error](../../../../../.impeccable/review/community-leaders-mobile-contact-error.png), [mobile empty](../../../../../.impeccable/review/community-leaders-mobile-empty.png), [desktop category error](../../../../../.impeccable/review/community-leaders-desktop-category-error.png), and [desktop media error](../../../../../.impeccable/review/community-leaders-desktop-media-error.png). These previews use explicit synthetic fixtures and inert remote actions. They establish the captured visual states, not authenticated persistence, successful uploads, cover/video playback, or completion of the full PDF specification. Overall feature progress remains in [community-profile.md](../../../../../docs/architecture/community-profile.md).

The palette follow-up received **ship**, with no fixes, in the five-section review contract. Its authenticated `localhost:3000` evidence is the [desktop brand capture](../../../../../.impeccable/review/community-brand-live-desktop.png) and [mobile sidebar capture](../../../../../.impeccable/review/community-sidebar-live-mobile.png). The live leaders route showed the setup state only; the check made no remote writes and does not verify populated leaders, editing, or persistence. Earlier fixtures remain historical layout/state evidence and predate the palette correction.

## Colors

The user explicitly corrected the palette to YEBAAM green and gold. Primary actions use the shared `brand` button (`primary-800`, white labels); selected institutional tabs, plan axes, and formatting controls use pale gold (`secondary-100`) with dark green text, changing to a dark green surface with light gold text in dark mode. Earlier fixture screenshots predate this correction and are historical layout evidence only.

White workspaces with neutral-900 text become neutral-800 with white text in dark mode. Gray separators, secondary text, and portrait placeholders keep the people and their content primary. Existing YEBAAM brand green identifies save/create/edit actions, links, and card-name hover states; selected rich-text formatting controls pair gold and green. Shared fields retain their existing green primary focus treatment.

Brand gold accompanies textual draft and private-contact markers. Red accompanies inline errors and confirmed deletion. Dark variants soften separators and use lighter green and gold text. The reviewed dark state is the tablet reader; it does not establish every dark editor state.

## Typography

Inherit Poppins. Workspace and leader-detail headings use the title role; biography, trajectory, contact, video, and media section headings use the section-title role. Directory names use the card-title role. Responsibilities, categories, labels, actions, and feedback use small body text; card draft markers use the metadata role. Reading content uses the existing `prose prose-sm` styling with `dark:prose-invert`.

Long names, responsibilities, category names, contact values, and asset titles can wrap anywhere. Biography and trajectory retain their own rich-text hierarchy. Empty rich-text sections are omitted.

## Layout

The workspace uses panel padding, increasing to panel-wide at the existing small breakpoint (40rem). Directory cards form one column initially, two at the small breakpoint, and three at the extra-large breakpoint (80rem), with the grid-gap spacing. Headers, category tools, contact links, media rows, and action groups wrap. Containers allow shrinking instead of forcing a wider page.

The directory starts with its heading and capability-dependent create action, section settings, and category filter. Category management uses an inline disclosure. The new-profile form opens above the grid. Categories and leaders expose explicit load-more controls when more results exist. Missing setup and empty editor/reader states have distinct guidance.

Detail content follows an optional cover, back link, portrait/name/responsibility/category header, then reading sections bounded by `max-w-prose`. Reading sections use the reading-sections spacing. Optional video, contacts, and editor-only media management follow. The profile form replaces the biography/trajectory reader while editing. Name/responsibility and category/order fields stack on mobile and pair at the small breakpoint; email/phone use the same arrangement.

The surrounding community sidebar is sticky and independently scrollable only at the large breakpoint, with its height bounded to the viewport minus the header offset and bottom safe area. Mobile retains the existing disclosure. The global sidebar was checked for scrolling and was not changed. This shell behavior is shared with the other institutional workspaces.

## Elevation & Depth

Surfaces, fine borders, and separators establish hierarchy without added workspace or card shadows. Shared buttons retain their incumbent layered treatment. Editors, category management, media selection, errors, and removal confirmations stay inline rather than opening elevated panels.

## Shapes

Workspaces, directory cards, and the detail portrait use the workspace radius. Directory portraits are cropped to 4:3; the optional detail cover is cropped to 3:1; the detail portrait is an 88px square. The video wrapper uses the video radius. Inputs use the input radius; shared selects and buttons remain fully rounded. Rich-text reading sections remain unboxed.

## Components

- **Directory cards:** the entire bordered card links to the profile, with visible focus, a decorative portrait or person placeholder, name, optional responsibility, editor-only textual draft marker, and a profile-link label with a 44px minimum height. Active editing prevents card navigation within the workspace.
- **Profile editor:** reuse labeled shared `Input` and `Select` controls and the dynamically loaded `PlanTextEditor`. Name receives initial focus. Biography and trajectory share one selected rich-text editor while both values remain in local state. Numeric ordering and its guidance stay explicit. Publication is a separate checkbox, initially unchecked for new records. Save uses brand green; cancel is outline.
- **Category management:** retain the native disclosure, wrapping category rows, named edit/delete controls, numeric position, and independent publication checkbox. Category forms remain open with entered values after a failed save. Draft categories include a textual marker.
- **Contacts:** email and phone are readable text; the platform profile and social destinations are named links. Social links use labeled navigation and indicate external destinations through their accessible labels. Reuse `AboutSocialFields` for editing. Contact publication is a separate, initially unchecked checkbox; editors see a textual private marker. Readers without a contact record receive no empty contacts section.
- **Media:** separate portrait, cover, and video slots show the selected asset title or an explicit empty/unavailable state. Reuse `LibraryAssetPicker`, restricted to images for portrait/cover and video for the video slot, plus `LibraryUnlinkControl`. Selection links existing library assets; this surface introduces no separate upload path. Images use the existing Cloudflare URL helper and video uses `StreamVideo`. Captured picker errors do not certify remote image delivery or video playback.
- **Editing guard and focus:** reuse `PlanInteractionProvider`, the mutation hooks, and return-focus hook so one editor or mutation is active at a time. Competing mutations and directory filtering are disabled; closing restores focus to the initiating control when it remains mounted. This is a local workspace guard, not a general unsaved-navigation guarantee.
- **Feedback and deletion:** errors use `role="alert"`; mutation progress uses `role="status"`. Failed profile/contact saves retain entered fields and rich/social content for retry. Named inline deletion requires confirmation with a red action and an outline cancel action; media unlinking preserves the shared asset. Preview failures are fixture behavior, not production outage tests.
- **Privacy presentation:** capabilities govern management controls; publication and contact visibility have separate explicit UI states. Backend authorization and visibility remain authoritative. Hidden controls and synthetic previews do not certify RLS or authenticated behavior.

## Do's and Don'ts

- **Do** reuse Poppins, YEBAAM brand green, shared controls, and existing editor/library components.
- **Do** preserve compact cards, bounded prose, wrapping actions, visible labels, and clear empty states.
- **Do** retain failed input, textual draft/private markers, independent contact publication, and inline feedback.
- **Do** verify authenticated persistence, uploads, and remote media separately from the visual fixture review.
- **Don't** turn this local directory/detail composition into a global rule for unrelated surfaces.
- **Don't** remove visible focus, semantic headings, accessible link names, or status feedback to reduce density.
- **Don't** present the seven captured states as full feature or PDF-specification completion.
