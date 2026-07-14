# YEBAAM — Enforcement Gaps (compliance roadmap)

> **Status: ROADMAP — analysis only. Nothing here is implemented by this change.**
> This document lists where the **code does not yet satisfy** the binding governance rules in
> `docs/legal/` (Contrato de Usuario, Manual de Convivencia, Macro Reglamento). It is the backlog the
> three governance subagents (`.claude/agents/*`) should consult and drive over time. Article/clause
> references point at the source-of-truth markdown so each gap is traceable.
>
> Findings are based on a codebase map (June 2026): no legal/normativa routes, no signup consent
> control, no account-deletion flow, partial moderation in `src/features/admin/**`. Re-verify before
> building, since the code moves.

Priority key: **P0** = legal exposure / explicitly mandated & absent · **P1** = consumer-law / per-feature
mandate, partially present · **P2** = hardening, audit, or operational/legal task.

## P0 — Mandated and currently absent

| Gap | Rule | Current state | Proposed work |
|---|---|---|---|
| **Clickwrap consent at signup** | Contrato cl.2 · Manual Art.24 · Macro Art.42 | `src/features/auth/components/register-form/index.tsx` has **no terms/privacy acceptance control** and stores no acceptance record | Add an **unchecked** consent control linking the Contrato + privacy policy; block submit until checked; persist an acceptance record (`user_id`, `document_version`, `accepted_at`, `ip`) in a new `user_agreements` table. This is the evidentiary / *mérito ejecutivo* trail the documents require. |
| **`/normativa` legal pages** | Manual preamble ("alojado en la sección normativa de la plataforma") · Macro Art.45 | **No legal routes** exist in `src/app/**` | Public route group (e.g. `/normativa`) rendering `docs/legal/*` (contrato, manual, macro, privacidad), linkable from signup + footer. |
| **Derecho al olvido / account deletion** | Macro Art.5 · Manual Art.20 · Contrato cl.24 | **No account-deletion / data-purge flow**; no Habeas Data / DPO channel | Build account deletion that irreversibly purges registration data, metadata, and usage records **within 10 business days**; expose an ARCO/Habeas Data request channel. |

## P1 — Per-feature / consumer-law mandates, partially present

| Gap | Rule | Current state | Proposed work |
|---|---|---|---|
| **Outbound food interstitial (Pop-up Intersticial)** | Manual Art.16 · Macro Art.25 | `src/features/comidas/**` / `(comidas)` links out to WhatsApp Business with **no interstitial warning** | Mandatory interstitial confirming exit of the controlled environment before any outbound/third-party redirect. |
| **`#Publicidad` / `#Patrocinio` markers** | Manual Art.5 · Macro Art.6 · Contrato cl.18 | Feed posts have **no sponsored flag/marker** (`src/lib/api/posts.ts`, `src/app/(app)/feed/`) | Add a `sponsored`/`is_ad` flag on posts, a visible `#Publicidad` affordance, and creation-time enforcement for commercial content. |
| **Marketplace mandatory disclosures** | Manual Art.13 · Macro Art.29 | Business storefronts (`src/features/comidas/actions/business*.actions.ts`, `src/features/businesses/**`) may not capture/display **NIT, razón social, dirección física, precios con IVA/Impoconsumo** | Make these required fields and render them on every storefront (Ley 1480 Art.50, SIC). |
| **Report → progressive-sanction engine + audit log** | Manual Art.17–19 · Macro Art.9–12 · Contrato cl.15–17 | Moderation is partial (`src/features/admin/**`, `communities/actions/moderation.actions.ts`); **no unified reporting, no sanction ladder**. Private chat now has `message_reports` (participant reports, RLS-gated) + append-only `compliance_access_log` and an audited admin decrypt endpoint (`/api/admin/compliance/chat-decrypt`), but no admin review UI or sanction pipeline consumes them yet | Reporting table + sanction state machine (`Advertencia → Limitación → Suspensión → Cancelación → Bloqueo`) with due process (48h descargos, 5-day resolution) and an **immutable timestamped audit log**. Encode the automatic triggers: chat **3 reports → ipso-facto block** & **72h doxing freeze** (Art.15), **24h takedown SLA** (Art.9/Macro Art.8), **12h judicial-cooperation** compile (Macro Art.12). |

## P2 — Hardening, audit, and operational tasks

| Gap | Rule | Current state | Proposed work |
|---|---|---|---|
| **Privacy-by-default audit** | Macro Art.2 · Manual Art.7/Art.10 | Need to confirm DB defaults/RLS for friend lists & *familias* are **hidden by default** and that **no exact GPS** is exposed | Audit column defaults + RLS across profile/cities; ensure city geo shows only the municipal node, never lat/long. |
| **AI / synthetic-content label** | Manual Art.9 · Contrato cl.14 | No AI-content declaration on blogs/posts | Add an `is_ai_generated` flag with a visible label on blogs and posts. |
| **Minors protection (Familias)** | Manual Art.10 · Macro Art.35 · COPPA | `src/features/families/**` allows declaring relationships; verify it **cannot index/tag <18** without verifiable parental consent | Add a verifiable parental-consent gate before linking minors. |
| **Anti-scraping hardening** | Manual Art.6/Art.17 · Macro Art.17/Art.34 | Verify connection-list endpoints are rate-limited and lists hidden by default (`friendships` services) | Hide connection lists by default; rate-limit list/enumeration endpoints. |
| **No native media upload (audit)** | Manual Art.8/Art.10 · Macro Art.6/Art.21/Art.38 | Repo already enforces Cloudflare-only via `uploadService`; clubs/music must be **embed-only** (YouTube/Spotify/SoundCloud) | Confirm clubs/music-archive never accept native `.mp3`/`.wav`/video uploads; embeds only. |
| **AES-256 / encryption posture + RNBD registration** | Macro Art.8 | **Private chat closed (2026-07-05):** member-to-member messages (direct + salitas) are AES-256-GCM ciphertext at rest (`src/lib/server/chat-crypto.ts`), key env-only (never in DB), decrypt gated to participant-authenticated routes + two audited triggers (Art.12 judicial / participant report) logged in append-only `compliance_access_log`. Other personal data relies on Supabase disk encryption; RNBD registration with the SIC is an external legal task | Confirm encryption posture for remaining personal/professional data; register the databases with the SIC's Registro Nacional de Bases de Datos (operational/legal). |
| **Private-chat normative gap + media encryption** | Macro Art.3 (chat surface definition) · Art.8 | Per the 2026-07-05 governance audit: private DMs/salitas are **not an atomically regulated component** of the corpus (only "Salas Interactivas de Chat Público" have a chapter) — the general regime governs them. Message **text** is now encrypted; chat **media** (Cloudflare Images/Stream) still resolves via unauthenticated delivery URLs, and the Contrato/onboarding copy does not yet disclose the encryption + lawful-access scheme (Macro Art.42/45; Contrato cl.26/30) | Add a private-chat article to the corpus; converge chat images/video on membership-gated signed URLs (voice notes already do this via R2 1-h signed URLs); hand the disclosure wording to the `contrato-usuario` agent. |
| **Badge grant/revoke lifecycle notifications (debido proceso)** | Macro Art.11 · Manual Art.18 · Contrato cl.16 | Per the 2026-07-05 badge audit (doctorado incident): `revokeBadge`/`approveBadgeRequest`/`rejectBadgeRequest` (`src/features/admin/actions/badges/*`) write only an admin-visible audit row — the affected user is never notified, gets no 48h descargos window, and the request form's success copy *promises* a decision notification that is never sent. `decision_reason` is optional on rejections | Emit a `notifications` row (+ email where mandated) on grant, rejection, and revocation with the motivated reason; make `decision_reason` mandatory on reject/revoke of credential badges; wire the 48h descargos flow into the future sanction engine (see P1 report→sanction row). |
| **Badge evidence documents — retention & minors** | Macro Art.5/Art.35 · Manual Art.10.4/Art.20 · Contrato cl.9/cl.23–24 | `badge_requests.supporting_cf_image_ids` (now mandatory for `badges.evidence_required`, e.g. study credentials) are retained in Cloudflare Images indefinitely — rejected/withdrawn requests keep their documents, no account-deletion purge (P0 derecho-al-olvido row). **Minors partially addressed 2026-07-05:** `requestBadge()` (`src/features/badges/actions/requests.actions.ts`) now blocks evidence-required requests unless `profiles.birth_date` proves the requester is 18+ (`isAtLeast18()` in `src/lib/age.ts`; unknown/missing birth date is treated as under-18, gated closed) — this is a hard block, not the "verifiable parental consent" pathway cl.9 actually describes, so a minor still cannot get a legitimate credential badge even with real parental sign-off | Purge supporting docs on reject/withdraw after a fixed evidence-retention window; include them in the future account-deletion purge; replace the current 18+ hard block with a real verifiable-parental-consent flow per Contrato cl.9 if minors need a path to credential badges. |

## Escuelas module — gaps found during QA Audit 2026-07-12

| Gap | Rule | Current state | Proposed work |
|---|---|---|---|
| **`get_escuelas_stats` — sin check de pertenencia** | Macro Art.2 (Privacy by Design/Default) | Cualquier usuario autenticado puede consultar los conteos de leads, clases de prueba y seguidores de cualquier escuela vía el RPC `get_escuelas_stats`. Hoy solo expone números agregados no PII. Riesgo bajo mientras el RPC no incluya métricas de negocio sensibles. | Agregar `escuelas.assert_school_admin(p_school_id)` al inicio del RPC cuando los stats incluyan ingresos, tasas de conversión, o datos sensibles del negocio. Origen: Hallazgo E, QA Audit 2026-07-12. |
| **UI de edición pendiente** (deuda técnica, no normativa) | — | Las acciones `updateInstructor`, `updateCampus` y `updateProgram` están implementadas y testeadas en tipado pero sin call site en la UI. Ver TODO.md. | Implementar formularios de edición inline para instructores, sedes y programas. |

## How to use this file
- The governance subagents reference this file when a rule needs enforcement that the code lacks.
- When you close a gap, update the row (or delete it) and link the implementing commit/migration.
- New gaps discovered while building should be appended here with their article/clause reference.
