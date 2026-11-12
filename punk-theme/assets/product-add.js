/*
 * Add to cart without leaving the product page. Without JS the form still posts to /cart/add.
 * First click: the piece goes into the cart, the header hears `cart:added` (header-cart.js fills
 * the cart icon), and once that has played the button swings. After that the same button takes you
 * to the cart.
 *
 * Config on the [data-cart-add] wrapper: data-cart-url, data-swing (strength, 1 = default, 0 = off),
 * data-added-label / data-go-label (screen readers), data-error-label (fallback error).
 */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Boots get a push and swing on their lace (hanging-boot.js). Buttons and stamps rock instead:
  // a damped `rotate`, added on top of the stamp's own tilt.
  function swing(button, strength) {
    if (!strength || reduceMotion.matches) return;
    if (button.classList.contains('hanging-boot')) {
      button.dispatchEvent(new CustomEvent('boot:swing', { detail: { strength } }));
      return;
    }
    if (!button.animate) return;
    const steps = [0, 1, -0.78, 0.58, -0.4, 0.25, -0.13, 0.05, 0];
    button.animate(
      steps.map((m, i) => ({ rotate: `${m * 12 * strength}deg`, easing: i === 0 ? 'ease-out' : 'ease-in-out' })),
      { duration: 2800, composite: 'add' }
    );
  }

  document.querySelectorAll('[data-cart-add]').forEach((wrap) => {
    const form = wrap.querySelector('form');
    const button = form && form.querySelector('[type="submit"]');
    if (!button || button.disabled) return;

    const status = wrap.querySelector('[data-add-status]');
    const error = wrap.querySelector('[data-add-error]');
    const { cartUrl, addedLabel, goLabel, errorLabel } = wrap.dataset;
    const strength = Number(wrap.dataset.swing) || 0;
    let busy = false;
    let added = false;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (added) {
        window.location.href = cartUrl;
        return;
      }
      if (busy) return;
      busy = true;
      error.hidden = true;

      try {
        const res = await fetch(`${form.action}.js`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw { message: data.description || data.message };

        const cart = await fetch(`${cartUrl}.js`).then((r) => r.json());
        added = true;
        // Boots have no visible text, so their accessible name can follow what the click now does.
        if (button.hasAttribute('aria-label')) button.setAttribute('aria-label', goLabel);
        status.textContent = addedLabel;
        // The header sets detail.finished when it plays the fill; no header, no wait.
        const detail = { itemCount: cart.item_count, finished: null };
        document.dispatchEvent(new CustomEvent('cart:added', { detail }));
        busy = false;
        await detail.finished;
        swing(button, strength);
      } catch (e) {
        error.textContent = (e && e.message) || errorLabel;
        error.hidden = false;
      } finally {
        busy = false;
      }
    });
  });
})();
