# Design System from URL — Design Spec

**Date:** 2026-04-04  
**Status:** Approved

## Goal

Add a URL tab to the Design System upload modal so users can paste a public page URL instead of uploading a ZIP. The server fetches the real HTML+CSS and sends it to Claude for analysis — producing accurate design tokens (real colors, real fonts, real spacing) instead of invented ones.

## Architecture

### New helper: `buildAnalysisHtmlFromUrl(url)`
Lives in `lib/ds-resolver.ts` alongside the existing `buildAnalysisHtml`.

Steps:
1. `fetch(url)` with browser-like headers (`User-Agent`, `Accept`)
2. Parse response HTML
3. Find all `<link rel="stylesheet" href="...">` → fetch each CSS file, embed as `<style>` block
4. Keep existing inline `<style>` blocks unchanged
5. Remove `<script src="...">` external tags (not needed for design analysis)
6. Keep Google Fonts / Adobe Fonts `<link>` tags (Claude sees font names)
7. Cap at 200k chars (same as ZIP flow)

### New API route: `POST /api/design-systems/from-url`
Request body: `{ nome: string, url: string }`

1. Validate: `nome` non-empty, `url` starts with `http://` or `https://`
2. Insert `design_systems` row with `status: 'pending'`
3. Return `202 { id, status: 'processing' }` immediately
4. `after()` runs `runExtractionFromUrl(id, url)` in background:
   - Calls `buildAnalysisHtmlFromUrl(url)`
   - Calls Claude (same streaming pattern as extract route)
   - Updates DB to `status: 'done'` with `ds_html`
   - On any error: updates DB to `status: 'error'`

### Modal changes: `components/design-systems/ds-upload-modal.tsx`
- Add two tabs at top of form step: **URL** | **ZIP**
- `activeTab: 'url' | 'zip'` state
- URL tab: `nome` field + `url` field
- ZIP tab: existing form (unchanged)
- URL submit: `POST /api/design-systems/from-url` → 202 → switch to `'processing'` step
- ZIP submit: unchanged (init → PUT → extract → processing)
- Both paths converge at the existing polling step

## Error Handling

| Error | Behavior |
|-------|----------|
| Invalid URL (no http/https) | Client-side validation, no server call |
| Server returns 4xx/5xx | DB updated to `error`, modal shows message |
| Site blocks bots (403/Cloudflare) | Error message: "Site bloqueou o acesso — tente o ZIP" |
| Fetch timeout (>30s) | Error written to DB |
| No CSS found | Claude still receives HTML, produces best-effort result |

## Files

| Action | Path |
|--------|------|
| Modify | `lib/ds-resolver.ts` — add `buildAnalysisHtmlFromUrl` |
| Create | `app/api/design-systems/from-url/route.ts` |
| Modify | `components/design-systems/ds-upload-modal.tsx` — add URL tab |
| Create | `__tests__/lib/ds-resolver-url.test.ts` |
| Create | `__tests__/api/design-systems-from-url.test.ts` |

## Out of Scope
- Playwright/headless browser rendering
- Auth-protected pages
- Rate limiting / bot detection bypass
