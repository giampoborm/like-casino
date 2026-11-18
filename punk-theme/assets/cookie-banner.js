/*
 * Cookie banner — skin over Shopify's Customer Privacy API.
 * The API stores the choice; this file only shows the banner and passes the answer on.
 * Works for every [data-cookie-banner] on the page (the bust banner and the plain cookie bar
 * share it). Any element with [data-cookie-settings] or href="#cookie-settings" reopens the choices.
 */
(function () {
  // Both sections load this file; run once.
  if (window.cookieBannerReady) return;
  window.cookieBannerReady = true;

  // Yes = analytics + ads, Maybe = analytics only, No = necessary only
  var ANSWERS = {
    yes: [true, true],
    maybe: [true, false],
    no: [false, false]
  };
  var api = null;
  var banners = [];

  function hasChoice() {
    if (!api || !api.currentVisitorConsent) return false;
    var c = api.currentVisitorConsent();
    return !!c && c.analytics !== '' && c.analytics !== undefined;
  }

  function setup(banner) {
    var layers = banner.querySelectorAll('[data-cookie-layer]');

    function showLayer(name) {
      layers.forEach(function (layer) {
        layer.hidden = layer.dataset.cookieLayer !== name;
      });
    }

    function fillToggles() {
      if (!api) return;
      var c = api.currentVisitorConsent ? api.currentVisitorConsent() : {};
      banner.querySelectorAll('[data-cookie-purpose]').forEach(function (input) {
        input.checked = c[input.dataset.cookiePurpose] === 'yes';
      });
    }

    function open(layer) {
      showLayer(layer || 'notice');
      if (layer === 'choices') fillToggles();
      banner.hidden = false;
      // cookie-smoke.js draws the smoke once the banner has a size
      banner.dispatchEvent(new CustomEvent('cookie-banner:open', { bubbles: true }));
    }

    function close() {
      banner.hidden = true;
    }

    // Preferences are not used by the theme, so they are never granted. Sale of data follows ads.
    function save(analytics, marketing) {
      var consent = {
        analytics: analytics,
        marketing: marketing,
        preferences: false,
        sale_of_data: marketing
      };
      if (api) {
        api.setTrackingConsent(consent, function (error) {
          if (error) console.warn('Cookie banner: consent not saved', error);
        });
      }
      close();
    }

    banner.addEventListener('click', function (event) {
      var t = event.target.closest('button');
      if (!t) return;
      if (ANSWERS[t.dataset.cookieAnswer]) save.apply(null, ANSWERS[t.dataset.cookieAnswer]);
      else if (t.hasAttribute('data-cookie-choose')) { showLayer('choices'); fillToggles(); }
      else if (t.hasAttribute('data-cookie-back')) showLayer('notice');
      else if (t.hasAttribute('data-cookie-save')) {
        var a = banner.querySelector('[data-cookie-purpose="analytics"]');
        var m = banner.querySelector('[data-cookie-purpose="marketing"]');
        save(!!(a && a.checked), !!(m && m.checked));
      }
    });

    // Theme editor: show while the section is selected, whatever the stored choice.
    if (window.Shopify && window.Shopify.designMode) {
      document.addEventListener('shopify:section:select', function (e) {
        if (banner.closest('#shopify-section-' + e.detail.sectionId)) open('notice');
      });
      document.addEventListener('shopify:section:deselect', function (e) {
        if (banner.closest('#shopify-section-' + e.detail.sectionId)) close();
      });
    }

    return { el: banner, open: open };
  }

  function init() {
    document.querySelectorAll('[data-cookie-banner]').forEach(function (el) {
      banners.push(setup(el));
    });
    // Theme editor: a changed setting re-renders the section with a new element; wire it up and show it
    if (window.Shopify && window.Shopify.designMode) {
      document.addEventListener('shopify:section:load', function (e) {
        e.target.querySelectorAll('[data-cookie-banner]').forEach(function (el) {
          var b = setup(el);
          banners.push(b);
          b.open('notice');
        });
      });
    }

    if (!banners.length) return;

    document.addEventListener('click', function (event) {
      var trigger = event.target.closest('[data-cookie-settings], a[href$="#cookie-settings"]');
      if (!trigger) return;
      event.preventDefault();
      banners.forEach(function (b) { b.open('choices'); });
    });

    if (window.Shopify && typeof window.Shopify.loadFeatures === 'function') {
      window.Shopify.loadFeatures([{ name: 'consent-tracking-api', version: '0.1' }], function (error) {
        if (error) {
          console.warn('Cookie banner: Customer Privacy API failed to load', error);
          return;
        }
        api = window.Shopify.customerPrivacy;
        if (!api || window.Shopify.designMode) return;
        banners.forEach(function (b) {
          var needed = b.el.dataset.showWhen === 'always' ? !hasChoice() : api.shouldShowBanner();
          if (needed) b.open('notice');
        });
      });
    }
  }

  // Deferred scripts run after parsing, but guard anyway.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
