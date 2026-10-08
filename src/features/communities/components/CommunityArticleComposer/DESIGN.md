---
name: YEBAAM community articles
description: Scoped visual system for the shipped community article list, editor, and reader.
colors:
  primary-50: "rgb(240, 252, 245)"
  primary-800: "rgb(8, 118, 50)"
  primary-900: "rgb(5, 80, 35)"
  secondary-100: "rgb(255, 237, 197)"
  secondary-900: "rgb(180, 75, 3)"
  neutral-50: "rgb(249, 250, 251)"
  neutral-100: "rgb(243, 244, 246)"
  neutral-200: "rgb(229, 231, 235)"
  neutral-300: "rgb(209, 213, 219)"
  neutral-600: "rgb(75, 85, 99)"
  neutral-900: "rgb(17, 24, 39)"
  white: "#ffffff"
typography:
  workspace-title:
    fontFamily: Poppins
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 2rem
  reader-title:
    fontFamily: Poppins
    fontSize: 1.875rem
    fontWeight: 600
    lineHeight: 1.25
  card-title:
    fontFamily: Poppins
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.375
  body:
    fontFamily: Poppins
    fontSize: 0.875rem
    lineHeight: 1.25rem
  metadata:
    fontFamily: Poppins
    fontSize: 0.75rem
    lineHeight: 1rem
rounded:
  control: 0.5rem
  card: 0.75rem
  field: 1rem
  pill: 9999px
spacing:
  control-gap: 0.5rem
  card-gap: 1rem
  section-gap: 1.5rem
  reader-gap: 1.75rem
components:
  create-action:
    backgroundColor: "{colors.primary-800}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "0 1rem"
  publish-action:
    backgroundColor: "{colors.primary-800}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
  article-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.card}"
    padding: "1rem"
  draft-status:
    backgroundColor: "{colors.secondary-100}"
    textColor: "{colors.secondary-900}"
    rounded: "{rounded.pill}"
    typography: "{typography.metadata}"
---

# Design System: Community article list, editor, and reader

## Overview

This scoped record covers the article list, editor, and reader even though it lives beside the composer implementation. The shipped surface uses YEBAAM's Poppins, green actions, restrained gold private state, white content surfaces, and compact responsive spacing. It inherits the community shell; it introduces no separate visual identity.

The final light-theme localhost captures show the list, blank editor, and populated reader at 1440 × 1000 and 390 × 800. The finish reviewer disposition was **ship** after four fixes. [Desktop list](../../../../../.impeccable/review/articles/desktop-list.png), [editor](../../../../../.impeccable/review/articles/desktop-form.png), [reader](../../../../../.impeccable/review/articles/desktop-detail.png), [mobile list](../../../../../.impeccable/review/articles/mobile-list.png), [editor](../../../../../.impeccable/review/articles/mobile-form.png), and [reader](../../../../../.impeccable/review/articles/mobile-detail.png) are the visual evidence. The library picker had no eligible media in QA, so these captures do not verify inserted media or video playback.

## Colors

Primary green identifies create, publish, navigation, search submission, share, and published state. Gold is reserved for private draft status and tags. White article cards and controls sit on the neutral page; muted neutral copy and thin borders separate fields, bylines, and actions. Dark variants are present in source but are outside the captured visual review.

**The Textual State Rule.** Published and private draft states keep explicit words; color only reinforces them.

## Typography

Poppins is inherited from the app root. List and editor headings use the workspace title role. The reader title uses the larger reader role and grows to 2.25rem at the small breakpoint. Card titles are semibold and limited to two lines. Supporting copy and form labels stay compact; author, date, reading time, category, and tag text use smaller metadata. The reader limits the title to 25 characters per line and prose to about 70 characters per line.

## Layout

Article routes replace the large profile cover with a narrow community breadcrumb. Desktop retains the 240px community sidebar within the 72rem shell; mobile hides that sidebar and starts with the article controls or content. List tabs remain above the page heading. The list search and category fields wrap, and the card grid uses one, two, or three columns at container widths below 520px, from 520px, and from 860px.

The editor and reader each use a centered 56rem maximum width. Editor actions wrap beside or below the title; fields stack on mobile, while category and tags become two columns from 640px. The cover placeholder and image frame reserve space before the rich editor. Reader metadata and actions wrap; the return link precedes the status, title, byline, share controls, cover, body, attachments, and tags.

## Elevation & Depth

These article surfaces are flat. White fields and cards, pale media placeholders, fine neutral borders, and spacing provide separation. Cards shift border color on hover; cover images scale slightly on hover. No article-specific shadow or floating layer defines the composition.

## Shapes

Article cards, cover frames, and rich editor use gently rounded 0.75rem corners. Search, category, summary, and list actions use 0.5rem corners; shared single-line editor inputs use the inherited 1rem radius. Shared editor buttons and status chips are pill-shaped. Images clip to their frame; list covers use a 16:10 crop and reader covers use 16:8.

## Components

- **List and card:** Search and category are labeled fields with an explicit Apply button. Each card is a full link with cover or placeholder, optional tags/category/private marker, title, optional subtitle, and author/date/read-time footer. Filtered and initial empty states have different copy; further pages expose a visible “Ver más artículos” link.
- **Editor:** Cancel, private draft save, and publish are separate actions. The title starts focused. Labeled title, subtitle, summary, category, and tags lead into cover selection, rich content, and document attachments. Pending actions disable repeat submissions and a local alert preserves failure feedback.
- **Library media:** The cover, body, and attachments select existing community-library assets. The body toolbar uses 44px square controls, a visible pressed state, and an editable prose region. Picker closure returns focus to its opener. The empty QA library prevented visual confirmation of selected or playing media.
- **Reader:** A back link and textual publication state lead a restrained editorial hierarchy. Author, date, and reading time sit beneath the introduction. Share and management controls follow a divider; the cover and prose remain the reading focus. Missing library media or attachments produce text feedback.
- **Focus and dark variants:** Interactive controls retain visible keyboard outlines. The source defines dark neutral surfaces and lighter green text, but no dark-mode capture is included in this review.

## Do's and Don'ts

- **Do** keep the article list, editor, and reader in the compact YEBAAM community shell.
- **Do** keep private draft and published state explicit, with green actions and restrained gold private markers.
- **Do** let actions, filters, metadata, and fields wrap naturally at narrow widths.
- **Don't** let a profile hero displace the article task on article routes.
- **Don't** claim selected media or playback was visually verified by the six first-view captures.
