# Elena Store — Website Progress Tracker

> Design principle: **the webstore is a wall**. Every UI element is a physical object attached to it. Nothing should feel purely digital. Look stays flat / 2D / early-internet — no heavy 3D.

> **MVP goal: a drop-in THEME.** The client installs it on her store and runs everything from the Shopify theme editor. Every piece of content (text, images, links, positions, colors, behaviors) is a `{% schema %}` setting or block; fixed UI strings go through `locales/`; bundled assets are only fallbacks to `image_picker` settings. If the client might ever want to change it, it must not be hardcoded. Check this on every section before calling it done.

---

## How Pages Work in Shopify *(reference)*

```
layout/theme.liquid        ← wraps every page (head, header group, footer group)
 └─ templates/<type>.json  ← chosen by URL; a list of sections + their saved settings
     └─ sections/*.liquid  ← markup + schema = what appears in the editor sidebar
         └─ blocks         ← repeatable pieces inside a section
```

| URL | Template | Content comes from |
|---|---|---|
| `/` | `index.json` | section settings |
| `/products/x` | `product.json` | product admin + section settings |
| `/collections/x` | `collection.json` | collection admin + section settings |
| `/collections` | `list-collections.json` | all collections |
| `/pages/x` | `page.json` or `page.<suffix>.json` | page admin + section settings |
| `/cart`, `/search`, `/blogs/…` | `cart.json`, … | Shopify data |

- **Alternate templates** (e.g. `page.events.json`, `collection.rack.json`): the client assigns them per page/collection in the admin. New pages like About or Contact need no code.
- **Theme-wide settings** live in `config/settings_schema.json`.
- ⚠️ Once the client edits in the editor, the live store's `templates/*.json` are the real ones. **Always `shopify theme pull` before `shopify theme push`**, or her edits get overwritten.

---

## Settled Design Decisions *(reference, not to-do)*

**UI element taxonomy:**
- **Sprayed / painted** — part of the wall: logos, sold-out marks, discount marks.
- **Decorative objects** — look static, add brand value, some react (hanging shoe, lamp that turns on). Editor-placeable decor blocks. *(Replaces framed product images, dropped after client feedback Sept 2026.)*
- **Paper + pin or nail** — notes, cards, labels, info containers. Pin = casual, nail = permanent.
- **Hanging from rope/wire** — has physical weight: cart polaroids, clothing on the rack.
- **Functional furniture** *(new, to validate)* — objects that double as UI: hanging boots as navigation, mannequin as cookie announcer. See "Client ideas".

**Paper containers are built in three pieces** (top edge PNG + CSS middle fill + bottom edge PNG) so they scale with content. Never one fixed PNG.

**Color palette:** ink black (text, icons), dark bloody red (accents, sold-out), browns/beiges/reds/dark greens. Background drives the tone.

**Typography (three voices):** script cursive (product names), typewriter (descriptions, body, prices), sharpie/handwritten (accents, stamps).

**Drop shadows:** all hanging elements have one; hover deepens it. Define 2–3 levels as CSS variables.

**Rules from client/owner feedback:**
- One site-wide background; sections never paint their own wall/floor.
- No price tags hanging on garments; product info shown outside the garment (plain text readout).
- Visual effects (e.g. header glow vs. shadow) are editor selects, not hardcoded.

---

## Status

**Built, uncommitted — commit soon** (only the v1.0.0 commit exists):
- `catalogue-rows` section — horizontal category rows (scroll-snap, "see all" card)
- `clothing-rack` section + `clothing-rack-garment` snippet + `collection.rack.json` — first working version, flat 2D, swing/sway; needs realism + real assets
- `header` — reworked with editor settings (glow/shadow select etc.)
- locale strings for catalogue + rack; `collection-wall` frame paths fixed

---

## MVP Roadmap

### 1. Foundation (theme-wide)
- [ ] **Global background** — Theme settings → Background (image picker + color), rendered once in `theme.liquid`; remove the per-section overrides (`productback.png`, `wallback.png`, `floorproducts.png`). ⏳ final image from client
- [ ] **Theme color settings** wired to the real palette (currently hardcoded across sections)
- [ ] **Shadow system** — 2–3 levels as CSS variables
- [ ] **Fonts** — load the three typefaces, define usage in CSS variables
- [ ] **Decor block** `blocks/decor.liquid` — off image, optional "on" image, x/y %, width, layer, animation (none / sway / flicker / toggle on click), optional link. Shoe = first instance. ⏳ lamp assets from client
- [ ] **Retire** `collection-wall` + `frame1–4.png` after checking every reference
- [ ] **Header** — finish: logo + cart icon pickers, optional menu; hide-on-homepage controlled from the editor, not `page_type` in `theme.liquid`

### 2. Home
- [ ] `home-hero`: logo / curtains / rat / shoe picked by filename → image pickers or decor blocks
- [ ] Replace paper-tape buttons with the paper+pin button component (single CTA → catalogue)
- [ ] Logo position/size at all viewports; mobile layout

### 3. Hero + catalogue (collection pages)
- [ ] **Clothing rack hero** — client wants this. Make it realistic and robust with proper assets (rail, hangers, garment cut-outs); keep it 2D. Define what garment images the client must supply (transparent PNG, consistent scale)
- [ ] **Decide the full catalogue view:** under the rack hero on the same page, or a separate full page ("see all")? Likely: rack = hero, catalogue-rows or paginated grid below. Decide, then build
- [ ] `catalogue-rows` — finish, confirm categories from product type / automated collections (check client's admin data)
- [ ] Paginated grid for "see all" (`paginate … by 24`), sorting controls (plain typography), hover tilt, sold-out overlay, empty state
- [ ] Mobile pass

### 4. Product page
- [ ] **Image layout option** (editor select): scroll vertically *or* horizontally
- [ ] **Tape:** clear, semi-transparent (not dark) — editor control for opacity
- [ ] **Stamp-style buttons:** "Add to cart" and "Sold out" become stamps (ink-stamp look, sold-out = different stamp; disabled state)
- [ ] Product name on receipt-strip paper, description on A4 paper, "one of a kind" mark
- [ ] Back-to-catalogue navigation (see breadcrumbs idea)
- [ ] Mobile layout

### 5. Cart
- [ ] Rope across full width, polaroid items hanging by clips, horizontal scroll on overflow
- [ ] Subtotal + checkout on paper, remove interaction, empty state, mobile

### 6. New pages & global furniture
- [ ] **Footer** section — navigation menu, newsletter signup, social/contact, all editable (footer group in `theme.liquid`)
- [ ] **"Who are we" / About page** — `page.about.json` with flexible sections (text on paper, images, decor blocks)
- [ ] Cookie banner (see mannequin idea)

### 7. Launch checklist
- [ ] `en.default.json` / schema locales: no hardcoded strings (`page-events`, "Sold Out", etc.)
- [ ] WebP conversion + lazy loading; mobile pass on every page
- [ ] `theme-check` clean; test install on a fresh store with default content
- [ ] Short client guide: how to edit each section

---

## Client Ideas — to try, implement if they work *(experiments, not committed scope)*

- **Spotlight effect** — a light cone on the wall. First question: can it be scoped to the hero only (CSS radial-gradient mask following cursor / fixed position), or does it have to be site-wide? Prototype on the rack hero; editor toggle + intensity. Watch performance and mobile (no cursor)
- **Hanging boots as navigation / breadcrumbs** — make "where am I" and "go back" explicit via boots hanging from the top (e.g. one boot per breadcrumb level, linking up the tree). Needs boot assets + a breadcrumb section driven by `request.page_type`/collection/product
- **Mannequin as cookie-banner announcer** — her store's mannequin delivers the consent message (speech bubble / note pinned on it). Must still use Shopify's customer privacy API for real consent; the mannequin is the skin. Needs a mannequin photo cut-out. Generalise: *decor blocks that can carry a function* (links, toggles, announcements)
- Continuous wall navigation (post-MVP): pages as sections of one panorama, horizontal slide transitions (Swup/Barba), cart as slide-in drawer. Unresolved: mobile swipe conflicts
- CRT/cathode-tube video container on product page (post-MVP)
- "Eureka moment" for the product page — revisit once assembled

---

## Assets — client / to produce

**Waiting on client:** final background · lamp (off + on) and other decor objects · garment photos for the rack · mannequin cut-out · boots

**To make:** small sprayed logo · cart icon · pin and nail PNGs · paper variants (small note, receipt strip, A4 sheet, polaroid — each as top/middle/bottom) · rope/wire · clip · sold-out stamp · "add to cart" stamp · clear tape texture (transparent PNG) · spotlight mask (if it needs an image)
