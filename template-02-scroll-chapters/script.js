/* Scroll Chapters - guarded Lenis + GSAP + Spline fallback */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isDesktop = function () { return window.innerWidth > 860; };

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById("menuBtn");
  var navLinks = document.getElementById("navLinks");
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", function () {
      var open = navLinks.classList.toggle("isOpen");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        navLinks.classList.remove("isOpen");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Spline fallback: dotted 2D canvas if 3D fails in 6s ---------- */
  var splineEl = document.getElementById("splineEl");
  var stageView = document.getElementById("stageView");
  var fallback = document.getElementById("stageFallback");
  var canvas = document.getElementById("fallbackCanvas");
  var splineReady = false;

  function markReady() {
    if (splineReady) return;
    splineReady = true;
    if (stageView) stageView.classList.add("isReady");
  }
  if (splineEl) {
    splineEl.addEventListener("load", markReady);
    // If the viewer renders shadow content, treat as ready
    setTimeout(function () {
      try {
        if (splineEl.shadowRoot && splineEl.shadowRoot.children.length > 0) markReady();
        var c = splineEl.shadowRoot ? splineEl.shadowRoot.querySelector("canvas") : null;
        if (c) markReady();
      } catch (err) { /* cross root read may fail, ignore */ }
    }, 3500);
  }

  var dots = [];
  var ctx = canvas ? canvas.getContext("2d") : null;
  var raf = null;

  function sizeCanvas() {
    if (!canvas || !stageView || !ctx) return;
    var r = stageView.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(r.width * dpr));
    canvas.height = Math.max(1, Math.floor(r.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildDots(r.width, r.height);
  }
  function buildDots(w, h) {
    dots = [];
    var gap = w < 500 ? 34 : 44;
    for (var y = gap / 2; y < h; y += gap) {
      for (var x = gap / 2; x < w; x += gap) {
        dots.push({
          x: x, y: y,
          r: 2 + Math.random() * 3,
          p: Math.random() * Math.PI * 2,
          s: 0.6 + Math.random() * 1.2
        });
      }
    }
  }
  function drawDots(t) {
    if (!ctx || !canvas) return;
    var w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0E9F8A";
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      var wob = reduceMotion ? 0 : Math.sin(t / 900 + d.p) * 5 * d.s;
      var alpha = 0.45 + 0.4 * Math.abs(Math.sin(t / 1100 + d.p));
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(d.x, d.y + wob, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!reduceMotion) raf = requestAnimationFrame(drawDots);
  }
  function startFallback() {
    if (splineReady) return;
    if (canvas) canvas.hidden = false;
    if (fallback) {
      var t = fallback.querySelector(".fallbackTitle");
      var s = fallback.querySelector(".fallbackText");
      if (t) t.textContent = "Showing light 2D visual";
      if (s) s.textContent = "3D did not load, so this dotted pattern keeps the stage alive.";
    }
    sizeCanvas();
    if (ctx) {
      if (reduceMotion) drawDots(0);
      else {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(drawDots);
      }
    }
  }
  setTimeout(function () { if (!splineReady) startFallback(); }, 6000);
  if (splineEl) {
    splineEl.addEventListener("error", startFallback);
  }

  /* ---------- Smooth scroll: Lenis, guarded ---------- */
  var lenis = null;
  try {
    if (!reduceMotion && typeof Lenis !== "undefined") {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      var tick = function (time) {
        lenis.raf(time);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  } catch (err) { lenis = null; }

  // Anchor clicks work with or without Lenis
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis && lenis.scrollTo) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ---------- Scroll effects: GSAP + ScrollTrigger, guarded ---------- */
  var stageLabel = document.getElementById("stageLabel");
  var stageCaption = document.getElementById("stageCaption");
  var progressFill = document.getElementById("progressFill");
  var stageFrame = document.getElementById("stageFrame");
  var dotsLinks = Array.prototype.slice.call(document.querySelectorAll("[data-dot]"));
  var chapters = Array.prototype.slice.call(document.querySelectorAll(".chapter"));

  function setActive(id) {
    dotsLinks.forEach(function (d) {
      d.classList.toggle("isActive", d.getAttribute("data-dot") === id);
    });
    var chap = document.getElementById(id);
    if (chap && chap.hasAttribute("data-index")) {
      var n = parseInt(chap.getAttribute("data-index"), 10) + 1;
      if (stageLabel) stageLabel.textContent = "Chapter 0" + n + " of 03";
      if (stageCaption && chap.getAttribute("data-caption")) {
        stageCaption.textContent = chap.getAttribute("data-caption");
      }
    }
  }

  // Active chapter tracking (works without GSAP)
  if ("IntersectionObserver" in window) {
    var seen = ["intro", "chapter1", "chapter2", "chapter3", "gallery"];
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setActive(en.target.id);
      });
    }, { rootMargin: "-40% 0px -50% 0px", threshold: 0 });
    seen.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }

  var triggers = [];
  function buildScrollFX() {
    // tear down old triggers on resize
    triggers.forEach(function (t) { try { t.kill(); } catch (e) {} });
    triggers = [];
    if (progressFill) progressFill.style.width = "8%";

    var hasGSAP = (typeof gsap !== "undefined");
    var hasST = (typeof ScrollTrigger !== "undefined");
    if (!hasGSAP || !hasST || reduceMotion || !isDesktop()) return;
    try { gsap.registerPlugin(ScrollTrigger); } catch (e) { return; }

    // Reacting stage: gentle rotate + scale as chapters pass
    if (stageFrame) {
      var tw = gsap.fromTo(stageFrame,
        { rotationY: -9, rotationX: 4, scale: 0.97 },
        {
          rotationY: 9, rotationX: -4, scale: 1.02, ease: "none",
          scrollTrigger: { trigger: "#chapters", start: "top 70%", end: "bottom 45%", scrub: 1 }
        });
      if (tw && tw.scrollTrigger) triggers.push(tw.scrollTrigger);
    }

    // Chapter cards rise in
    chapters.forEach(function (ch) {
      var t = gsap.from(ch, {
        y: 46, opacity: 0.25, ease: "none",
        scrollTrigger: { trigger: ch, start: "top 88%", end: "top 42%", scrub: 1 }
      });
      if (t && t.scrollTrigger) triggers.push(t.scrollTrigger);
    });

    // Overall progress bar across the story
    if (progressFill) {
      var p = gsap.to(progressFill, {
        width: "100%", ease: "none",
        scrollTrigger: { trigger: "#chapters", start: "top 70%", end: "bottom 50%", scrub: 0.6 }
      });
      if (p && p.scrollTrigger) triggers.push(p.scrollTrigger);
    }

    try { ScrollTrigger.refresh(); } catch (e) {}
  }

  // Lenis + ScrollTrigger sync when both exist
  try {
    if (lenis && typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", function () {
        try { ScrollTrigger.update(); } catch (e) {}
      });
    }
  } catch (e) {}

  // Wait for deferred CDN scripts, then build
  function whenLibsReady(cb, tries) {
    tries = tries || 0;
    var g = (typeof gsap !== "undefined");
    var l = (typeof Lenis !== "undefined") || tries > 14;
    if ((g || tries > 14) && l) { cb(); return; }
    if (tries > 20) { cb(); return; }
    setTimeout(function () { whenLibsReady(cb, tries + 1); }, 250);
  }
  if (document.readyState === "complete") whenLibsReady(buildScrollFX);
  else window.addEventListener("load", function () { whenLibsReady(buildScrollFX); });

  /* ---------- Resize handler ---------- */
  var rT = null;
  window.addEventListener("resize", function () {
    if (rT) clearTimeout(rT);
    rT = setTimeout(function () {
      sizeCanvas();
      buildScrollFX();
      if (canvas && !canvas.hidden && ctx && reduceMotion) drawDots(0);
    }, 220);
  });

  /* ---------- Contact form validation ---------- */
  var form = document.getElementById("contactForm");
  if (form) {
    var fName = document.getElementById("fName");
    var fEmail = document.getElementById("fEmail");
    var fMsg = document.getElementById("fMsg");
    var eName = document.getElementById("eName");
    var eEmail = document.getElementById("eEmail");
    var eMsg = document.getElementById("eMsg");
    var ok = document.getElementById("formOk");

    function setErr(input, el, msg) {
      if (el) el.textContent = msg || "";
      if (input) input.classList.toggle("bad", !!msg);
      return !msg;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v1 = setErr(fName, eName,
        fName.value.trim().length >= 2 ? "" : "Please add your name (2 or more characters).");
      var email = fEmail.value.trim();
      var v2 = setErr(fEmail, eEmail,
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Please add a valid email like you@example.com.");
      var v3 = setErr(fMsg, eMsg,
        fMsg.value.trim().length >= 10 ? "" : "Please add a little detail (10 or more characters).");
      if (ok) ok.hidden = true;
      if (v1 && v2 && v3) {
        if (ok) ok.hidden = false;
        form.reset();
      }
    });
    [fName, fEmail, fMsg].forEach(function (f) {
      if (f) f.addEventListener("input", function () {
        f.classList.remove("bad");
        if (ok) ok.hidden = true;
      });
    });
  }
})();
