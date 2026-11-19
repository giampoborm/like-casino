/*
 * Add to cart without leaving the product page. Without JS the form still posts to /cart/add.
 * First click: the piece goes into the cart, the header hears `cart:added` (header-cart.js fills
 * the cart icon), and once that has played the button swings. With boots, the buy boot (rendered
 * hidden beside the add boot, a link to the cart) drops in straight away instead. After that the
 * same button takes you to the cart too.
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
    // Buy boot, hidden until the piece is in the cart.
    const buyBoot = wrap.querySelector('.hanging-boot[hidden]');
    let busy = false;
    let added = false;

    // Products with options: the picker sits outside the form (tied to it by its `form` attribute).
    // Picking another option shows its price and makes the button add again instead of going to the cart.
    const picker = form.elements.namedItem('id');
    if (picker && picker.tagName === 'SELECT') {
      const price = document.querySelector('[data-product-price]');
      const addLabel = button.getAttribute('aria-label');
      picker.addEventListener('change', () => {
        const option = picker.selectedOptions[0];
        if (price && option && option.dataset.price) price.textContent = option.dataset.price;
        added = false;
        if (addLabel) button.setAttribute('aria-label', addLabel);
        status.textContent = '';
        error.hidden = true;
      });
    }

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

        // The piece is in the cart from here on, whatever happens next.
        added = true;
        // Boots have no visible text, so their accessible name can follow what the click now does.
        if (button.hasAttribute('aria-label')) button.setAttribute('aria-label', goLabel);
        status.textContent = addedLabel;

        // Boots: the buy boot drops in now, while the header fills the cart.
        if (buyBoot && buyBoot.hidden) {
          buyBoot.hidden = false;
          buyBoot.dispatchEvent(new CustomEvent('boot:drop', { detail: { strength } }));
        }

        // Item count for the header basket. If this second request fails the add still stands:
        // skip the fill rather than report an error for something that worked.
        const cart = await fetch(`${cartUrl}.js`, { headers: { Accept: 'application/json' } })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);
        if (cart) {
          // The header sets detail.finished when it plays the fill; no header, no wait.
          const detail = { itemCount: cart.item_count, finished: null };
          document.dispatchEvent(new CustomEvent('cart:added', { detail }));
          busy = false;
          await detail.finished;
        }
        if (!buyBoot) swing(button, strength);
      } catch (e) {
        error.textContent = (e && e.message) || errorLabel;
        error.hidden = false;
      } finally {
        busy = false;
      }
    });
  });
})();
