/*
 * Cookie banner smoke — draws, as SVG, the cloud around the banner's text box and the trail
 * rising from the cigarette tip into it. Static: redrawn only when the banner opens or the
 * text box / scene changes size, so the cloud always fits the texts at any screen size.
 *
 * Hooks (sections/cookie-banner.liquid): [data-smoke-svg] the svg, [data-smoke-cloud] the text
 * box, [data-smoke-tip] a zero-size marker on the lit end, [data-smoke-unit] the bust (its width
 * is the scene unit). cookie-banner.js fires `cookie-banner:open` on the banner when it shows.
 */
(function () {
  if (window.cookieSmokeReady) return;
  window.cookieSmokeReady = true;

  var NS = 'http://www.w3.org/2000/svg';
  var SEED = 1977;

  // Small seeded random, so the cloud has the same shape on every visit
  function random(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function node(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function round(v) {
    return Math.round(v * 10) / 10;
  }

  // A darker grey of the smoke colour, for the shade under it
  function shadeOf(color) {
    var m = /^#?([0-9a-f]{6})$/i.exec(color);
    if (!m) return '#7a7a7a';
    var n = parseInt(m[1], 16);
    var mix = function (c) { return Math.round(c * 0.45 + 0x3c * 0.55); };
    return 'rgb(' + mix(n >> 16) + ',' + mix((n >> 8) & 255) + ',' + mix(n & 255) + ')';
  }

  // Noise that frays the edges: `size` is the grain in px, `amount` how far the edge moves
  function fray(defs, id, region, size, octaves, amount, blur) {
    var f = node('filter', {
      id: id,
      filterUnits: 'userSpaceOnUse',
      x: round(region.x), y: round(region.y), width: round(region.w), height: round(region.h),
      'color-interpolation-filters': 'sRGB'
    }, defs);
    node('feTurbulence', { type: 'fractalNoise', baseFrequency: (1 / size).toFixed(4), numOctaves: octaves, seed: SEED % 97, result: 'noise' }, f);
    node('feDisplacementMap', { in: 'SourceGraphic', in2: 'noise', scale: round(amount), xChannelSelector: 'R', yChannelSelector: 'G', result: 'frayed' }, f);
    if (blur) node('feGaussianBlur', { in: 'frayed', stdDeviation: round(blur) }, f);
  }

  function draw(banner) {
    var svg = banner.querySelector('[data-smoke-svg]');
    var cloud = banner.querySelector('[data-smoke-cloud]');
    var tip = banner.querySelector('[data-smoke-tip]');
    var unit = banner.querySelector('[data-smoke-unit]');
    if (!svg || !cloud || banner.hidden || !cloud.offsetWidth) return;

    var origin = svg.getBoundingClientRect();
    var box = cloud.getBoundingClientRect();
    var u = unit ? unit.offsetWidth : box.width / 3;
    var color = getComputedStyle(banner).getPropertyValue('--cb-smoke').trim() || '#f4f2ee';
    var setting = function (name, fallback) {
      return Math.min(1, Math.max(0, Number(banner.dataset[name] || fallback) / 100));
    };
    var wisp = setting('smokeWisp', 50);
    var opacity = Math.max(0.1, setting('smokeOpacity', 75));
    var spread = setting('smokeSpread', 30);
    var rand = random(SEED);
    var uid = banner.id || 'cookie-banner';

    var bx = box.left - origin.left;
    var by = box.top - origin.top;
    var bw = box.width;
    var bh = box.height;

    // How far the frayed edge moves, and how far the smoke reaches past the text. The reach is
    // cut short where the screen ends, so the smoke never runs off the side of a phone.
    var fringe = (0.06 + wisp * 0.26) * u;
    var reach = (0.05 + spread * 0.4) * u;
    var room = function (space) {
      return Math.max(-0.15 * u, Math.min(reach, space - 4 - fringe / 2));
    };
    var L = bx - room(box.left);
    var R = bx + bw + room(window.innerWidth - box.right);
    var T = by - room(box.top);
    var B = by + bh + reach;

    svg.textContent = '';
    var defs = node('defs', {}, svg);
    var dark = shadeOf(color);
    // A faint grey copy underneath, a touch lower, so light smoke still reads on a light wall
    var shade = node('g', { fill: dark, opacity: round(30 * opacity) / 100, filter: 'url(#' + uid + '-smoke)', transform: 'translate(0 ' + round(0.04 * u) + ')' }, svg);
    var mass = node('g', { fill: color, filter: 'url(#' + uid + '-smoke)' }, svg);
    var wisps = node('g', { fill: 'none', stroke: color, 'stroke-linecap': 'round', filter: 'url(#' + uid + '-wisp)' }, svg);

    // One see-through patch of smoke. Overlaps add up, so the middle ends up densest.
    function patch(x, y, rx, ry, alpha, tilt, keepInside) {
      if (keepInside) {
        rx = Math.min(rx, x - L, R - x);
        ry = Math.min(ry, y - T, B - y);
      }
      if (rx < 2 || ry < 2) return;
      var attrs = { cx: round(x), cy: round(y), rx: round(rx), ry: round(ry) };
      if (tilt) attrs.transform = 'rotate(' + round(tilt) + ' ' + round(x) + ' ' + round(y) + ')';
      node('ellipse', attrs, shade);
      attrs['fill-opacity'] = round(alpha * 100) / 100;
      node('ellipse', attrs, mass);
    }

    function strand(d, width, alpha, stroke) {
      var attrs = { d: d, 'stroke-width': round(Math.max(1.5, width)), 'stroke-opacity': round(alpha * 100) / 100 };
      if (stroke) attrs.stroke = stroke;
      node('path', attrs, wisps);
    }

    // ---- Cloud: a row of big uneven patches as the base under the text, then smaller loose
    //      patches drifting over it. Overlaps add up, so the middle is densest. ----
    var cols = Math.max(2, Math.round((R - L) / (0.9 * u)));
    var step = (R - L) / cols;
    for (var c = 0; c < cols; c++) {
      var x = L + step * (c + 0.5) + (rand() - 0.5) * 0.3 * step;
      patch(x, (T + B) / 2 + (rand() - 0.5) * 0.15 * (B - T), step * (0.85 + rand() * 0.35), ((B - T) / 2) * (0.8 + rand() * 0.25), 0.4 * opacity, (rand() - 0.5) * 12, true);
    }
    // Fill the gaps between them along the middle, where the words are
    patch((L + R) / 2, (T + B) / 2, (R - L) * 0.46, (B - T) * 0.36, 0.3 * opacity, 0, true);

    var count = Math.max(6, Math.min(16, Math.round((bw * bh) / (0.25 * u * u))));
    for (var i = 0; i < count; i++) {
      patch(
        bx + rand() * bw,
        by + rand() * bh,
        (0.15 + rand() * 0.25) * bw,
        (0.3 + rand() * 0.4) * bh,
        (0.18 + rand() * 0.2) * opacity,
        (rand() - 0.5) * 16,
        true
      );
    }

    // Thin wisps curling up off the top, where there is room above
    var up = Math.min(0.45 * u, box.top - (by - T) - 8);
    if (up > 0.15 * u) {
      [0.2, 0.55, 0.82].forEach(function (f, i) {
        var x = L + (R - L) * f;
        var y = T + 0.1 * u;
        var s = i % 2 ? 1 : -1;
        var h = up * (0.6 + rand() * 0.4);
        strand('M' + round(x) + ',' + round(y) + ' C' + round(x + s * 0.12 * u) + ',' + round(y - h * 0.4) + ' ' +
          round(x - s * 0.15 * u) + ',' + round(y - h * 0.7) + ' ' + round(x + s * 0.05 * u) + ',' + round(y - h), 0.025 * u, 0.55 * opacity);
      });
    }

    // ---- Trail: from the tip into the cloud: up into its underside when the cloud is above
    //      the cigarette (phones), sideways into its left edge when it is beside it (desktop) ----
    var bounds = { x: L, y: T - up, w: R - L, h: B - T + up };
    if (tip) {
      var t0 = tip.getBoundingClientRect();
      var sx = t0.left - origin.left;
      var sy = t0.top - origin.top;
      var above = by + bh < sy - 0.2 * u;
      // The trail ends inside the cloud, so the two melt together instead of meeting at an edge
      var ex = above ? bx + 0.2 * bw : L + 0.4 * u;
      var ey = above ? B - 0.35 * u : Math.max(by + 0.3 * bh, Math.min(by + 0.7 * bh, sy - 0.3 * u));
      // Phones: rise above, then fall into the cloud. Desktop: rise, then bend right into it
      var kx = above ? sx + 0.02 * u : sx + 0.05 * u;
      var ky = above ? Math.min(sy, ey) - 0.35 * u : ey;

      var point = function (t) {
        var a = (1 - t) * (1 - t);
        var b = 2 * t * (1 - t);
        var c = t * t;
        return [a * sx + b * kx + c * ex, a * sy + b * ky + c * ey];
      };

      // The trail is made of the same soft patches as the cloud: small and faint at the tip,
      // growing and thickening until they reach the cloud's own density inside it
      var n = 16;
      for (var i = 0; i < n; i++) {
        var t = 0.08 + (0.92 * i) / (n - 1);
        var p = point(t);
        var r = (0.03 + Math.pow(t, 1.5) * 0.26) * u;
        var curl = Math.sin(t * Math.PI * 3) * 0.05 * u * t;
        patch(p[0] + curl, p[1] - curl * 0.5, r * 1.3, r, (0.12 + 0.28 * t) * opacity, (rand() - 0.5) * 30, false);
      }

      // Near the tip smoke is a thin thread: two strands that curl apart and fade into the patches
      var mid = point(0.6);
      var fade = node('linearGradient', {
        id: uid + '-fade', gradientUnits: 'userSpaceOnUse',
        x1: round(sx), y1: round(sy), x2: round(mid[0]), y2: round(mid[1])
      }, defs);
      node('stop', { offset: 0, 'stop-color': color, 'stop-opacity': 1 }, fade);
      node('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0 }, fade);
      [-1, 1].forEach(function (side) {
        var a = point(0.2);
        var b = point(0.4);
        strand('M' + round(sx) + ',' + round(sy) +
          ' C' + round(a[0] + side * 0.1 * u) + ',' + round(a[1] - side * 0.06 * u) + ' ' +
          round(b[0] - side * 0.1 * u) + ',' + round(b[1] + side * 0.06 * u) + ' ' + round(mid[0]) + ',' + round(mid[1]),
          0.03 * u, 0.7 * opacity, 'url(#' + uid + '-fade)');
      });

      bounds.x = Math.min(bounds.x, sx);
      bounds.w = R - bounds.x;
      bounds.h = Math.max(B, sy) - bounds.y;
    }

    var pad = 0.6 * u;
    var region = { x: bounds.x - pad, y: bounds.y - pad, w: bounds.w + 2 * pad, h: bounds.h + 2 * pad };
    // Patches: frayed, soft edges. Strands: the same grain but gentler, so thin lines survive
    // (they only appear as threads near the tip, and on the cloud at low strength)
    fray(defs, uid + '-smoke', region, 0.22 * u, 3, fringe, 0.035 * u);
    fray(defs, uid + '-wisp', region, 0.15 * u, 2, 0.03 * u + wisp * 0.08 * u, 0.008 * u);
  }

  // Redraw whenever the text box or the scene changes size (layer switch, font load, resize)
  var observer = 'ResizeObserver' in window
    ? new ResizeObserver(function (entries) {
        entries.forEach(function (e) {
          var banner = e.target.closest('[data-cookie-banner]');
          if (banner) draw(banner);
        });
      })
    : null;

  document.addEventListener('cookie-banner:open', function (event) {
    var banner = event.target;
    var cloud = banner.querySelector('[data-smoke-cloud]');
    if (!cloud) return;
    if (observer && !banner.smokeWatched) {
      banner.smokeWatched = true;
      observer.observe(cloud);
      observer.observe(banner.querySelector('.cookie-banner__scene') || banner);
    }
    requestAnimationFrame(function () { draw(banner); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { draw(banner); });
  });
})();
