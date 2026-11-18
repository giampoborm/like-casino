# Elena Store — Shopify Theme

## Goal
Custom Shopify Liquid theme for Elena Store, built on a Skeleton Theme base with a distinctive "wall" visual metaphor.

## Stack
- Base theme: Shopify Skeleton (customized)
- Templating: Liquid
- CSS: Vanilla CSS with CSS variables and BEM conventions
- JS: Vanilla JS (no build tooling)
- CLI: Shopify Theme CLI

## Folder Structure

**All theme code lives in `punk-theme/`.** The repo root (`elena-store/`) contains only project-level files (screenshots, notes, etc.) — do not look for or edit theme files there.

```
elena-store/
└── punk-theme/           ← THE THEME ROOT — start here for all work
    ├── assets/           ← CSS, images, fonts, SVG icons, static files
    ├── blocks/           ← Reusable nested UI components (group, text)
    ├── config/           ← settings_schema.json, settings_data.json
    ├── layout/           ← theme.liquid, password.liquid
    ├── locales/          ← Translation files (en.default.json)
    ├── sections/         ← Editable Liquid sections (header, footer, product, cart, etc.)
    ├── snippets/         ← Reusable Liquid partials (css-variables, image, meta-tags)
    └── templates/        ← JSON page templates (product.json, collection.json, etc.)
```

## Commands
Run all CLI commands from within `punk-theme/`:
- Dev: `shopify theme dev`
- Push: `shopify theme push`
- Pull: `shopify theme pull`
- Check: `theme-check`

## Conventions
- BEM naming for all CSS classes
- CSS custom properties (variables) defined in `snippets/css-variables.liquid`
- Use `{{ 'file.css' | asset_url | stylesheet_tag }}` — never hardcode asset URLs
- Use `{% render 'snippet' %}` not `{% include %}` (deprecated)
- Pass variables to snippets explicitly: `{% render 'snippet', var: var %}`
- Paginate all collection loops: `{% paginate collection.products by 24 %}`
- Schema settings in `{% schema %}` blocks, not hardcoded in HTML
- Section schema `"type"` values must be unique within that section

## Known Gotchas
- `settings_data.json` is store-specific — do not commit it
- `{% render %}` cannot access parent scope variables — pass them explicitly
- Metafields require Online Store 2.0 theme format
- The "wall" design uses custom visual assets in `assets/` — do not rename or remove them without updating all references
- `blocks/` components are nested inside sections, not standalone

## Deploying (pushing to a store)
When the user says "push it" / "make it live", push the **whole committed theme** — never a hand-picked `--only <files>` list. Partial pushes broke the live homepage on 2026-11-17: a new section went live without the snippet it rendered (added in an earlier, never-pushed commit).

1. Working tree must be clean (commit first). Run `shopify theme check` from `punk-theme/` — stop on errors.
2. See what's not live yet: `git diff live --stat` (the `live` tag marks the last pushed commit). Mention it to the user.
3. Push from `punk-theme/`:
   - **Test store** (`laic-a-casino-prova`, live theme `casino-style` #194813133144 — editor settings there are throwaway): `shopify theme push -t 194813133144 --allow-live`
   - **Client store** (later): add `--ignore config/settings_data.json --ignore "templates/*.json" --ignore "sections/*-group.json"` so the client's editor changes survive; push those JSON files only when the user asks.
4. After a successful push: `git tag -f live` (and `git push -f origin live` if a remote exists).

## MCP
Shopify publishes an official MCP server (`@shopify/dev-mcp`) that gives Claude access to Shopify Polaris docs, component references, and API documentation.

Register it once via the CLI (user-scoped, available in all projects):
```
claude mcp add shopify -- npx -y @shopify/dev-mcp@latest
```
