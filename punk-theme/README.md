# Elena Store — Punk Theme

A custom Shopify theme built for Elena Store on top of Shopify's Skeleton theme.

**Design principle: the webstore is a wall.** Every UI element is a physical object attached to it — sprayed/painted (logos, sold-out marks), framed (product images), paper pinned with tape (buttons, descriptions), or hanging (curtains, signs). Nothing should feel purely digital.

## Key pages

| Page | Section | Concept |
|---|---|---|
| Homepage | `sections/home-hero.liquid` | Stage curtains, painted logo, hanging shoe / paper-rat button |
| Collection | `sections/collection-floor.liquid` | Clothes scattered on a floor (default) |
| Collection (alt) | `sections/collection-wall.liquid` | Framed pictures on a wall (swap in `templates/collection.json`) |
| Product | `sections/product.liquid` | Photos taped to the wall, drag-to-scroll, lightbox |
| Cart | `sections/cart.liquid` | Receipt-style list + checkout |

## Structure

Standard Online Store 2.0 layout: `assets/`, `blocks/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/`.

Theme fonts are declared once in `assets/critical.css` (TypewriterCustom, OctinSpraypaint, ProductTitle). CSS follows BEM. All user-facing strings go through `locales/en.default.json`.

> **Do not rename or remove images in `assets/`** without updating their references — the wall design depends on them.

## Development

Requires the [Shopify CLI](https://shopify.dev/docs/api/shopify-cli). Run from this directory:

```bash
shopify theme dev      # local preview against the dev store
shopify theme check    # lint (currently passes clean)
shopify theme push     # upload to the store (use --unpublished/--theme)
shopify theme pull     # download settings/changes made in the admin
```

`config/settings_data.json` is store-specific and git-ignored — pull it from the store, don't commit it.

## License

Based on [Shopify Skeleton Theme](https://github.com/Shopify/skeleton-theme) (MIT — see `LICENSE.md`). Custom artwork in `assets/` is proprietary to Elena Store.
