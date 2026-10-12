/* Shop Stage interactions. All motion libraries are optional and guarded. */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Nav hamburger */
  var burger = document.getElementById("hamburger");
  var links = document.getElementById("navlinks");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Smooth scroll via Lenis, guarded */
  try {
    if (!reduceMotion && typeof Lenis !== "undefined") {
      var lenis = new Lenis({ duration: 1.1 });
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
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
  } catch (err) { /* keep native scroll */ }

  /* Variant buttons restyle the stage frame via GSAP, guarded */
  var frame = document.getElementById("stageFrame");
  var pill = document.getElementById("stagePill");
  var variantName = document.getElementById("variantName");
  var priceValue = document.getElementById("priceValue");
  var orderVariant = document.getElementById("fVariant");
  var prices = { porcelain: 349, graphite: 369, indigo: 389 };
  var labels = { porcelain: "Porcelain", graphite: "Graphite", indigo: "Indigo" };
  var hasGsap = typeof gsap !== "undefined";

  function paintFrame(color) {
    if (!frame) return;
    if (hasGsap && !reduceMotion) {
      gsap.to(frame, { borderColor: color, duration: 0.45, ease: "power2.out" });
      gsap.fromTo(frame, { scale: 0.985 }, { scale: 1, duration: 0.45, ease: "power2.out" });
    } else {
      frame.style.borderColor = color;
    }
  }

  document.querySelectorAll(".variant").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".variant").forEach(function (b) {
        b.classList.remove("isActive");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("isActive");
      btn.setAttribute("aria-pressed", "true");
      var key = btn.getAttribute("data-variant");
      paintFrame(btn.getAttribute("data-frame"));
      if (pill) pill.textContent = labels[key] + " finish";
      if (variantName) variantName.textContent = labels[key];
      if (priceValue) priceValue.textContent = "$" + prices[key];
      if (orderVariant) orderVariant.value = labels[key];
    });
  });

  /* Scroll scrub for highlight cards, guarded */
  try {
    if (!reduceMotion && hasGsap && typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
      gsap.utils.toArray("[data-scrub]").forEach(function (card, i) {
        gsap.fromTo(card, { y: 60, opacity: 0.2 }, {
          y: 0, opacity: 1, ease: "none",
          scrollTrigger: { trigger: card, start: "top 92%", end: "top 55%", scrub: 1 }
        });
      });
      gsap.utils.toArray(".tier").forEach(function (card, i) {
        gsap.from(card, {
          y: 40, opacity: 0, duration: 0.7, delay: i * 0.08, ease: "power2.out",
          scrollTrigger: { trigger: "#pricing", start: "top 75%" }
        });
      });
    }
  } catch (err) { /* static cards remain visible */ }

  /* Counters */
  var counters = document.querySelectorAll("[data-count]");
  var counterDone = false;
  function runCounters() {
    if (counterDone) return;
    counterDone = true;
    counters.forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      if (reduceMotion || !hasGsap) { el.textContent = target.toLocaleString(); return; }
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.4, ease: "power2.out",
        onUpdate: function () { el.textContent = Math.round(obj.v).toLocaleString(); }
      });
    });
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCounters(); io.disconnect(); } });
    }, { threshold: 0.3 });
    var spec = document.getElementById("specs");
    if (spec) io.observe(spec); else runCounters();
  } else { runCounters(); }

  /* Pricing tier buttons update order summary */
  var summaryTier = document.getElementById("summaryTier");
  var summaryPrice = document.getElementById("summaryPrice");
  document.querySelectorAll("[data-tier]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (summaryTier) summaryTier.textContent = btn.getAttribute("data-tier");
      if (summaryPrice) summaryPrice.textContent = "$" + btn.getAttribute("data-price");
      var order = document.getElementById("order");
      if (order) order.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* Order form validation */
  var form = document.getElementById("orderForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      var name = document.getElementById("fName");
      var email = document.getElementById("fEmail");
      var qty = document.getElementById("fQty");
      function flag(input, valid) {
        var msg = document.querySelector('[data-error="' + input.id + '"]');
        if (msg) msg.hidden = valid;
        input.setAttribute("aria-invalid", valid ? "false" : "true");
        if (!valid) ok = false;
      }
      flag(name, name.value.trim().length > 1);
      flag(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()));
      var q = parseInt(qty.value, 10);
      flag(qty, q >= 1 && q <= 9);
      var done = document.getElementById("formOk");
      if (ok && done) {
        done.hidden = false;
        form.reset();
        qty.value = "1";
      } else if (done) { done.hidden = true; }
    });
  }

  /* Spline fallback: illustrated 2D canvas if viewer fails within 6s */
  var splineEl = document.getElementById("splineEl");
  var canvas = document.getElementById("fallbackCanvas");
  var note = document.getElementById("splineNote");
  var settled = false;
  function showFallback(reason) {
    if (settled) return;
    settled = true;
    if (splineEl) splineEl.style.display = "none";
    if (!canvas) return;
    canvas.hidden = false;
    if (note) note.hidden = false;
    drawFallback();
  }
  function drawFallback() {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    function size() {
      var r = canvas.parentElement.getBoundingClientRect();
      canvas.width = Math.max(300, r.width);
      canvas.height = Math.max(300, r.height);
    }
    size();
    window.addEventListener("resize", size);
    var t = 0;
    function frame2d() {
      t += 0.02;
      var w = canvas.width, h = canvas.height;
      ctx.fillStyle = "#14161C";
      ctx.fillRect(0, 0, w, h);
      /* pedestal rings */
      ctx.strokeStyle = "rgba(79,70,229,.55)";
      ctx.lineWidth = 2;
      for (var i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.72, 90 + i * 34 + Math.sin(t + i) * 6, 26 + i * 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      /* chair abstraction */
      var bob = Math.sin(t) * 8;
      ctx.fillStyle = "#F4F2EC";
      ctx.beginPath();
      ctx.roundRect(w / 2 - 70, h * 0.34 + bob, 140, 110, 26);
      ctx.fill();
      ctx.fillStyle = "#4F46E5";
      ctx.beginPath();
      ctx.roundRect(w / 2 - 70, h * 0.34 + bob, 140, 26, 13);
      ctx.fill();
      ctx.fillStyle = "#2A2E37";
      ctx.fillRect(w / 2 - 58, h * 0.34 + 118 + bob, 12, 60);
      ctx.fillRect(w / 2 + 46, h * 0.34 + 118 + bob, 12, 60);
      if (!reduceMotion) requestAnimationFrame(frame2d);
    }
    if (reduceMotion) { t = 1; frame2d(); } else { frame2d(); }
  }
  if (splineEl) {
    splineEl.addEventListener("error", function () { showFallback("error"); });
    setTimeout(function () {
      /* If the viewer has no rendered shadow root content, fall back */
      var hasContent = splineEl.shadowRoot && splineEl.shadowRoot.children.length > 0;
      if (!hasContent) showFallback("timeout");
      else settled = true;
    }, 6000);
  } else { showFallback("missing"); }
})();
