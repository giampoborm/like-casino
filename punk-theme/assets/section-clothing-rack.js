/**
 * <clothing-rack>: motion for the clothing rack section.
 *
 * Scrolling is native (overflow + mandatory scroll-snap), so touch, trackpad and keyboard just work and
 * the rail always comes to rest with a garment in the middle: the selected product. On top of that:
 *   - the mouse wheel moves the rail one garment per notch; at the first/last garment it lets the page scroll;
 *   - mouse users can drag the rail and throw it; a throw coasts to rest on a garment;
 *   - each garment is a damped pendulum hanging from the rail. Like a real one it reacts to the rail's
 *     acceleration: it kicks back when the rail starts moving, swings forward when it stops, and hangs
 *     straight while the rail glides at a steady speed. Brushing the pointer across a garment nudges it;
 *   - the name + price under the rack show the selected garment, or the one under the pointer/focus.
 *
 * Cost: one requestAnimationFrame loop that runs only while something visibly moves, transform-only
 * writes on one pre-promoted layer per on-screen hanger (no repaints, no layout reads per frame), and
 * item positions cached until the viewport resizes.
 */
(() => {
  if (customElements.get('clothing-rack')) return;

  const SPRING = 0.012; // pendulum stiffness → ~1s swing period at 60fps
  const DAMPING = 0.075; // damping ratio ~0.35: one or two visible swings, settled in ~1.5s
  const ACCEL_GAIN = 0.03; // how hard a change in rail speed kicks the garments
  const DRAG_KICK = 2; // a hand grabbing the rail jerks it harder than a smooth scroll does
  const MAX_ANGLE = 16; // degrees
  const REST_ANGLE = 0.1; // below this (degrees) a garment counts as still
  const DRAG_THRESHOLD = 6; // px before a mouse press becomes a drag
  const THROW_FRICTION = 0.93; // per-frame speed decay while a throw coasts (~1s)
  const STEP_FRICTION = 0.85; // quicker ease for one-garment wheel steps (~0.45s)
  const RELEASE_WINDOW = 60; // ms of pointer history used for the throw speed
  const WHEEL_THRESHOLD = 30; // wheel delta (px) that counts as one step; trackpads send many small ones
  const WHEEL_COOLDOWN = 160; // ms between steps for a mouse wheel
  const TRACKPAD_COOLDOWN = 380; // longer for trackpads, whose inertia keeps firing small deltas

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  class ClothingRack extends HTMLElement {
    connectedCallback() {
      this.viewport = this.querySelector('[data-rack-viewport]');
      if (!this.viewport) return;

      this.outputTitle = this.querySelector('[data-rack-output-title]');
      this.outputPrice = this.querySelector('[data-rack-output-price]');
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.gain = this.reducedMotion ? 0 : Number(this.dataset.swing ?? 5) / 5;

      // Slightly different weights so garments don't swing in lockstep.
      this.items = [...this.querySelectorAll('[data-rack-item]')].map((el, index) => {
        const label = el.querySelector('[data-rack-title]');
        return {
          el,
          // Two layers per hanger (behind and in front of the rail) swing together
          swings: [...el.querySelectorAll('[data-rack-swing]')],
          title: label?.dataset.rackTitle ?? '',
          price: label?.dataset.rackPrice ?? '',
          url: label?.getAttribute('href'),
          weight: 0.85 + ((index * 37) % 10) / 30,
          center: 0,
          angle: 0,
          velocity: 0,
          transform: '',
        };
      });

      this.velocity = 0;
      this.lastScrollLeft = this.viewport.scrollLeft;
      this.frame = 0;
      this.gliding = null;
      this.dragging = false;
      this.suppressClick = false;
      this.samples = [];
      this.pointerVelocity = 0;
      this.lastPointerX = null;
      this.selected = null;
      this.shown = null;
      this.hovered = null;
      this.wheel = { total: 0, last: 0, lockedUntil: 0 };

      this.tick = this.tick.bind(this);
      this.start = this.start.bind(this);

      // One controller removes every listener when the theme editor re-renders or moves the section.
      this.abort = new AbortController();
      const signal = this.abort.signal;
      const on = (target, type, handler, options = {}) =>
        target?.addEventListener(type, handler.bind(this), { ...options, signal });

      on(this.viewport, 'scroll', this.start, { passive: true });
      on(this.viewport, 'wheel', this.onWheel, { passive: false });
      on(this.viewport, 'pointerdown', this.onPointerDown);
      on(this.viewport, 'pointermove', this.onPointerMove, { passive: true });
      on(this.viewport, 'pointerup', this.onPointerUp);
      on(this.viewport, 'pointercancel', this.onPointerUp);
      on(this.viewport, 'pointerover', this.onPointerOver, { passive: true });
      on(this.viewport, 'pointerleave', this.onPointerLeave, { passive: true });
      on(this.viewport, 'focusin', this.onFocus);
      on(this.viewport, 'focusout', this.onBlur);
      on(this.viewport, 'click', this.onClick, { capture: true });
      on(this.viewport, 'dragstart', (event) => event.preventDefault());

      this.resizeObserver = new ResizeObserver(() => this.measure());
      this.resizeObserver.observe(this.viewport);
    }

    disconnectedCallback() {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.abort?.abort();
      this.resizeObserver?.disconnect();
    }

    /** Cache item centres (track coordinates) so the frame loop never reads layout. */
    measure() {
      for (const item of this.items) item.center = item.el.offsetLeft + item.el.offsetWidth / 2;
      this.itemWidth = this.items[0]?.el.offsetWidth ?? 0;
      this.halfWidth = this.viewport.clientWidth / 2;
      this.maxScroll = this.viewport.scrollWidth - this.viewport.clientWidth;
      this.render(this.viewport.scrollLeft);
    }

    start() {
      if (this.frame) return;
      this.lastTime = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }

    tick(now) {
      // Normalise to 60fps frames so the physics feel the same on 120Hz screens.
      const dt = clamp((now - this.lastTime) / (1000 / 60), 0.25, 2);
      this.lastTime = now;

      if (this.gliding) {
        // Position as a function of elapsed time, so the glide is identical at any frame rate and
        // lands exactly on its garment (re-enabling snap then has nothing to correct).
        const glide = this.gliding;
        glide.time += dt;
        const remaining = glide.friction ** glide.time;
        this.viewport.scrollLeft = glide.from + glide.distance * (1 - remaining);
        if (remaining < 0.01) {
          this.viewport.scrollLeft = glide.from + glide.distance;
          this.endGlide();
        }
      }

      const scrollLeft = this.viewport.scrollLeft;
      const previousVelocity = this.velocity;
      // Follow a hand drag more tightly than smooth/native scrolling, which is already eased.
      const smoothing = this.dragging ? 0.6 : 0.35;
      this.velocity += ((scrollLeft - this.lastScrollLeft) / dt - this.velocity) * smoothing;
      this.lastScrollLeft = scrollLeft;
      const acceleration = ((this.velocity - previousVelocity) / dt) * (this.dragging ? DRAG_KICK : 1);

      const swinging = this.step(acceleration, dt);
      this.render(scrollLeft);

      const scrolling = Math.abs(this.velocity) > 0.05 || this.gliding || this.dragging;
      if (swinging || scrolling) {
        this.frame = requestAnimationFrame(this.tick);
      } else {
        // Settle exactly, so the last frame doesn't leave garments a hair off vertical.
        for (const item of this.items) item.angle = item.velocity = 0;
        this.velocity = 0;
        this.render(scrollLeft);
        this.frame = 0;
      }
    }

    /** Advance every pendulum one step. Returns true while any garment visibly moves. */
    step(acceleration, dt) {
      // Rail speeding up to the left (content moving left) → garments swing out to the right, and vice versa.
      const kick = acceleration * ACCEL_GAIN * this.gain;
      let moving = false;
      for (const item of this.items) {
        const k = SPRING / item.weight;
        item.velocity += (-k * item.angle - DAMPING * Math.sqrt(k / SPRING) * item.velocity - kick) * dt;
        item.angle = clamp(item.angle + item.velocity * dt, -MAX_ANGLE, MAX_ANGLE);
        if (Math.abs(item.angle) > REST_ANGLE || Math.abs(item.velocity) > REST_ANGLE / 10) moving = true;
      }
      return moving;
    }

    /** Write swing angles for on-screen garments and track which garment is in the middle. */
    render(scrollLeft) {
      const center = scrollLeft + this.halfWidth;
      const reach = this.halfWidth + this.itemWidth;
      let nearest = null;
      let nearestDistance = Infinity;

      for (const item of this.items) {
        const distance = Math.abs(item.center - center);
        if (distance < nearestDistance) {
          nearest = item;
          nearestDistance = distance;
        }
        if (distance > reach) continue;

        const transform = `rotate(${item.angle.toFixed(2)}deg)`;
        if (transform !== item.transform) {
          for (const swing of item.swings) swing.style.transform = transform;
          item.transform = transform;
        }
      }

      if (nearest !== this.selected) {
        this.selected = nearest;
        if (!this.hovered) this.show(nearest);
      }
    }

    /** Glide to a garment; `friction` sets how long the ease takes. */
    glideTo(item, friction) {
      const from = this.viewport.scrollLeft;
      const target = clamp(item.center - this.halfWidth, 0, this.maxScroll);
      this.target = item;
      if (this.reducedMotion || Math.abs(target - from) < 1) {
        this.viewport.scrollLeft = target;
        this.endGlide();
        return;
      }
      this.viewport.classList.add('is-dragging'); // snapping off while we steer
      this.gliding = { from, distance: target - from, time: 0, friction };
      this.start();
    }

    endGlide() {
      this.gliding = null;
      this.target = null;
      this.viewport.classList.remove('is-dragging'); // re-enables snapping
    }

    /* Mouse wheel: one garment per notch. */

    onWheel(event) {
      if (event.ctrlKey || this.dragging || !this.items.length) return; // pinch-zoom / mid-drag
      // Mostly horizontal (trackpad swipe, shift+wheel): native scrolling + snapping handles it.
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;

      const direction = Math.sign(event.deltaY);
      const from = this.target ?? this.selected;
      const next = this.items[this.items.indexOf(from) + direction];
      if (!direction || !next) return; // first/last garment: let the page scroll on

      event.preventDefault();
      const wheel = this.wheel;
      const pixels = event.deltaMode === 1 ? event.deltaY * 40 : event.deltaY;
      if (event.timeStamp - wheel.last > 200 || Math.sign(wheel.total) !== direction) wheel.total = 0;
      wheel.total += pixels;
      wheel.last = event.timeStamp;
      if (Math.abs(wheel.total) < WHEEL_THRESHOLD || event.timeStamp < wheel.lockedUntil) return;

      // Small, frequent deltas are a trackpad; its inertia would otherwise race through the rack.
      const trackpad = event.deltaMode === 0 && Math.abs(event.deltaY) < 50;
      wheel.total = 0;
      wheel.lockedUntil = event.timeStamp + (trackpad ? TRACKPAD_COOLDOWN : WHEEL_COOLDOWN);
      this.glideTo(next, STEP_FRICTION);
    }

    /* Mouse drag + throw. Touch and pens keep native scrolling. */

    onPointerDown(event) {
      this.suppressClick = false;
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      this.endGlide();
      this.press = { x: event.clientX, scroll: this.viewport.scrollLeft, id: event.pointerId };
      this.samples = [];
    }

    onPointerMove(event) {
      if (this.lastPointerX !== null) this.pointerVelocity = event.clientX - this.lastPointerX;
      this.lastPointerX = event.clientX;
      if (!this.press) return;

      const dx = event.clientX - this.press.x;
      if (!this.dragging) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        this.dragging = true;
        this.viewport.setPointerCapture(this.press.id);
        this.viewport.classList.add('is-dragging');
      }
      this.viewport.scrollLeft = this.press.scroll - dx;
      this.samples.push({ time: event.timeStamp, scroll: this.viewport.scrollLeft });
      if (this.samples.length > 8) this.samples.shift();
      this.start();
    }

    /** Throw speed in px per 60fps frame, from the last few pointer moves. Zero if the pointer had stopped. */
    releaseVelocity(now) {
      const recent = this.samples.filter((sample) => now - sample.time <= RELEASE_WINDOW);
      if (recent.length < 2) return 0;
      const first = recent[0];
      const last = recent[recent.length - 1];
      return ((last.scroll - first.scroll) / Math.max(last.time - first.time, 8)) * (1000 / 60);
    }

    onPointerUp(event) {
      this.press = null;
      if (!this.dragging) return;
      this.dragging = false;
      this.suppressClick = true; // the click that ends a drag must not open the product under the cursor
      this.throw(clamp(this.releaseVelocity(event.timeStamp), -60, 60));
    }

    /** Coast to the garment nearest to where the throw would naturally stop, never backwards. */
    throw(velocity) {
      const from = this.viewport.scrollLeft;
      const landing = from + velocity / (1 - THROW_FRICTION);
      const direction = Math.abs(velocity) > 1 ? Math.sign(velocity) : 0;
      let best = null;
      let bestDistance = Infinity;
      for (const item of this.items) {
        const snap = clamp(item.center - this.halfWidth, 0, this.maxScroll);
        if (direction && Math.sign(snap - from) === -direction) continue;
        if (Math.abs(snap - landing) < bestDistance) {
          best = item;
          bestDistance = Math.abs(snap - landing);
        }
      }
      if (best) this.glideTo(best, THROW_FRICTION);
      else this.endGlide();
    }

    onClick(event) {
      if (!this.suppressClick) return;
      this.suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    }

    /* Hover/focus: nudge the garment and show its name + price; otherwise show the selected one. */

    itemFor(target) {
      return target && this.items.find((item) => item.el.contains(target));
    }

    onPointerOver(event) {
      if (this.dragging) return;
      const item = this.itemFor(event.target.closest('[data-rack-title]'));
      if (!item) {
        // Pointer on the wall between garments: back to the selected one.
        this.hovered = null;
        this.show(this.selected);
        return;
      }
      this.hovered = item;
      this.show(item);
      if (!this.gain || item.el.contains(event.relatedTarget)) return;
      // Pointer moving right pushes the hem to the right (a negative CSS rotation).
      item.velocity += clamp(-this.pointerVelocity * 0.05, -0.7, 0.7) * this.gain;
      this.start();
    }

    onPointerLeave() {
      this.lastPointerX = null;
      this.hovered = null;
      this.show(this.selected);
    }

    onFocus(event) {
      const item = this.itemFor(event.target.closest('[data-rack-title]'));
      if (!item) return;
      this.hovered = item;
      this.show(item);
    }

    onBlur() {
      this.hovered = null;
      this.show(this.selected);
    }

    show(item) {
      if (!item || item === this.shown || !this.outputTitle) return;
      this.shown = item;
      this.outputTitle.textContent = item.title;
      if (item.url) this.outputTitle.href = item.url;
      this.outputPrice.textContent = item.price;
    }
  }

  customElements.define('clothing-rack', ClothingRack);
})();
