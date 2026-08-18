/* ============================================================
   Brand Vision — brandvm.js
   Source of truth for all site custom JS.
   Serve via jsDelivr (load AFTER lenis, both with defer):
   https://cdn.jsdelivr.net/gh/YOUR-GITHUB-USER/brandvm-site-code@1.0.0/js/brandvm.min.js
   (.min.js is generated automatically by jsDelivr)
   Contents: Lenis smooth-scroll init (moved here from the Site
   Settings footer, now guarded) + the former Slater Global.js
   (SmartSwiper, SmartFlareBorder, SmartCounter, DotMap, ReadMore).
   ============================================================ */

/* ------------------------------------------------
   Lenis Smooth Scrolling (guarded init)
   Previously inline in Site Settings -> Footer. Now:
   - skips the Webflow editor
   - only wires GSAP/ScrollTrigger when they exist
   - falls back to a plain rAF driver otherwise
------------------------------------------------ */
(function () {
  if (window.Webflow && window.Webflow.env && window.Webflow.env('editor')) return;
  if (typeof window.Lenis !== 'function') return;

  var lenis = new Lenis({
    duration: 1.2,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });
  window.lenis = lenis;

  if (window.gsap && window.ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  } else {
    var raf = function (time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }
})();

/* ------------------------------------------------
   Former Slater Global.js (verbatim)
------------------------------------------------ */

console.log("%cThis site was built by Brand Vision Marketing",
  "background:blue;color:#fff;padding: 8px;");
const SmartSwiper = {
  // ---------- environment ----------
  hasIO: "IntersectionObserver" in window,
  reduceMotion: typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  debounceT: null,
  // ---------- configuration ----------
  CONFIGS: [
  {
    selector: ".newsletter-slider.swiper",
    wrapper: ".newsletter-slider",
    opts: {
      effect: "creative",
      grabCursor: true,
      loop: true,
      loopAdditionalSlides: 2,
      centeredSlides: true,
      speed: 600,
      autoplay: { delay: 2000, disableOnInteraction: false },
      creativeEffect: {
        limitProgress: 2, // how many slides influence the effect on each side
        prev: {
          translate: ["-20%", "0%", -50], // shift LEFT, slightly back in Z
          rotate: [0, 0, -6], // tilt counter-clockwise
          opacity: 1,
          shadow: true,
          scale: 0.9,
        },
        next: {
          translate: ["20%", "0%", -50], // shift RIGHT, slightly back in Z
          rotate: [0, 0, 6], // tilt clockwise
          opacity: 1,
          shadow: true,
          scale: 0.9,
        },
      },
      watchOverflow: true,
    },
  }, ],
  // ---------- small utils ----------
  idle(fn) {
    return "requestIdleCallback" in window ?
      window.requestIdleCallback(fn) :
      setTimeout(fn, 0);
  },
  isDisplayed(el) {
    return !!(el && el.getClientRects().length);
  },
  // ---------- CDN loaders ----------
  ensureCSS() {
    if (document.querySelector('link[href*="swiper-bundle.min.css"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css";
    document.head.appendChild(link);
  },
  ensureJS(cb) {
    if (window.Swiper) return cb();
    const existing = document.querySelector(
      'script[src*="swiper-bundle.min.js"]'
    );
    if (existing) {
      const wait = () => (window.Swiper ? cb() : setTimeout(wait, 40));
      return wait();
    }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";
    s.defer = true;
    s.onload = cb;
    s.onerror = () => {};
    document.body.appendChild(s);
  },
  // ---------- option building ----------
  normalizeOpts(base) {
    const o = Object.assign(
      {
        touchReleaseOnEdges: true,
        simulateTouch: true,
        observer: true,
        observeParents: true,
        observeSlideChildren: true,
      },
      base || {}
    );
    if (this.reduceMotion) {
      if (o.autoplay) o.autoplay = false;
      o.speed = Math.min(o.speed || 400, 300);
    }
    return o;
  },
  resolveNav(el, cfg) {
    const root = (cfg.wrapper && el.closest(cfg.wrapper)) || null;
    const scope = root || el.parentElement || document;
    const prev = cfg.navPrev ?
      scope.querySelector(cfg.navPrev) :
      scope.querySelector(".swiper-prev");
    const next = cfg.navNext ?
      scope.querySelector(cfg.navNext) :
      scope.querySelector(".swiper-next");
    return { scope, prev, next };
  },
  withNav(el, cfg, opts) {
    const { prev, next } = this.resolveNav(el, cfg);
    if (prev || next) {
      opts.navigation = { prevEl: prev || null, nextEl: next || null };
    }
    return opts;
  },
  readDataOverrides(el, opts) {
    const over = Object.assign({}, opts);
    const { dataset } = el;
    if ("swiperLoop" in dataset) over.loop = dataset.swiperLoop === "true";
    if ("swiperSpeed" in dataset) {
      over.speed = Math.max(
        0,
        parseInt(dataset.swiperSpeed, 10) || over.speed || 400
      );
    }
    if ("swiperAutoplay" in dataset) {
      if (dataset.swiperAutoplay === "false") over.autoplay = false;
      else {
        const delay = Math.max(0, parseInt(dataset.swiperAutoplay, 10) || 0);
        over.autoplay = delay ? { delay, disableOnInteraction: true } : false;
      }
    }
    return over;
  },
  // ---------- edge nav hiding ----------
  bindEdgeNavHiding(el, swiper, prevEl, nextEl) {
    if (!swiper || el.dataset.edgeNavBound) return;
    el.dataset.edgeNavBound = "1";
    const setHidden = (btn, hidden) => {
      if (!btn) return;
      btn.style.display = hidden ? "none" : "";
    };
    const update = () => {
      const locked = !!swiper.isLocked;
      setHidden(prevEl, locked || !!swiper.isBeginning);
      setHidden(nextEl, locked || !!swiper.isEnd);
    };
    update();
    [
      "slideChange",
      "reachBeginning",
      "reachEnd",
      "fromEdge",
      "resize",
      "update",
      "lock",
      "unlock",
    ].forEach((evt) => {
      try {
        swiper.on(evt, update);
      } catch (_) {}
    });
  },
  // ---------- lifecycle ----------
  getInstance(el) {
    return el._smartSwiperInstance || el.swiper || null;
  },
  repairIfNeeded(el) {
    const cfg = this.CONFIGS.find((c) => el.matches(c.selector));
    if (!cfg) return;
    const inst = this.getInstance(el);
    if (!inst) return;
    const { prev, next } = this.resolveNav(el, cfg);
    if (this.isDisplayed(el)) {
      try {
        inst.update();
        if (inst.navigation && typeof inst.navigation.update === "function") {
          inst.navigation.update();
        }
      } catch (_) {}
    }
    this.bindEdgeNavHiding(el, inst, prev, next);
  },
  initOne(el) {
    if (!el) return;
    const existing = this.getInstance(el);
    if (existing) {
      this.repairIfNeeded(el);
      return;
    }
    // Don't init while hidden (inactive Webflow tab panes)
    if (!this.isDisplayed(el)) return;
    const cfg = this.CONFIGS.find((c) => el.matches(c.selector));
    if (!cfg) return;
    const opts = this.withNav(
      el,
      cfg,
      this.normalizeOpts(this.readDataOverrides(el, cfg.opts))
    );
    const { prev, next } = this.resolveNav(el, cfg);
    el.dataset.swiperInited = "1";
    try {
      const swiper = new Swiper(el, opts);
      el._smartSwiperInstance = swiper;
      this.bindEdgeNavHiding(el, swiper, prev, next);
      try {
        swiper.update();
      } catch (_) {}
    } catch (err) {
      delete el.dataset.swiperInited;
      console.error("[SmartSwiper] init failed for", el, err);
    }
  },
  scan() {
    const sels = this.CONFIGS.map((c) => c.selector).join(", ");
    if (!sels) return [];
    return Array.from(document.querySelectorAll(sels));
  },
  observeAndInit(els) {
    if (!els.length) return;
    // Init/repair anything visible right now
    els.forEach((el) => this.initOne(el));
    // Lazy-init the rest when they scroll into view
    if (!this.hasIO) return;
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            this.initOne(e.target);
            obs.unobserve(e.target);
          }
        });
      }, { rootMargin: "200px 0px" }
    );
    els.forEach((el) => io.observe(el));
  },
  boot() {
    const els = this.scan();
    if (!els.length) return;
    this.ensureCSS();
    this.ensureJS(() => this.observeAndInit(els));
  },
  refresh() {
    clearTimeout(this.debounceT);
    this.debounceT = setTimeout(() => this.boot(), 80);
  },
  init() {
    const start = () => {
      this.boot();
      // Refresh after Webflow tab changes
      document.addEventListener(
        "click",
        (e) => {
          const link =
            e.target && e.target.closest ?
            e.target.closest(".w-tab-link") :
            null;
          if (!link) return;
          setTimeout(() => this.refresh(), 60);
        },
        true
      );
      window.addEventListener("resize", () => this.refresh(), {
        passive: true,
      });
      // Keep external API name
      if (!("athleticSlider" in window)) {
        Object.defineProperty(window, "athleticSlider", {
          value: Object.freeze({ refresh: () => this.refresh() }),
          writable: false,
          configurable: false,
        });
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  },
};
const SmartFlareBorder = {
  // ---------- environment ----------
  hasIO: "IntersectionObserver" in window,
  reduceMotion: typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  debounceT: null,
  // ---------- configuration ----------
  SELECTOR: "[data-flare-border]",
  ACTIVE_CLASS: "is-in-view",
  THRESHOLD: 0.25,
  ROOT_MARGIN: "0px 0px -10% 0px", // fire slightly before fully in view
  // ---------- small utils ----------
  isDisplayed(el) {
    return !!(el && el.getClientRects().length);
  },
  // ---------- lifecycle ----------
  isActivated(el) {
    return el.dataset.flareActivated === "1";
  },
  activate(el) {
    if (!el || this.isActivated(el)) return;
    if (!this.isDisplayed(el)) return;
    el.dataset.flareActivated = "1";
    if (this.reduceMotion) {
      // Skip the transition entirely; jump to final state
      el.classList.add(this.ACTIVE_CLASS);
      return;
    }
    // Force a frame so the browser registers the starting state
    // before the class flips — guarantees the transition plays.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add(this.ACTIVE_CLASS);
      });
    });
  },
  scan() {
    return Array.from(document.querySelectorAll(this.SELECTOR));
  },
  observeAndActivate(els) {
    if (!els.length) return;
    // If IO isn't supported, just activate everything immediately
    if (!this.hasIO) {
      els.forEach((el) => this.activate(el));
      return;
    }
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.activate(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: this.THRESHOLD,
        rootMargin: this.ROOT_MARGIN,
      }
    );
    els.forEach((el) => {
      if (this.isActivated(el)) return;
      io.observe(el);
    });
  },
  boot() {
    const els = this.scan();
    if (!els.length) return;
    this.observeAndActivate(els);
  },
  refresh() {
    clearTimeout(this.debounceT);
    this.debounceT = setTimeout(() => this.boot(), 80);
  },
  init() {
    const start = () => {
      this.boot();
      // Re-scan after Webflow tab changes (cards in inactive tabs
      // aren't measurable until their pane becomes active)
      document.addEventListener(
        "click",
        (e) => {
          const link =
            e.target && e.target.closest ?
            e.target.closest(".w-tab-link") :
            null;
          if (!link) return;
          setTimeout(() => this.refresh(), 60);
        },
        true
      );
      // Handle CMS-loaded or dynamically inserted cards
      window.addEventListener("resize", () => this.refresh(), {
        passive: true,
      });
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  },
};
const SmartCounter = {
  // ---------- environment ----------
  hasIO: "IntersectionObserver" in window,
  reduceMotion: typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  debounceT: null,
  // ---------- configuration ----------
  SELECTOR: "[data-count-end]",
  THRESHOLD: 0,
  ROOT_MARGIN: "0px 0px -10% 0px",
  DEFAULT_DURATION: 2000,
  DEFAULT_EASING: "cubic",
  EASINGS: {
    quad: (t) => 1 - (1 - t) * (1 - t),
    cubic: (t) => 1 - Math.pow(1 - t, 3),
    quart: (t) => 1 - Math.pow(1 - t, 4),
    expo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  },
  // ---------- small utils ----------
  isDisplayed(el) {
    return !!(el && el.getClientRects().length);
  },
  isCounted(el) {
    return el.dataset.counted === "true";
  },
  // ---------- formatting ----------
  readOptions(el) {
    const d = el.dataset;
    return {
      target: parseFloat(d.countEnd ?? d.countTarget) || 0,
      start: parseFloat(d.countStart) || 0,
      duration: Math.max(
        0,
        parseInt(d.countDuration, 10) || this.DEFAULT_DURATION
      ),
      decimals: Math.max(0, parseInt(d.countDecimals, 10) || 0),
      separator: d.countSeparator ?? ",",
      prefix: d.countPrefix || "",
      suffix: d.countSuffix || "",
      easeFn: this.EASINGS[d.countEase] || this.EASINGS[this.DEFAULT_EASING],
    };
  },
  format(n, opts) {
    const fixed = n.toFixed(opts.decimals);
    const [int, dec] = fixed.split(".");
    const withSep = opts.separator ?
      int.replace(/\B(?=(\d{3})+(?!\d))/g, opts.separator) :
      int;
    return opts.prefix + (dec ? `${withSep}.${dec}` : withSep) + opts.suffix;
  },
  // ---------- lifecycle ----------
  animate(el) {
    if (!el || this.isCounted(el)) return;
    if (!this.isDisplayed(el)) return;
    el.dataset.counted = "true";
    const opts = this.readOptions(el);
    // Reduced motion: skip the animation, show final value immediately
    if (this.reduceMotion || opts.duration === 0) {
      el.textContent = this.format(opts.target, opts);
      return;
    }
    const startTime = performance.now();
    const tick = (now) => {
      const t = Math.min((now - startTime) / opts.duration, 1);
      const value = opts.start + (opts.target - opts.start) * opts.easeFn(t);
      el.textContent = this.format(value, opts);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
  scan() {
    return Array.from(document.querySelectorAll(this.SELECTOR));
  },
  observeAndAnimate(els) {
    if (!els.length) return;
    // If IO isn't supported, animate everything immediately
    if (!this.hasIO) {
      els.forEach((el) => this.animate(el));
      return;
    }
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animate(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: this.THRESHOLD,
        rootMargin: this.ROOT_MARGIN,
      }
    );
    els.forEach((el) => {
      if (this.isCounted(el)) return;
      io.observe(el);
    });
  },
  boot() {
    const els = this.scan();
    if (!els.length) return;
    this.observeAndAnimate(els);
  },
  refresh() {
    clearTimeout(this.debounceT);
    this.debounceT = setTimeout(() => this.boot(), 80);
  },
  init() {
    const start = () => {
      this.boot();
      // Re-scan after Webflow tab changes
      document.addEventListener(
        "click",
        (e) => {
          const link =
            e.target && e.target.closest ?
            e.target.closest(".w-tab-link") :
            null;
          if (!link) return;
          setTimeout(() => this.refresh(), 60);
        },
        true
      );
      // Handle CMS-loaded or dynamically inserted counters
      window.addEventListener("resize", () => this.refresh(), {
        passive: true,
      });
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  },
};
SmartSwiper.init();
SmartFlareBorder.init();
SmartCounter.init();

/* Dot Map — twinkle + cursor disruption.
   NOTE: no svg[data-dotmap] exists on the site today (verified in the
   Aug 18 2026 custom-code audit), so this module boots and exits.
   Kept for v1.0.0 so behavior is identical to the Slater build; remove
   in a future release if the dot-map section never ships. */
(function () {
  "use strict";
  var DEFAULTS = {
    // twinkle
    speed: 0.2, // rate multiplier
    dim: 0.16, // alpha of a dot at its dimmest
    sizeVary: 0.35, // how much size breathes with the twinkle
    bias: 2.1, // >1 keeps most dots dim, with occasional flares
    // cursor — disruption
    radius: 360, // push influence radius, in SVG user units
    push: 0.4, // shove strength. 0 = no displacement at all
    spring: 0.025, // pull back toward home
    damping: 0.6, // velocity decay. higher = longer wobble
    grow: 0.15, // extra size at full displacement
    growAt: 26, // displacement (SVG units) that reaches full grow
    // cursor — glow
    glowRadius: 180, // brighten radius, in SVG user units
    glow: 1, // 0 = no brightening
    // edge falloff  (edgeMin > 1 inverts it: bigger dots at the edges)
    edgeMin: 0.45, // size multiplier at the outermost dot
    edgeBand: 0.3, // how far in the falloff reaches, as a fraction
    edgeMode: "radial", // 'edge' = distance to bounding box | 'radial'
    // bleed: extra canvas beyond the svg box, in SVG user units
    pad: 70,
    // cost
    fps: 60,
    colors: 16, // gradient quantisation
    levels: 8, // alpha quantisation
  };
  var TAU = 6.283185307179586;
  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // ---------- geometry ----------
  function parseDots(d) {
    var dots = [];
    var subs = d.split("M");
    for (var i = 0; i < subs.length; i++) {
      var nums = subs[i].match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
      if (!nums || nums.length < 8) continue;
      var minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (var j = 0; j + 1 < nums.length; j += 2) {
        var x = parseFloat(nums[j]),
          y = parseFloat(nums[j + 1]);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      var r = (maxX - minX) / 2;
      if (!(r > 0)) continue;
      dots.push({ ox: (minX + maxX) / 2, oy: (minY + maxY) / 2, r: r });
    }
    return dots;
  }
  // stable pseudo-random from position
  function hash(x, y) {
    var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
  // ---------- colour ----------
  function parseColor(str) {
    str = (str || "").trim();
    var m = /^#([0-9a-f]{3,8})$/i.exec(str);
    if (m) {
      var h = m[1];
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ];
    }
    m = /^rgba?\(([^)]+)\)$/i.exec(str);
    if (m) {
      var p = m[1].split(",");
      return [parseFloat(p[0]) | 0, parseFloat(p[1]) | 0, parseFloat(p[2]) | 0];
    }
    var named = { white: [255, 255, 255], black: [0, 0, 0] };
    return named[str.toLowerCase()] || [148, 213, 255];
  }

  function readGradient(svg, path) {
    var fill = path.getAttribute("fill") || "";
    var idm = /url\(#([^)]+)\)/.exec(fill);
    var grad = idm && svg.querySelector('linearGradient[id="' + idm[1] + '"]');
    if (!grad) return { flat: parseColor(fill || "#94D5FF") };
    var stops = [];
    var els = grad.querySelectorAll("stop");
    for (var i = 0; i < els.length; i++) {
      var off = parseFloat(els[i].getAttribute("offset"));
      stops.push({
        t: isNaN(off) ? i / Math.max(1, els.length - 1) : off,
        c: parseColor(els[i].getAttribute("stop-color")),
      });
    }
    if (!stops.length) return { flat: [148, 213, 255] };
    stops.sort(function (a, b) {
      return a.t - b.t;
    });
    return {
      x1: parseFloat(grad.getAttribute("x1")) || 0,
      y1: parseFloat(grad.getAttribute("y1")) || 0,
      x2: parseFloat(grad.getAttribute("x2")) || 0,
      y2: parseFloat(grad.getAttribute("y2")) || 0,
      stops: stops,
    };
  }

  function sampleGradient(g, t) {
    var s = g.stops;
    if (t <= s[0].t) return s[0].c;
    if (t >= s[s.length - 1].t) return s[s.length - 1].c;
    for (var i = 1; i < s.length; i++) {
      if (t <= s[i].t) {
        var a = s[i - 1],
          b = s[i];
        var k = (t - a.t) / (b.t - a.t || 1);
        return [
          Math.round(a.c[0] + (b.c[0] - a.c[0]) * k),
          Math.round(a.c[1] + (b.c[1] - a.c[1]) * k),
          Math.round(a.c[2] + (b.c[2] - a.c[2]) * k),
        ];
      }
    }
    return s[s.length - 1].c;
  }
  // ---------- instance ----------
  function init(svg, opts) {
    var path = svg.querySelector("path");
    if (!path) return;
    var d = path.getAttribute("d");
    if (!d) return;
    var cfg = {},
      k;
    for (k in DEFAULTS) cfg[k] = DEFAULTS[k];
    for (k in opts || {})
      if (opts[k] != null) cfg[k] = opts[k];
    [
      "speed",
      "dim",
      "sizeVary",
      "bias",
      "radius",
      "push",
      "spring",
      "damping",
      "grow",
      "growAt",
      "glowRadius",
      "glow",
      "edgeMin",
      "edgeBand",
      "pad",
      "fps",
    ].forEach(function (key) {
      var a = svg.getAttribute("data-dot-" + key.toLowerCase());
      if (a != null && a !== "") cfg[key] = parseFloat(a);
    });
    var em = svg.getAttribute("data-dot-edgemode");
    if (em) cfg.edgeMode = em;
    var dots = parseDots(d);
    if (dots.length < 2) return;
    var vb = (svg.getAttribute("viewBox") || "").split(/[\s,]+/).map(Number);
    if (vb.length !== 4 || isNaN(vb[2]) || !vb[2]) {
      vb = [
        0,
        0,
        parseFloat(svg.getAttribute("width")) || 1000,
        parseFloat(svg.getAttribute("height")) || 1000,
      ];
    }
    var vbX = vb[0],
      vbY = vb[1],
      vbW = vb[2],
      vbH = vb[3];
    var i, p;
    // ---- edge size falloff + twinkle phase ----
    var fMinX = Infinity,
      fMaxX = -Infinity,
      fMinY = Infinity,
      fMaxY = -Infinity;
    for (i = 0; i < dots.length; i++) {
      p = dots[i];
      if (p.ox < fMinX) fMinX = p.ox;
      if (p.ox > fMaxX) fMaxX = p.ox;
      if (p.oy < fMinY) fMinY = p.oy;
      if (p.oy > fMaxY) fMaxY = p.oy;
    }
    var fW = fMaxX - fMinX || 1,
      fH = fMaxY - fMinY || 1;
    var cxF = (fMinX + fMaxX) / 2,
      cyF = (fMinY + fMaxY) / 2;

    function computeEdge() {
      var band = (Math.max(1e-6, cfg.edgeBand) * Math.min(fW, fH)) / 2;
      for (var i = 0; i < dots.length; i++) {
        var p = dots[i],
          t;
        if (cfg.edgeMode === "radial") {
          var nx = (p.ox - cxF) / (fW / 2),
            ny = (p.oy - cyF) / (fH / 2);
          t = (1 - Math.sqrt(nx * nx + ny * ny)) / Math.max(1e-6, cfg.edgeBand);
        } else {
          var dd = Math.min(
            p.ox - fMinX,
            fMaxX - p.ox,
            p.oy - fMinY,
            fMaxY - p.oy
          );
          t = dd / band;
        }
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        p.edge = cfg.edgeMin + (1 - cfg.edgeMin) * t;
      }
    }
    computeEdge();
    for (i = 0; i < dots.length; i++) {
      p = dots[i];
      p.ph = hash(p.ox, p.oy) * TAU;
      p.sp = 0.45 + hash(p.oy, p.ox) * 1.15;
      p.x = p.ox;
      p.y = p.oy;
      p.vx = 0;
      p.vy = 0;
    }
    // ---- colour buckets ----
    var g = readGradient(svg, path);
    var nC = Math.max(2, cfg.colors | 0);
    var nL = Math.max(2, cfg.levels | 0);
    var palette = [];
    if (g.flat) {
      nC = 1;
      palette.push("rgb(" + g.flat.join(",") + ")");
      for (i = 0; i < dots.length; i++) dots[i].b = 0;
    } else {
      var ax = g.x2 - g.x1,
        ay = g.y2 - g.y1;
      var len2 = ax * ax + ay * ay || 1;
      for (i = 0; i < nC; i++) {
        palette.push("rgb(" + sampleGradient(g, i / (nC - 1)).join(",") + ")");
      }
      for (i = 0; i < dots.length; i++) {
        p = dots[i];
        var t = ((p.ox - g.x1) * ax + (p.oy - g.y1) * ay) / len2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        p.b = Math.round(t * (nC - 1));
      }
    }
    // preallocated draw groups: colour bucket x alpha level
    var groups = new Array(nC * nL);
    for (i = 0; i < groups.length; i++) groups[i] = [];
    // ---- canvas ----
    var canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "display:block;position:absolute;left:0;top:0;pointer-events:none";
    var ctx = canvas.getContext("2d");
    var host = svg.parentNode;
    if (getComputedStyle(host).position === "static")
      host.style.position = "relative";
    host.appendChild(canvas);
    svg.style.visibility = "hidden";
    var scale = 1,
      offX = 0,
      offY = 0,
      cw = 0,
      ch = 0,
      dpr = 1;

    function resize() {
      var rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      // matches preserveAspectRatio="xMidYMid meet"
      scale = Math.min(rect.width / vbW, rect.height / vbH);
      var padPx = Math.max(0, cfg.pad || 0) * scale;
      cw = rect.width + padPx * 2;
      ch = rect.height + padPx * 2;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      canvas.style.width = cw + "px";
      canvas.style.height = ch + "px";
      var hostRect = host.getBoundingClientRect();
      canvas.style.left = rect.left - hostRect.left - padPx + "px";
      canvas.style.top = rect.top - hostRect.top - padPx + "px";
      offX = padPx + (rect.width - vbW * scale) / 2;
      offY = padPx + (rect.height - vbH * scale) / 2;
      draw(now);
    }
    // ---- physics ----
    function physics() {
      var live = active && cfg.push > 0;
      var R = cfg.radius,
        R2 = R * R;
      var sp = cfg.spring,
        dm = cfg.damping;
      for (var i = 0; i < dots.length; i++) {
        var p = dots[i];
        if (live) {
          var dx = p.x - px,
            dy = p.y - py;
          var d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            var dist = Math.sqrt(d2) || 0.0001;
            var f = 1 - dist / R;
            var force = f * f * cfg.push;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }
        p.vx = (p.vx + (p.ox - p.x) * sp) * dm;
        p.vy = (p.vy + (p.oy - p.y) * sp) * dm;
        p.x += p.vx;
        p.y += p.vy;
      }
    }
    // ---- render ----
    var now = 0;

    function draw(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      var i, gi;
      for (i = 0; i < groups.length; i++) groups[i].length = 0;
      var dim = cfg.dim,
        span = 1 - dim,
        vary = cfg.sizeVary,
        bias = cfg.bias;
      var lit = active && cfg.glow > 0;
      var GR = cfg.glowRadius,
        GR2 = GR * GR;
      var growAt = cfg.growAt || 1;
      for (i = 0; i < dots.length; i++) {
        var p = dots[i];
        // shaped sine: mostly dim, occasional flare
        var w = 0.5 + 0.5 * Math.sin(t * p.sp * cfg.speed + p.ph);
        var tw = Math.pow(w, bias);
        var a = dim + span * tw;
        var s = 1 - vary * 0.5 + vary * tw;
        // how far this dot has been shoved from home
        var ddx = p.x - p.ox,
          ddy = p.y - p.oy;
        var disp = Math.sqrt(ddx * ddx + ddy * ddy);
        var dn = disp / growAt;
        if (dn > 1) dn = 1;
        s *= 1 + dn * cfg.grow;
        var f = dn;
        if (lit) {
          var dx = p.x - px,
            dy = p.y - py;
          var d2 = dx * dx + dy * dy;
          if (d2 < GR2) {
            var g2 = 1 - Math.sqrt(d2) / GR;
            g2 = g2 * g2 * cfg.glow;
            if (g2 > f) f = g2;
          }
        }
        if (f > 0) a += (1 - a) * f;
        p._a = a;
        p._s = p.r * p.edge * s;
        if (p._s <= 0.05) continue;
        var lvl = (a * nL) | 0;
        if (lvl > nL - 1) lvl = nL - 1;
        if (lvl < 0) lvl = 0;
        groups[p.b * nL + lvl].push(p);
      }
      for (gi = 0; gi < groups.length; gi++) {
        var list = groups[gi];
        if (!list.length) continue;
        ctx.globalAlpha = ((gi % nL) + 0.5) / nL;
        ctx.fillStyle = palette[(gi / nL) | 0];
        ctx.beginPath();
        for (i = 0; i < list.length; i++) {
          var q = list[i];
          var rr = q._s * scale;
          var cx = offX + (q.x - vbX) * scale;
          var cy = offY + (q.y - vbY) * scale;
          ctx.moveTo(cx + rr, cy);
          ctx.arc(cx, cy, rr, 0, TAU);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // ---- pointer ----
    var px = -1e6,
      py = -1e6,
      active = false;
    var section =
      svg.closest("section") || svg.closest("[data-dotmap-scope]") || host;
    section.addEventListener(
      "pointermove",
      function (e) {
        if (e.pointerType === "touch") return;
        var rect = canvas.getBoundingClientRect();
        if (!rect.width) return;
        px = vbX + (e.clientX - rect.left - offX) / scale;
        py = vbY + (e.clientY - rect.top - offY) / scale;
        active = true;
      }, { passive: true }
    );
    section.addEventListener(
      "pointerleave",
      function () {
        active = false;
      }, { passive: true }
    );
    // ---- loop ----
    var raf = 0,
      last = -1e9,
      visible = true,
      started;

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      if (started === undefined) {
        started = ts;
        last = ts;
      }
      var minGap = cfg.fps > 0 ? 1000 / cfg.fps : 0;
      var dt = ts - last;
      if (dt < minGap) return;
      last = ts;
      now = (ts - started) / 1000;
      var steps = Math.round(dt / 16.67);
      if (steps < 1) steps = 1;
      if (steps > 4) steps = 4;
      for (var s = 0; s < steps; s++) physics();
      draw(now);
    }

    function play() {
      if (!raf && visible) raf = requestAnimationFrame(frame);
    }

    function pause() {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        last = -1e9;
      }
    }
    // don't burn frames on a map that's scrolled off screen
    if (window.IntersectionObserver) {
      new IntersectionObserver(
        function (entries) {
          visible = entries[0].isIntersecting;
          if (visible) play();
          else pause();
        }, { rootMargin: "120px" }
      ).observe(svg);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pause();
      else play();
    });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(svg);
    else window.addEventListener("resize", resize);
    resize();
    play();
    return {
      cfg: cfg,
      dots: dots,
      draw: draw,
      resize: resize,
      recomputeEdge: computeEdge,
      play: play,
      pause: pause,
      destroy: function () {
        pause();
        canvas.remove();
        svg.style.visibility = "";
      },
    };
  }

  function boot() {
    var nodes = document.querySelectorAll("svg[data-dotmap]");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].__dotmap) continue;
      if (reduced) continue; // leave the SVG exactly as authored
      nodes[i].__dotmap = init(nodes[i]) || true;
    }
  }
  window.DotMap = { init: init, boot: boot, parseDots: parseDots };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

(function () {
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)');

  function cardOf(el) {
    return el.closest('[data-readmore="card"]') || el.closest('.w-dyn-item');
  }

  function setLabel(toggle, expanded) {
    var label = toggle.querySelector('[data-readmore="label"]') || toggle;
    label.textContent = expanded ?
      (toggle.getAttribute('data-less-text') || 'Read Less −') :
      (toggle.getAttribute('data-more-text') || 'Read More +');
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  }

  function afterMaxHeight(el, fn) {
    if (el._rmDone) el.removeEventListener('transitionend', el._rmDone);
    el._rmDone = function (e) {
      if (e.target !== el || e.propertyName !== 'max-height') return;
      el.removeEventListener('transitionend', el._rmDone);
      el._rmDone = null;
      fn();
    };
    el.addEventListener('transitionend', el._rmDone);
  }

  function expand(text) {
    if (REDUCE.matches) { text.classList.add('is-expanded'); return; }
    var startH = text.offsetHeight;
    text.classList.add('is-expanded');
    text.style.maxHeight = '';
    var endH = text.scrollHeight;
    text.style.maxHeight = startH + 'px';
    void text.offsetHeight;
    text.style.maxHeight = endH + 'px';
    afterMaxHeight(text, function () { text.style.maxHeight = 'none'; });
  }

  function collapse(text) {
    if (REDUCE.matches) { text.classList.remove('is-expanded'); return; }
    var startH = text.offsetHeight;
    text.classList.remove('is-expanded');
    text.style.maxHeight = '';
    var endH = text.offsetHeight;
    text.classList.add('is-expanded');
    text.style.maxHeight = startH + 'px';
    void text.offsetHeight;
    text.style.maxHeight = endH + 'px';
    afterMaxHeight(text, function () {
      text.classList.remove('is-expanded');
      text.style.maxHeight = '';
    });
  }

  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-readmore="toggle"]');
    if (!toggle) return;
    e.preventDefault();
    var card = cardOf(toggle);
    var text = card && card.querySelector('[data-readmore="text"]');
    if (!text) return;
    var expanded = !text.classList.contains('is-expanded');
    if (expanded) expand(text);
    else collapse(text);
    setLabel(toggle, expanded);
  });

  function checkToggles() {
    document.querySelectorAll('[data-readmore="text"]').forEach(function (text) {
      if (text.classList.contains('is-expanded')) return;
      var card = cardOf(text);
      var toggle = card && card.querySelector('[data-readmore="toggle"]');
      if (!toggle) return;
      toggle.style.display = (text.scrollHeight > text.clientHeight + 1) ? '' : 'none';
    });
  }

  var rT;
  window.addEventListener('resize', function () {
    clearTimeout(rT);
    rT = setTimeout(checkToggles, 150);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(checkToggles);
  checkToggles();

  document.querySelectorAll('[data-readmore="toggle"]').forEach(function (t) {
    t.setAttribute('role', 'button');
    t.setAttribute('aria-expanded', 'false');
  });
})();
