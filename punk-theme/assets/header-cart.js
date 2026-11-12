/*
 * Header cart fill. The icon is a sprite strip (see header.liquid); on `cart:added` (from
 * product-add.js) it steps from the frame it shows to the frame for the new count, through the
 * frames in between, and hands back `event.detail.finished` so the boot can wait for it.
 * Once the cart is full (the 3+ level), adding more leaves it as it is: no animation, no wait.
 *
 * Config on .header__cart-link: data-frames, data-levels (frame for 0,1,2,3+ items, 1-based),
 * data-count (items on load), data-frame-ms, data-label, data-item-one, data-item-many.
 */
(function () {
  const link = document.querySelector('.header__cart-link');
  if (!link) return;

  const icon = link.querySelector('.header__cart-icon');
  const { label, itemOne, itemMany } = link.dataset;
  const frames = Math.max(2, Number(link.dataset.frames) || 17);
  const frameMs = Number(link.dataset.frameMs) || 90;
  // 0-based frame for 0, 1, 2 and 3+ items
  const levels = link.dataset.levels.split(',').map((n) => Math.min(frames, Math.max(1, Number(n) || 1)) - 1);
  const levelOf = (count) => Math.min(count, levels.length - 1);
  const pos = (frame) => `${(frame / (frames - 1)) * 100}% 0`;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let shown = levels[levelOf(Number(link.dataset.count) || 0)];
  let current = null;

  document.addEventListener('cart:added', (event) => {
    const count = event.detail.itemCount;
    icon.alt = `${label} (${count} ${count === 1 ? itemOne : itemMany})`;

    const to = levels[levelOf(count)];
    // Already showing this level or a fuller one (full cart, or a stale count): stay as is.
    if (to <= shown) return;

    const from = shown;
    if (current) current.cancel();
    shown = to;
    icon.style.objectPosition = pos(to);
    if (reduceMotion.matches) return;

    const n = to - from + 1;
    current = icon.animate(
      [{ objectPosition: pos(from) }, { objectPosition: pos(to) }],
      { duration: n * frameMs, easing: `steps(${n}, jump-none)` }
    );
    // Resolves whether it ends or is cut short by a newer add.
    event.detail.finished = current.finished.then(
      () => {},
      () => {}
    );
  });
})();
