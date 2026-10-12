/* Nebula Hero — guarded motion, spline fallback, form validation. No hard CDN dependency. */
(function () {
  "use strict";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById("hamburger");
  var menu = document.getElementById("mobileMenu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      menu.hidden = !open;
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("open");
        menu.hidden = true;
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Lenis smooth scroll (guarded) ---------- */
  try {
    if (!reduced && typeof window.Lenis !== "undefined") {
      var lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener("click", function (e) {
          var id = a.getAttribute("href");
          if (id.length > 1) {
            var el = document.querySelector(id);
            if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -70 }); }
          }
        });
      });
    }
  } catch (e) { /* motion optional */ }

  /* ---------- GSAP intro + reveals (guarded, IO fallback) ---------- */
  var reveals = document.querySelectorAll(".reveal");
  try {
    if (!reduced && typeof window.gsap !== "undefined") {
      if (typeof window.ScrollTrigger !== "undefined" && window.gsap.registerPlugin) {
        window.gsap.registerPlugin(window.ScrollTrigger);
      }
      window.gsap.set(".heroCopy .reveal", { y: 26, opacity: 0 });
      window.gsap.set(".stageWrap.reveal, .stageWrap .reveal", { y: 26, opacity: 0 });
      var tl = window.gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(".heroCopy .reveal", { y: 0, opacity: 1, duration: 0.8, stagger: 0.1 })
        .to(".stageWrap.reveal", { y: 0, opacity: 1, duration: 0.9 }, "-=0.5");
      if (typeof window.ScrollTrigger !== "undefined") {
        window.gsap.utils.toArray(".logos .reveal, .features .reveal, .closing .reveal").forEach(function (el) {
          window.gsap.fromTo(el, { y: 28, opacity: 0 }, {
            y: 0, opacity: 1, duration: 0.7, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" }
          });
        });
      }
      return afterMotion();
    }
  } catch (e) { /* fall through to IO */ }
  // IntersectionObserver fallback (also used when reduced motion: instant show)
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.style.transition = "opacity .6s ease, transform .6s ease";
          en.target.style.opacity = "1";
          en.target.style.transform = "none";
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) {
      el.style.opacity = "0";
      el.style.transform = "translateY(18px)";
      io.observe(el);
    });
  }
  afterMotion();

  /* ---------- Spline fallback: canvas dots if viewer fails within 6s ---------- */
  function afterMotion() { initSplineGuard(); initForm(); }

  function splineAlive() {
    var v = document.getElementById("splineViewer");
    if (!v) return false;
    if (window.customElements && !window.customElements.get("spline-viewer")) return false;
    try {
      if (v.shadowRoot && v.shadowRoot.querySelector("canvas")) return true;
      // Some builds render canvas without shadow query; treat sized element as alive
      if (v.clientHeight > 40 && v.childNodes.length > 0) return true;
    } catch (e) { return false; }
    return false;
  }

  function initSplineGuard() {
    var viewer = document.getElementById("splineViewer");
    var canvas = document.getElementById("fallbackCanvas");
    var note = document.getElementById("stageFallback");
    var failed = false;

    function showFallback() {
      if (failed) return;
      failed = true;
      if (viewer) viewer.style.display = "none";
      if (canvas) { canvas.hidden = false; startDots(canvas); }
      if (note) note.hidden = false;
    }

    if (viewer) {
      viewer.addEventListener("error", showFallback);
      // If the CDN script is blocked, viewer stays unresolved
      setTimeout(function () {
        if (!splineAlive()) showFallback();
      }, 6000);
    } else {
      showFallback();
    }
    // Keep canvas sized
    window.addEventListener("resize", function () {
      if (canvas && !canvas.hidden) sizeCanvas(canvas);
    });
  }

  function sizeCanvas(c) {
    var r = c.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.max(300, Math.floor(r.width * dpr));
    c.height = Math.floor(380 * dpr);
  }

  function startDots(c) {
    sizeCanvas(c);
    var ctx = c.getContext("2d");
    if (reduced) {
      paintStatic(ctx, c);
      return;
    }
    var n = 70, pts = [];
    for (var i = 0; i < n; i++) {
      pts.push({
        x: Math.random() * c.width, y: Math.random() * c.height,
        vx: (Math.random() - 0.5) * 0.7, vy: (Math.random() - 0.5) * 0.7,
        r: 1 + Math.random() * 2.4,
        coral: Math.random() < 0.28
      });
    }
    (function frame() {
      if (c.hidden) return;
      ctx.fillStyle = "#121A32";
      ctx.fillRect(0, 0, c.width, c.height);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > c.width) p.vx *= -1;
        if (p.y < 0 || p.y > c.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (window.devicePixelRatio || 1), 0, Math.PI * 2);
        ctx.fillStyle = p.coral ? "#FF6B57" : "rgba(255,255,255,0.75)";
        ctx.fill();
      }
      // links
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for (var a = 0; a < pts.length; a++) {
        for (var b = a + 1; b < pts.length; b++) {
          var dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y;
          if (dx * dx + dy * dy < 9000) {
            ctx.beginPath();
            ctx.moveTo(pts[a].x, pts[a].y);
            ctx.lineTo(pts[b].x, pts[b].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(frame);
    })();
  }

  function paintStatic(ctx, c) {
    ctx.fillStyle = "#121A32";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#FF6B57";
    for (var i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * c.width, Math.random() * c.height, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---------- Contact form validation ---------- */
  function initForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;
    var name = document.getElementById("fName");
    var email = document.getElementById("fEmail");
    var msg = document.getElementById("fMsg");
    var ok = document.getElementById("formOk");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;
      valid = check(name, document.getElementById("errName"), name.value.trim().length >= 2) && valid;
      valid = check(email, document.getElementById("errEmail"), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && valid;
      valid = check(msg, document.getElementById("errMsg"), msg.value.trim().length >= 10) && valid;
      if (ok) ok.hidden = true;
      if (valid) {
        if (ok) ok.hidden = false;
        form.reset();
      }
    });
    function check(input, err, good) {
      if (err) err.hidden = good;
      input.setAttribute("aria-invalid", good ? "false" : "true");
      input.style.borderColor = good ? "" : "#FF6B57";
      return good;
    }
  }
})();
