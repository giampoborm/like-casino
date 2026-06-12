# Elena Store — Website Progress Tracker

> Design principle: **the webstore is a wall**. Every UI element is a physical object attached to it. Nothing should feel purely digital.

---

## Settled Design Decisions *(reference, not to-do)*

**UI element taxonomy — four types, everything maps to one of these:**
- **Sprayed / painted** — part of the wall itself. Used for: logos, sold-out overlays, discount marks.
- **Framed** — precious, displayed. Used for: product images in catalog and product page.
- **Paper + pin or nail** — pinned note or card. Used for: buttons, product descriptions, labels, info containers. Pin = casual/added-later. Nail = heavier/more permanent. Both are valid, use contextually.
- **Hanging from rope/wire** — has physical weight. Used for: cart items (polaroids on a wire).

**Paper containers are built in three pieces** (top edge PNG + CSS middle fill + bottom edge PNG) so they scale with dynamic content and different viewport sizes. Never design paper as a single fixed PNG. Width is fixed per variant; height grows with content.

**Color palette:** ink black (text, icons), dark bloody red (accents, sold-out), browns/beiges/reds/dark greens (elements). Background drives the tone — currently brick+plaster, may shift lighter over time.

**Typography stack (three voices):**
- Script cursive — product names, elegant labels
- Typewriter — descriptions, body text, prices
- Sharpie/handwritten — accents, stamps, raw marks

**Drop shadows:** all hanging elements have one by default. Hover deepens or enlarges it. Don't overthink — apply consistently and review if it feels too heavy once assembled.

---

## Assets to Produce

### Already exists
- [x] Wall background image (will eventually become a panoramic set)
- [x] Big logo (painted/sprayed treatment)
- [x] Product card frames

### Needs to be made
- [ ] **Small logo** — sprayed version of the big one, for the header
- [ ] **Cart icon** — concept still open; does not need to be hangable, just on-brand
- [ ] **Pin PNG** — single pushpin, used to fasten paper elements to the wall
- [ ] **Nail PNG** — heavier fastener variant for more permanent containers
- [ ] **Paper variants (each as 3 files: top edge, middle texture tile, bottom edge):**
  - Small square note → buttons, small labels
  - Receipt strip (tall + narrow) → product name/price on product page
  - A4-ish sheet → description block on product page
  - Polaroid → cart items
- [ ] **Rope / wire PNG** — horizontal, goes edge to edge, for the cart
- [ ] **Clip PNG** — attaches polaroid to rope (bulldog clip, clothes peg, or binder clip — decide while making it)
- [ ] **Sold-out overlay** — spray paint treatment (two crossing brush strokes in dark red, or "SOLD" sprayed diagonally — decide while making it)
- [ ] **Hover tilt effect** — no asset needed, CSS only (see implementation tasks)

---

## Page Implementation Tasks

### Homepage
- [ ] Replace current paper-tape buttons with new button component (paper + pin, single CTA → catalog)
- [ ] Confirm logo position, size, and that it reads well at all viewport sizes
- [ ] Mobile layout

### Catalog Page
- [ ] Header: place small logo (links to homepage) + cart icon, no visible bar or box, elements float on the wall
- [ ] Product grid: confirm column count — desktop / tablet / mobile
- [ ] Product card hover: implement CSS tilt effect (slight rotate on hover, shadow deepens)
- [ ] Product card sold-out state: apply sold-out overlay PNG on top of frame
- [ ] Sorting controls: plain typography, minimal styling — decide between inline toggle buttons or a simple select, keep it unobtrusive
- [ ] Empty catalog state: design something on-brand for when there are no products

### Product Page
- [ ] Image display: pinned photos (use pin PNG + photo, no frame here). Single image for MVP; gallery navigation TBD.
- [ ] Product name: script typography, housed in a paper container (receipt strip variant) pinned above or below the image
- [ ] Description: A4 paper variant pinned to the wall, typewriter font
- [ ] Add to Cart button: same button component as homepage (paper + pin)
- [ ] "One of a kind" label: small stamped or sprayed mark near the product name
- [ ] Sold-out state: sold-out overlay on image + disable/replace Add to Cart button
- [ ] Back to catalog navigation: minimal, non-boxy — plain text link or a small pinned arrow, no header-style bar
- [ ] Mobile layout
- [ ] **Eureka moment placeholder** — the wall metaphor alone may not be enough for this page to feel special. Return to this once MVP is assembled and you can see it in context.
- [ ] *Post-MVP: video in a CRT/cathode tube screen container*

### Cart Page
- [ ] Horizontal rope/wire PNG spanning full width of the viewport
- [ ] Each cart item = polaroid PNG hanging from the rope via clip PNG
- [ ] If items overflow viewport width, horizontal scroll within that section
- [ ] Subtotal + checkout: paper container at the end of the rope, or below it
- [ ] Remove item interaction: on-brand (pull the polaroid off the rope?)
- [ ] Quantity control: likely not needed since items are unique — just remove
- [ ] Empty cart state: just the rope with nothing on it, maybe a small note pinned nearby
- [ ] Mobile layout (horizontal scroll on mobile needs explicit UX attention)

---

## Technical / Infrastructure

- [ ] Font loading: load the three chosen typefaces, define where each is used in CSS variables
- [ ] CSS drop shadow system: define 2–3 shadow levels (default, hover, pressed) as CSS variables, apply consistently
- [ ] Performance: all PNGs need WebP conversion + lazy loading strategy before launch
- [ ] Shopify sections and blocks: verify structure maps correctly to the four pages once implementation starts
- [ ] Mobile: dedicated review pass on every page after desktop is done

---

## Post-MVP — Continuous Wall Navigation

> Each page is a section of the same physical wall. Navigating between pages slides the viewport horizontally like walking along the wall. Background images are a seamless panorama.

- [ ] Photograph/compose wall background as a horizontal panorama (homepage = left, catalog = right, etc.)
- [ ] Implement JS page transition: intercept link clicks, fetch next page, slide viewport (Swup or Barba.js)
- [ ] Pre-load adjacent background sections to avoid flash between transitions
- [ ] Resolve mobile: horizontal slide conflicts with swipe gestures — needs explicit UX decision
- [ ] Consider cart as a slide-in drawer on the same wall rather than a separate page (avoids full-page transition complexity)
