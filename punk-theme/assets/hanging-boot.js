/*
 * Hanging boots as pendulums. Boot and lace swing together around the point the lace is hung from:
 * the top edge of the screen (fixed boots) or of the page, or the lace's own end if it is shorter.
 * That distance is measured into --boot-pivot, which hanging-boot.css uses as the transform-origin.
 *
 * A real damped pendulum per boot, simulated in angle: the swing period follows the length
 * (2π√(L/g), with 1000px counted as a metre), so a boot hung close to the top swings quickly and one
 * low on the page swings slowly. What moves it:
 *   - the drop: a gentle swing once the lace goes taut
 *   - a faint breeze, so it never looks frozen
 *   - the mouse: moving across the boot nudges it the same way (data-hover-sway, 1 = default)
 *   - `boot:swing` events, e.g. from product-add.js after an add (detail.strength, 1 = default)
 * The Sway setting (--boot-swing, 2.5deg = 100%) scales the drop swing and the breeze.
 */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const DEG = Math.PI / 180;
  const G = 9810; // px/s²: gravity with 1000px as a metre
  const DAMPING = 0.07; // damping ratio: air barely slows a boot, so it fades over several swings
  const LANDING = 1.2 * DEG; // swing after the drop, at Sway 100%
  const NUDGE = 2.5 * DEG; // swing for a `boot:swing` of strength 1
  const BREEZE = 0.15 * DEG; // idle drift, at Sway 100%
  const BREEZE_PERIOD = 7; // s
  const PUSH = 0.0015; // rad/s of swing speed per px of mouse movement, at hover strength 1
  const HOVER_MAX = 1.5 * DEG; // the mouse alone never swings it further than this, at strength 1
  const TAUT_AT = 0.76; // s into the drop when the lace goes taut (38% of 2s, hanging-boot.css)

  const boots = [...document.querySelectorAll('.hanging-boot')].map(setup).filter(Boolean);
  if (!boots.length) return;

  // Length of the pendulum: from the knot up to where the lace is hung.
  function measure(b) {
    const css = getComputedStyle(b.boot);
    const lace = parseFloat(css.getPropertyValue('--boot-string')) || 1500;
    const hookY = (parseFloat(css.getPropertyValue('--boot-hook-y')) || 0) / 100;
    const angle = b.theta;
    b.el.style.rotate = ''; // measure it hanging straight
    const rect = b.el.getBoundingClientRect();
    // Take out wherever the drop animation has it right now (translateY of the wrapper).
    const drop = new DOMMatrixReadOnly(css.transform === 'none' ? undefined : css.transform).m42;
    const knotY = rect.top - drop + rect.height * hookY;
    const toTop = b.boot.classList.contains('hanging-boot--fixed') ? knotY : knotY + window.scrollY;
    b.length = Math.max(60, Math.min(lace, toTop));
    b.boot.style.setProperty('--boot-pivot', `${b.length}px`);
    b.w0 = Math.sqrt(G / b.length);
    b.theta = angle;

    const swing = css.getPropertyValue('--boot-swing').trim();
    b.sway = swing ? parseFloat(swing) / 2.5 : 1;
  }

  // Start a swing of about `amplitude` (rad), adding to whatever it is doing.
  function kick(b, amplitude, direction = Math.random() < 0.5 ? -1 : 1) {
    b.omega += direction * amplitude * b.w0;
  }

  function setup(boot) {
    const el = boot.querySelector('.hanging-boot__swing');
    if (!el) return null;
    const css = getComputedStyle(boot);
    const b = { boot, el, theta: 0, omega: 0, phase: Math.random() * BREEZE_PERIOD, ready: false };
    measure(b);

    // Swing once the lace goes taut at the end of the fall.
    const delay = parseFloat(css.getPropertyValue('--boot-delay')) || 0;
    setTimeout(() => {
      b.ready = true;
      kick(b, LANDING * b.sway);
    }, (delay + TAUT_AT) * 1000);

    const hover = Number(boot.dataset.hoverSway) || 0;
    if (hover) {
      boot.addEventListener('pointermove', (event) => {
        if (event.pointerType !== 'mouse' || !b.ready) return;
        // Mouse to the right swings it right, i.e. counter-clockwise: θ grows to the right here.
        const max = HOVER_MAX * hover * b.w0; // swing speed that reaches HOVER_MAX
        const next = b.omega + event.movementX * PUSH * hover;
        if (Math.abs(next) <= max) b.omega = next;
        else if (Math.abs(b.omega) < max) b.omega = Math.sign(next) * max;
        // else it is already swinging harder than the mouse may push it: leave it be
      });
    }

    boot.addEventListener('boot:swing', (event) => {
      kick(b, NUDGE * ((event.detail && event.detail.strength) || 1));
    });
    return b;
  }

  // Again once the boot images have their height, and whenever the layout changes size.
  window.addEventListener('load', () => boots.forEach(measure));
  window.addEventListener('resize', () => boots.forEach(measure));

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    for (const b of boots) {
      b.omega += (-b.w0 * b.w0 * Math.sin(b.theta) - 2 * DAMPING * b.w0 * b.omega) * dt;
      b.theta += b.omega * dt;
      const breeze = BREEZE * b.sway * Math.sin(((now / 1000 + b.phase) * 2 * Math.PI) / BREEZE_PERIOD);
      // θ > 0 is to the right; CSS rotate is clockwise, which swings a hanging boot to the left.
      b.el.style.rotate = `${-(b.theta + breeze)}rad`;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
