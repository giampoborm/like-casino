/*
 * Collection floor: staggered "masonry" columns without CSS columns.
 * Safari mishandles CSS multi-column layout (lazy pictures never load, cards vanish on hover),
 * so the cards are dealt into real column boxes instead: in source order, each card goes into
 * the currently shortest column. The column count comes from --floor-cols-now, which the
 * section's stylesheet sets per breakpoint; the layout is redone when that count changes.
 * Without this script the section falls back to a plain grid.
 */
(() => {
  function columnCount(grid) {
    const n = parseInt(getComputedStyle(grid).getPropertyValue('--floor-cols-now'), 10);
    return n > 0 ? n : 1;
  }

  function layout(grid) {
    const cols = columnCount(grid);
    if (grid._floorCols === cols) return;
    grid._floorCols = cols;

    // Cards in their original (source) order, wherever they currently sit
    if (!grid._floorCards) grid._floorCards = Array.from(grid.querySelectorAll('.collection-floor-card'));
    const cards = grid._floorCards;

    const columns = [];
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < cols; i++) {
      const col = document.createElement('div');
      col.className = 'collection-floor__col';
      columns.push(col);
      fragment.appendChild(col);
    }
    grid.replaceChildren(fragment);
    grid.classList.add('is-masonry');

    // Pictures carry width/height attributes, so heights are right before they load
    for (const card of cards) {
      let shortest = columns[0];
      for (const col of columns) if (col.offsetHeight < shortest.offsetHeight) shortest = col;
      shortest.appendChild(card);
    }
  }

  function init(root) {
    root.querySelectorAll('[data-floor-grid]').forEach((grid) => {
      grid._floorCols = null;
      grid._floorCards = null;
      layout(grid);
    });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => document.querySelectorAll('[data-floor-grid]').forEach(layout), 100);
  });

  // Theme editor: a re-rendered section brings fresh markup
  document.addEventListener('shopify:section:load', (event) => init(event.target));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(document));
  } else {
    init(document);
  }
})();
