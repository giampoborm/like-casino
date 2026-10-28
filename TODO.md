# Elena Store — Website Progress Tracker

> Design principle: **the webstore is a wall**. Every UI element is a physical object attached to it. Nothing should feel purely digital. Look stays flat / 2D / early-internet — no heavy 3D.

> **MVP goal: a drop-in THEME.** The client installs it on her store and runs everything from the Shopify theme editor. Every piece of content (text, images, links, positions, colors, behaviors) is a `{% schema %}` setting or block; bundled assets are only fallbacks to `image_picker` settings. If the client might ever want to change it, it must not be hardcoded. Check this on every section before calling it done.

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

**Color palette:** three editable roles. **Positive** (faded vintage ink black, text on light backgrounds), **Negative** (ivory, text on dark backgrounds), **Accent** (dried blood red: sold-out, discount marks). The Text theme setting picks which of Positive/Negative is the text colour. Background drives the tone.

**Typography (two roles):** Main font (`cella`, everything) and Stamp font (`octin-spraypaint`, sold-out marks and decoration). Both swappable in Branding.

**Drop shadows:** hanging elements usually have one and hover deepens it, but it is decided per instance via schema settings (see Step 1), not by a global scale.

**Rules from client/owner feedback:**
- One site-wide background; sections never paint their own wall/floor.
- No price tags hanging on garments; product info shown outside the garment (plain text readout).
- Visual effects (e.g. header glow vs. shadow) are editor selects, not hardcoded.

---

## Status

**Built and committed (1a0d96f, product gallery view after), not yet deployed — header and rack deploy together; waiting to finish the rack first.** Scratch/test images go in `working-assets/` (outside the theme, never pushed):
- `catalogue-rows` section — horizontal category rows (scroll-snap, "see all" card)
- `clothing-rack` section + `clothing-rack-garment` snippet + `collection.rack.json` — first working version, flat 2D, swing/sway; needs realism + real assets
- `header` — reworked with editor settings (glow/shadow select etc.)
- locale strings for catalogue + rack; `collection-wall` frame paths fixed

---

## MVP Roadmap

> Work order agreed Oct 2026. Estimates are focused working sessions (~a few hours each); total ≈ 9–13 sessions for steps 1–8, plus ~2 for the cart and ~1–2 for launch. Biggest schedule risk: client assets (lamps, boots, bust, garment PNGs). Steps 1, 3 and 6 need no client assets, so start there.

### 1. Foundation (theme-wide) — 1–2 sessions
- [x] **Global background** — Theme settings → Site background (preset select incl. `wallbackground`/`wallbackground2`, custom image picker, color, fit/zoom/position/overlay/repeat/attachment), applied once on `body` via `css-variables.liquid`; per-section overrides removed. The final preset is the client's choice in the editor; the "Sfondo prova" test options can go before launch
- [x] **Theme color settings** — Theme settings → Branding: Positive (faded ink black `#2a2622`), Negative (ivory `#efe6d2`), Accent (dried blood red `#7a1f1a`), exposed as `--color-positive/negative/accent`. Hardcoded text/accent colours in the product, collection (floor, wall, rack, catalogue rows), cart, events and home-hero text now use them. Remaining hardcoded colours are neutral shadows, button bevel greys, placeholders and the rack paper (`--rack-paper`)
- [x] **Branding control** — colours, fonts, text effect and logo all in Theme settings → Branding
- [x] **Text colour per background** — solved with a **Text theme** select (Positive = dark ink for light backgrounds, Negative = ivory for dark ones) that sets `--color-text` / `--color-text-inverse`; no per-background pairing
- [x] **Text effect** — Branding → Effect on text: none / ink bleed (strength slider) / dark shadow (default). One variable, `--text-effect`, read by every text-shadow on product names, prices and labels
- [x] **Shadows: per-instance schema settings** — done Oct 2026 for header, collection wall, collection floor, catalogue rows, rack (garment / hanger / hook) and home hero (logo / button / shoe glow); each is a 0–100% slider, hardcoded values removed. Still to do: decor blocks (step 2), and the product page / cart if they get shadows
- [x] **Schema text style** — keep `info` texts to a few words (e.g. "Empty = default") or none
- [x] **Fonts** — **two roles**, decided Oct 2026: **Main** (`cella`, used for everything: item names, body, prices, cart) and **Stamp** (`octin-spraypaint`, stencil, for sold-out marks and decoration). Declared once in `critical.css` as `MainFont` / `StampFont`; exposed as `--font-main--family` / `--font-stamp--family`; each can be swapped in the editor (bundled checkbox + font picker). The typewriter and any other unused fonts were removed
- [x] **Header** — done as is (Oct 2026): accepted by the user without further changes

### 2. Decor block — 1 session
- [ ] `blocks/decor.liquid` — off image, optional "on" image, x/y %, width, layer, animation (none / sway / flicker / toggle on click), optional link. Shoe = first instance. ⏳ lamp assets from client
- [ ] **Decor placement list** — decide which object goes where: bust → cookie announcer, lamps/lights → (pages TBD), boots → navigation/breadcrumbs, shoe → home. Record it here

### 3. Home — 0.5–1 session
- [x] `home-hero` shadows: logo, button and shoe hover glow are schema sliders (Oct 2026); dead code removed
- [ ] `home-hero`: logo / curtains / rat / shoe picked by filename → image pickers or decor blocks. **Curtains fully editable via schema**
- [ ] **Fourth logo option** *(meaning to confirm with user: fourth logo variant vs. fourth hero element)*
- [ ] Replace paper-tape buttons with the paper+pin button component (single CTA → catalogue)
- [ ] Logo position/size at all viewports; mobile layout

### 4. Collection pages — 2–3 sessions
- [x] **Clothing rack hero** — done: `tube.png` rail, theme-drawn hook (`hook.png`) in front of the pipe with a contact shadow, hanger body, swing, stage height follows the tallest garment. Garments are **hook-less PNGs** in the product metafield `custom.rack_image`; the theme adds the hook
  - **Metafield setup (store admin):** Settings → Metafields definitions → *Products* (not Shop) → "Rack image", `custom.rack_image`, type File (images only), **storefront access on**. Then upload the PNG in the product's Metafields card
  - **Rack image spec for photography/retouching:** transparent PNG, no cast shadow, one camera distance and one hanger model for every product; the **top edge touches the top of the hanger's neck** (crop tight, no empty margin above, no stray pixels) and the neck is centred. Drawn at its pixel size next to the 400 px hanger, so set the section's "Rack image resolution" to the export multiplier (2 = 2× export)
  - **Window collection** *(user)*: make a "Window" collection, pick it in the rack section, and switch **off** "Show products without a rack image" so nothing falls back to a featured photo on the theme hanger
  - Placeholder garments, the `preview_hung` test, the cardboard "see all" sign and the photo image style were removed (Oct 2026). An empty rack is just the rail
  - **Before launch:** slow-connection test (hook/hanger images must not flash as empty boxes) once the skeleton is up
- [ ] **Decide the full catalogue view:** under the rack hero on the same page, or a separate full page ("see all")? Likely: rack = hero, catalogue-rows or paginated grid below. Decide, then build
- [ ] Rack and its product grid as their own sections, so the editor can order/combine them
- [x] **Collection floor schema** — done Oct 2026: columns (desktop/mobile), gap, products per page, sort menu toggle, tilt / offset / row spacing, show names/prices, sold-out text/size/angle/shadow, shadow and hover glow; hardcoded values and dead code removed
- [ ] **Horizontal catalogue row section** (`catalogue-rows`) — section built with schema Oct 2026 (card width, gap, picture ratio, names/prices, row title size, sold-out and "see all" text, shadows); still to do: place it in a template, confirm categories from product type / automated collections (check client's admin data), final visual pass and mobile. Planned as its own step after the product page rework
- [ ] **Other collection sections — retouch and define exactly** *(user, Oct 28 2026)*: decide what each of `collection-floor` / `collection-wall` is for and where it is used, then do a visual pass on each
- [ ] Paginated grid for "see all" (`paginate … by 24`), sorting controls (plain typography), hover tilt, sold-out overlay, empty state
- [x] **`collection-wall` kept** (decided Oct 2026): follows the branding rules like every section, takes each product's **second** image (first is the packshot PNG used on the floor/rack; falls back to the first if it is the only one), and has schema settings for columns, gap, picture shape, products per page, frame choice/thickness/optional frame image pickers, max tilt, straighten on hover and shadow strength. Not yet placed in a template
- [ ] **"Sold Out" text as a schema setting** — done for collection floor and catalogue rows; still to do: collection wall and product page (the product page with its rework)
- [ ] Mobile pass

### 5. Product page — big rework, estimate to revisit (was 2 sessions)

> **Decided Oct 2026:** the current `product` section becomes the **"Product – gallery view"** (taped photo wall), fixed in layout and driven by section schema + four text blocks. A second, freer section (**product basic showcase**, built from blocks) is the alternative non-gallery view.

**Done (Oct 2026), gallery view:**
- [x] **Desktop layout select** — horizontal strip (text below) or vertical (photos stacked beside the text), text on left/right, gallery width 40–70%; mobile layout select kept
- [x] **Gallery schema** — photo size, spacing, scatter, tilt, tape size; all work in horizontal, vertical-desktop and vertical-mobile
- [x] **Text area schema** — width, size, X/Y of the whole non-gallery block
- [x] **Text elements as blocks** — Title, Description, Price, Add to cart button (one each), each with size and X/Y. Elements sit in fixed grid areas, so block order does not move them; removing a block hides it
- [x] **Tape style select** — Black / Masking / Clear (`tape1/2`, `masktape1/2`, `cleartape1/2`), optional image pickers override each pair. Pickers are `visible_if` per style
- [x] **Price colour** follows the theme text colour (opacity removed)
- [x] Rack image exclusion — nothing to do: the rack PNG is a metafield, not in `product.images`; first image already skipped

- [x] **Hanging-boot action style** (Oct 2026) — "Action buttons → Style" select: Buttons / Hanging boots (`snippets/hanging-boot.liquid` + `hanging-boot.css`, back + buy boots, size/lace/sway/shadow/position settings, image pickers). Boot-as-block / reuse in other sections still to decide (see step 7)
- [x] **Mobile overrides + reset** (Oct 2026) — "Customise for mobile" checkbox: mobile photo, text-area and boot values, plus a Mobile group on each text block. "Reset layout to defaults" checkbox ignores every size/spacing/position value (keeps them saved). Values are emitted as scoped CSS variables in a `<style>` block in `product.liquid`

- [x] **Ink stamps + sold out + layout defaults** (Oct 2026, written from code, **not yet checked in a browser**) — Style select has a third value, **Ink stamps** (`assets/stamp.css`, SVG `#stamp-ink` distress filter in `product.liquid`): back and add-to-cart as stamps. **Sold out** is its own "Sold out" group (text, stamp size, tilt): red Accent stamp in all three styles; on boots it is stamped across the boot, with an optional "Sold out boot image" (empty = buy boot greyed). **Lace**: colour + thickness settings, and per-boot lace points (X/Y %) so a new boot PNG with laces emerging from the silhouette can be aligned. **Layout defaults** now live as `--pp-*` tokens at the top of `product-text.css`, one set for desktop and one for ≤640px (what "Reset layout to defaults" returns to)

- [x] **Fixed boots** (Oct 2026) — "Fixed boots" group: each boot has its own checkbox + position as % of the screen. Needs no transformed ancestor, so `.product-text` and `.product-text__actions` are now offset with `left/top` (and margins in the vertical layout) instead of `transform`. Sold-out boot defaults to the bundled `soldoutboot.png` (no stamp on it, it already says SOLD OUT). Back / buy X-Y ranges widened to ±1000 (step 20, the editor allows at most 101 steps)

**To do next time:**
- [ ] **Check the above in a browser** (desktop + phone): stamp look/filter strength, sold-out stamp on the boot, new defaults; then tune the `--pp-*` tokens and the filter
- [ ] **New boot PNG** *(user)*: laces left on the boot, emerging from the silhouette; then set the lace points and lace colour in the editor
- [x] **Defaults from the editor + schema tidy-up** (Oct 28 2026, checked in a browser at 1440 and 390 px) — tuned editor values pulled and made the defaults. Position compensations moved into the CSS layout (`--pp-wall-pad`, `--pp-buy-x/y`, `--pp-back-x/y`), so every offset slider defaults to 0. Boots on phones get their own grid (boot beside title + price, description full width below). Schema: everyday choices on top (Layout, Style), every slider behind one **"Fine-tune → Show settings for"** select that works like tabs (incl. "Phone: …" groups); text blocks have a Desktop/Phone "Screen" select. `templates/product.json` reset to defaults. Same approach still to do for the other sections tuned in the editor
- [ ] **Non-gallery view — "product basic showcase" section** *(potential)*: a simpler product page with more editing power through blocks. Decide if it is needed at all, then scope it
- [ ] **Alternative buttons: boot or stamp** — "Add to cart" and "Sold out" as a stamp (ink-stamp look, sold-out = different stamp, disabled state) **or** a hanging boot. Decide which (or make it an editor select), then build; may reuse the decor block (step 2)
- [ ] **Resize tape PNGs** — masking/clear tape files are 1568–1792 px wide, ~1 MB each; the tape draws at ~60 px, so downscale to ~300 px (the black ones are ~250 px, ~50 KB). Also part of step 8
- [ ] **Tape opacity control** — tape colour/style is done; an opacity slider is not
- [ ] Verify on a phone: the mobile text grid (title / price + button / description) and the vertical-desktop layout were checked in code and CSS only, not in a browser
- [ ] **Variants:** no variant picker yet; the form always sends the first available variant. Needed if any product has sizes/options (confirm with the user)

**Still open from the rework:**
- [ ] **Better layout** — rework the overall composition (product name on receipt-strip paper, description on A4 paper, "one of a kind" mark)
- [ ] **"Sold Out" text as a schema setting** on the product page (and shadows)
- [ ] Back-to-catalogue navigation (see step 7)

### 6. Footer + new pages — 1–2 sessions
- [ ] **Footer** section — navigation menu, newsletter signup, social/contact, all editable (footer group in `theme.liquid`)
- [ ] **"Who are we" / About page** — `page.about.json` with flexible sections (text on paper, images, decor blocks)
- [ ] **Contact page** — `page.contact.json` *(form vs. info-only to confirm)*
- [ ] Cookie banner (see mannequin idea; needs the bust asset and step 2)

### 7. Navigation / breadcrumbs — 1 session
- [ ] Breadcrumb section driven by `request.page_type`/collection/product, with a distinctive look (wall style)
- [ ] Boots hanging from the top as navigation (one boot per level) — needs boot assets; plain-text fallback

### 8. Asset cleanup + optimization — 1 session
- [ ] Audit `assets/` and remove unused files (check every reference first; never rename/remove "wall" assets blindly)
- [ ] WebP conversion + lazy loading
- [ ] Downscale `masktape*.png` / `cleartape*.png` (see step 5)
- [ ] Slow-connection test on every page (no empty-box flashes, sensible placeholders)

### 9. Cart — ~2 sessions
> **Full redo** of the cart page (confirmed Oct 28 2026), not a retouch of the current one.
- [ ] Rope across full width, polaroid items hanging by clips, horizontal scroll on overflow
- [ ] Subtotal + checkout on paper, remove interaction, empty state, mobile

### 10. Details — polish pass *(user wants to spend real time here)*
- [ ] **Add-to-cart animation** — something physical happens when an item is added (e.g. a polaroid flies to / drops onto the cart rope, boot swings, stamp thud). Decide the idea, then build; respect `prefers-reduced-motion`
- [ ] **Boots and similar objects — more work** — more detail and life on the hanging boots and other hanging/decor objects (motion, laces, shadows, reactions), beyond the product-page items in step 5

### 11. Launch checklist — 1–2 sessions
- [ ] **Thorough review of the whole theme** — every page and section, desktop + phone
- [ ] **Right defaults everywhere** — tune each section in the editor, then make those values the schema defaults and reset the templates (as done for the product page, step 5)
- [ ] **Editability check** — every section: all content/colors/links/positions are schema settings (the MVP principle)
- [ ] **Check the leftover hardcoded colours** (decide per item: variable, schema setting, or leave): button bevel greys (`rgb(190,187,175)`/`rgb(145,142,130)` in product-text + cart, `rgb(143)`/`rgb(97)` in collection floor + wall); `--rack-paper: #efe6d2` (the cardboard sign at the end of the rack rail; maybe link to Negative or give it a setting); placeholder garment colours/strokes in `clothing-rack-garment.liquid`; placeholder fills (`#ddd9cc` in cart, catalogue and floor placeholders); lightbox overlay/controls in `product-wall.css`; header glow filters and black glow default
- [ ] Mobile pass on every page
- [ ] `theme-check` clean; test install on a fresh store with default content
- [ ] Short client guide: how to edit each section (include the rack: Window collection + `custom.rack_image` metafield and the rack image spec above)
- [ ] **Ship** — `shopify theme pull`, then push and publish on the client's store

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

**Waiting on client:** lamp (off + on) and other decor objects · hook-less garment PNGs for the rack (see the spec under the rack hero) · mannequin cut-out · boots

**To make:** small sprayed logo · cart icon · pin and nail PNGs · paper variants (small note, receipt strip, A4 sheet, polaroid — each as top/middle/bottom) · rope/wire · clip · sold-out stamp · "add to cart" stamp · clear tape texture (transparent PNG) · spotlight mask (if it needs an image)
