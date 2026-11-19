/*
 * Catalogue rows: the mouse wheel scrolls a row sideways while the cursor is over it.
 * Once the row reaches its first or last card, the wheel goes back to scrolling the page,
 * so a row never traps the visitor. Sideways wheel/trackpad swipes are left to the browser.
 */
(() => {
  const LINE_HEIGHT = 16;

  function onWheel(event) {
    const track = event.currentTarget;
    if (event.ctrlKey) return; // pinch / ctrl+wheel zoom
    if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;

    let delta = event.deltaY;
    if (event.deltaMode === 1) delta *= LINE_HEIGHT;
    else if (event.deltaMode === 2) delta *= track.clientWidth;

    const max = track.scrollWidth - track.clientWidth;
    if (max <= 0) return;
    const atStart = track.scrollLeft <= 0 && delta < 0;
    const atEnd = track.scrollLeft >= max - 1 && delta > 0;
    if (atStart || atEnd) return;

    event.preventDefault();
    track.scrollLeft += delta;
  }

  function init(root) {
    root.querySelectorAll('[data-catalogue-track]').forEach((track) => {
      if (track._catalogueWheel) return;
      track._catalogueWheel = true;
      track.addEventListener('wheel', onWheel, { passive: false });
    });
  }

  // Theme editor: a re-rendered section brings fresh markup
  document.addEventListener('shopify:section:load', (event) => init(event.target));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(document));
  } else {
    init(document);
  }
})();
