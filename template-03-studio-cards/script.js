/* Studio Cards interactions: nav, smooth scroll, reveals, tilt, filter, counters, form, spline fallback */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* Mobile nav */
  var burger = document.getElementById("burger");
  var links = document.getElementById("navLinks");
  if (burger && links) {
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        links.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Lenis smooth scroll, guarded */
  try {
    if (!reduce && typeof window.Lenis !== "undefined") {
      var lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true });
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
  } catch (err) { /* smooth scroll is optional */ }

  /* GSAP reveals, guarded with fallback */
  try {
    if (!reduce && typeof window.gsap !== "undefined") {
      if (typeof window.ScrollTrigger !== "undefined") window.gsap.registerPlugin(window.ScrollTrigger);
      var items = document.querySelectorAll(".reveal");
      if (typeof window.ScrollTrigger !== "undefined") {
        items.forEach(function (el, i) {
          window.gsap.from(el, {
            y: 28, opacity: 0, duration: 0.7, ease: "power3.out",
            delay: (i % 3) * 0.06,
            scrollTrigger: { trigger: el, start: "top 88%" }
          });
        });
      } else {
        window.gsap.from(items, { y: 22, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" });
      }
    }
  } catch (err) { /* reveals optional */ }

  /* Card tilt, desktop pointers only */
  var fine = window.matchMedia("(pointer: fine)").matches;
  if (!reduce && fine) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      var raf = null;
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          card.style.transform = "perspective(900px) rotateY(" + (px * 10).toFixed(2) + "deg) rotateX(" + (-py * 10).toFixed(2) + "deg) translateY(-3px)";
        });
      });
      card.addEventListener("mouseleave", function () {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg)";
      });
    });
  }

  /* Work filter */
  var chips = document.querySelectorAll(".chip");
  var cards = document.querySelectorAll("#cardGrid .card");
  var empty = document.getElementById("emptyMsg");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.classList.remove("on"); });
      chip.classList.add("on");
      var f = chip.getAttribute("data-filter");
      var shown = 0;
      cards.forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split(" ");
        var hit = f === "all" || tags.indexOf(f) !== -1;
        card.classList.toggle("hide", !hit);
        if (hit) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    });
  });

  /* Stat counters */
  var counters = document.querySelectorAll("[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduce) { el.textContent = target; return; }
    var start = null, dur = 1200;
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (0.2 + 0.8 * p * (2 - p)));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + (target === 97 ? "%" : target === 9 ? "+" : "+");
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { io.observe(c); });
  } else {
    counters.forEach(animateCount);
  }

  /* Contact validation */
  var form = document.getElementById("contactForm");
  var ok = document.getElementById("formOk");
  function setErr(id, msg) {
    var small = document.querySelector('[data-err="' + id + '"]');
    var input = document.getElementById(id);
    if (small) small.textContent = msg || "";
    if (input) input.closest(".field").classList.toggle("bad", !!msg);
    return !msg;
  }
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("fName").value.trim();
      var mail = document.getElementById("fMail").value.trim();
      var budget = document.getElementById("fBudget").value;
      var msg = document.getElementById("fMsg").value.trim();
      var v1 = setErr("fName", name.length < 2 ? "Please add your name." : "");
      var v2 = setErr("fMail", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) ? "" : "Please add a valid email.");
      var v3 = setErr("fBudget", budget ? "" : "Choose a budget range.");
      var v4 = setErr("fMsg", msg.length < 12 ? "Add a few words about the project." : "");
      if (v1 && v2 && v3 && v4) {
        if (ok) ok.hidden = false;
        form.querySelector('button[type="submit"]').textContent = "Message ready to send";
      } else if (ok) ok.hidden = true;
    });
    ["fName", "fMail", "fBudget", "fMsg"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", function () { setErr(id, ""); });
    });
  }

  /* Spline fallback: dot field if viewer fails or is slow */
  var viewer = document.getElementById("heroViewer");
  var canvas = document.getElementById("fallback");
  var note = document.getElementById("fallbackNote");
  var loaded = false;
  function dots(staticFrame) {
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    function size() {
      var r = canvas.parentElement.getBoundingClientRect();
      canvas.width = Math.max(300, r.width);
      canvas.height = Math.max(280, r.height);
    }
    size();
    window.addEventListener("resize", size);
    var pts = [];
    for (var i = 0; i < 90; i++) {
      pts.push({ x: Math.random(), y: Math.random(), s: 1 + Math.random() * 2.2, v: 0.0006 + Math.random() * 0.0016, o: 0.25 + Math.random() * 0.6 });
    }
    var t = 0;
    function draw() {
      ctx.fillStyle = "#101018";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      t += 1;
      pts.forEach(function (p) {
        var y = (p.y + t * p.v) % 1;
        ctx.globalAlpha = p.o;
        ctx.fillStyle = (p.s > 2.4) ? "#D6FF3F" : "#3A3A48";
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, y * canvas.height, p.s, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#D6FF3F";
      ctx.beginPath();
      ctx.arc(canvas.width * 0.5 + Math.cos(t / 40) * 26, canvas.height * 0.46 + Math.sin(t / 34) * 20, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0B0B10";
      ctx.beginPath();
      ctx.arc(canvas.width * 0.5 + Math.cos(t / 40) * 26 + 8, canvas.height * 0.46 + Math.sin(t / 34) * 20, 22, 0, Math.PI * 2);
      ctx.fill();
      if (!staticFrame && !reduce && !loaded) requestAnimationFrame(draw);
    }
    draw();
  }
  dots(reduce);
  function markLoaded() {
    loaded = true;
    if (canvas) canvas.style.display = "none";
    if (note) note.textContent = "Live Spline scene";
  }
  if (viewer) {
    viewer.addEventListener("load", markLoaded);
    var check = setInterval(function () {
      try {
        if (viewer.shadowRoot && viewer.shadowRoot.querySelector("canvas")) { markLoaded(); clearInterval(check); }
      } catch (e) { /* cross root check skipped */ }
    }, 800);
    setTimeout(function () {
      clearInterval(check);
      if (!loaded && note) note.textContent = "Preview mode · Spline offline";
      if (!loaded && canvas) canvas.style.display = "block";
    }, 6000);
  }
})();
