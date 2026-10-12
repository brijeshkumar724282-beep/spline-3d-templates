/* Hub navigator: dependency free. Hamburger, smooth scroll, reveals, accordion. */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* Smooth scroll for anchors */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id && id.length > 1) {
        var el = document.querySelector(id);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        }
      }
    });
  });

  /* Scroll reveals */
  var items = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* FAQ accordion: one open at a time */
  var accItems = document.querySelectorAll(".accItem");
  accItems.forEach(function (item) {
    var btn = item.querySelector(".accBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      accItems.forEach(function (other) {
        other.classList.remove("open");
        var b = other.querySelector(".accBtn");
        if (b) b.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });
})();
