/*
 * Cart pager (mobile). The item list is a horizontal scroll-snap strip of
 * pages (CSS grid with --per-page rows flowing into columns), so swiping
 * works natively. This script:
 *   - fits --per-page to the room above the fixed lamp/total, capped at the
 *     section setting, so the list never runs into them on short phones;
 *   - wires the ‹ › buttons and keeps the "1 / 3" counter in sync;
 *   - hides the pager when everything fits on one page.
 * Desktop shows one continuous list, so it does nothing there.
 */
(function () {
  const strip = document.querySelector('[data-cart-pages]');
  const pager = document.querySelector('[data-cart-pager]');
  if (!strip || !pager) return;

  const mobile = window.matchMedia('(max-width: 760px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prev = pager.querySelector('[data-cart-pager-prev]');
  const next = pager.querySelector('[data-cart-pager-next]');
  const current = pager.querySelector('[data-cart-pager-current]');
  const totalEl = pager.querySelector('[data-cart-pager-total]');
  const maxPerPage = parseInt(strip.dataset.perPage, 10) || 5;

  // Page a button scroll is heading to (null when none is in flight). A
  // second tap mid-animation counts from here, not from wherever the strip
  // happens to be. Whenever a scroll finishes, the counter re-syncs to the
  // page actually showing, so it can never get stuck or disagree with it.
  let target = null;

  function pageCount() {
    return Math.max(1, Math.round(strip.scrollWidth / strip.clientWidth));
  }

  function shownPage() {
    return Math.round(strip.scrollLeft / strip.clientWidth);
  }

  function render() {
    const count = pageCount();
    const page = Math.min(target ?? shownPage(), count - 1);
    current.textContent = page + 1;
    totalEl.textContent = count;
    prev.disabled = page <= 0;
    next.disabled = page >= count - 1;
    pager.hidden = count <= 1;
  }

  // How many cards fit between the top of the list and the lamp/total
  function fit() {
    if (!mobile.matches) {
      strip.style.removeProperty('--per-page');
      pager.hidden = true;
      return;
    }

    const lamp = document.querySelector('.cart-lamp');
    const total = document.querySelector('.cart-total');
    const ceiling = Math.min(
      lamp ? lamp.getBoundingClientRect().top : Infinity,
      total ? total.getBoundingClientRect().top : Infinity,
      window.innerHeight
    );
    const top = strip.getBoundingClientRect().top + window.scrollY;
    const pagerRoom = 48;
    const tallest = Math.max(...Array.from(strip.children, (item) => item.offsetHeight));
    const fits = Math.floor((ceiling - top - pagerRoom) / tallest);

    strip.style.setProperty('--per-page', Math.max(1, Math.min(maxPerPage, fits)));
    render();
  }

  function go(delta) {
    const from = target ?? shownPage();
    target = Math.max(0, Math.min(pageCount() - 1, from + delta));
    strip.scrollTo({
      left: target * strip.clientWidth,
      behavior: reducedMotion.matches ? 'auto' : 'smooth'
    });
    render();
  }

  function settled() {
    target = null;
    render();
  }

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));

  // A finger on the strip takes over from any button scroll in flight
  strip.addEventListener('pointerdown', () => { target = null; }, { passive: true });

  if ('onscrollend' in window) {
    strip.addEventListener('scrollend', settled);
  } else {
    // Safari fallback: treat a short pause in scroll events as the end
    let settleTimer;
    strip.addEventListener(
      'scroll',
      () => {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(settled, 150);
      },
      { passive: true }
    );
  }

  // Card heights depend on web fonts (title wrapping), so re-measure on load
  window.addEventListener('load', fit);
  window.addEventListener('resize', fit);
  mobile.addEventListener('change', fit);
  fit();
})();
