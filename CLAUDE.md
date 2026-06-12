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
- All user-facing strings via `{{ 'translation.key' | t }}`
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

## MCP
Shopify publishes an official MCP server (`@shopify/dev-mcp`) that gives Claude access to Shopify Polaris docs, component references, and API documentation.

Register it once via the CLI (user-scoped, available in all projects):
```
claude mcp add shopify -- npx -y @shopify/dev-mcp@latest
```
