# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Community owners and delegated editors create and maintain community content. Members and visitors read what their permissions allow.

## Product Purpose

YEBAAM is a social app for people and communities. The community profile brings institutional information, posts, articles, media, events, questions, and member activity into one navigable space.

## Operating Context

The authenticated Next.js app uses Supabase for identities, permissions, and relational data. Community content appears in desktop and mobile browser layouts. The user reviews changes in the running app at `http://localhost:3000`.

## Capabilities and Constraints

- Community data is private by default and enforced through Supabase authorization, not only hidden UI.
- Images and videos use Cloudflare media identifiers; documents use Cloudflare R2 keys. Article media comes from the community library.
- Article editors can save private drafts and publish when ready; reading and management depend on community permissions.
- Incomplete navigation destinations are labeled `Pronto` or `Próximamente`.

## Brand Commitments

The user requires the existing YEBAAM visual identity: its green and gold palette, Poppins typography, compact minimalist presentation, and responsive behavior. New community surfaces should remain recognizably part of that system.

## Evidence on Hand

- The supplied [community profile specification](perfil-de-comunidades.pdf) defines the requested feature scope.
- [Community profile architecture](docs/architecture/community-profile.md) tracks implementation and validation status.
- Existing community routes and components provide the current visual and interaction system.

## Product Principles

- Show only content each audience is authorized to see.
- Keep community publishing and reading clear on small screens.
- Reuse the community library for media instead of creating separate upload paths.
