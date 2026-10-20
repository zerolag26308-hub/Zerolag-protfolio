// Site behaviour: header, mobile nav, active links, work filter, scroll progress and motion
(() => {
  "use strict";

  // Tell the head safety timer that scripts are running
  window.zlReady = true;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Add a shadow to the header once the page scrolls
  const header = document.querySelector(".site-header");
  if (header) {
    const setScrolled = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  }

  // Mobile navigation with focus trap and Escape to close
  const navToggle = document.querySelector(".nav-toggle");
  const mobileNav = document.querySelector(".mobile-nav");

  if (navToggle && mobileNav) {
    const focusable = () => Array.from(mobileNav.querySelectorAll("a[href], button:not([disabled])"));
    const desktopQuery = window.matchMedia("(min-width: 961px)");

    const openNav = () => {
      mobileNav.classList.add("is-open");
      mobileNav.removeAttribute("inert");
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "Close menu");
      document.body.classList.add("nav-open");
      focusable()[0]?.focus();
    };

    const closeNav = (returnFocus = true) => {
      mobileNav.classList.remove("is-open");
      mobileNav.setAttribute("inert", "");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
      document.body.classList.remove("nav-open");
      if (returnFocus) navToggle.focus();
    };

    navToggle.addEventListener("click", () => {
      mobileNav.classList.contains("is-open") ? closeNav() : openNav();
    });

    mobileNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeNav(false)));

    desktopQuery.addEventListener("change", (e) => {
      if (e.matches && mobileNav.classList.contains("is-open")) closeNav(false);
    });

    document.addEventListener("keydown", (e) => {
      if (!mobileNav.classList.contains("is-open")) return;
      if (e.key === "Escape") closeNav();
      if (e.key !== "Tab") return;

      const items = [navToggle, ...focusable()];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  // Mark the current page in both navs
  const page = window.location.pathname.split("/").pop() || "index.html";
  const section = window.location.pathname.includes("/case-studies/") ? "work.html" : page;
  document.querySelectorAll(".nav-primary a, .mobile-nav__links a").forEach((link) => {
    const target = link.getAttribute("href").split("/").pop();
    if (target === section) link.setAttribute("aria-current", "page");
  });

  // Filter the concept index on the work page
  const filterBar = document.querySelector(".filter-bar");
  if (filterBar) {
    const rows = document.querySelectorAll(".index-row[data-category]");
    const groups = document.querySelectorAll(".index-group");
    const status = document.querySelector("[data-filter-status]");

    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;

      filterBar.querySelectorAll(".filter-btn").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      const filter = btn.dataset.filter;
      let shown = 0;

      rows.forEach((row) => {
        const match = filter === "all" || row.dataset.category.split(" ").includes(filter);
        row.hidden = !match;
        if (match) shown += 1;
      });

      groups.forEach((group) => {
        group.hidden = !group.querySelector(".index-row:not([hidden])");
      });

      if (status) status.textContent = `Showing ${shown} concept ${shown === 1 ? "build" : "builds"}.`;
    });
  }

  // Thin progress line under the header that tracks page scroll
  if (header) {
    const bar = document.createElement("span");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    header.appendChild(bar);
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty("--progress", max > 0 ? Math.min(window.scrollY / max, 1).toFixed(4) : 0);
      ticking = false;
    };
    update();
    window.addEventListener("scroll", () => {
      if (!ticking) requestAnimationFrame(update);
      ticking = true;
    }, { passive: true });
  }

  // Soft light that follows the cursor across cards
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".card, .list-card, .team-card, .work-card__media, .board, .form-card, .checklist").forEach((el) => {
      el.classList.add("spotlight");
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  // Stagger reveals that sit side by side in the same container
  document.querySelectorAll(".reveal").forEach((el) => {
    const siblings = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
    const index = siblings.indexOf(el);
    if (index > 0) el.style.setProperty("--d", Math.min(index, 6));
  });
  document.querySelectorAll(".steps").forEach((list) => {
    Array.from(list.children).forEach((step, i) => step.style.setProperty("--d", i));
  });

  // Split page headlines into words so they can rise in one after another
  const headlines = document.querySelectorAll(".hero__title, .page-hero .h1, .case-hero .h1, .not-found h1");
  if (!reduceMotion) {
    headlines.forEach((h) => {
      h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim());
      let wi = 0;
      const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);
      textNodes.forEach((node) => {
        const frag = document.createDocumentFragment();
        node.textContent.split(/([ \t\n]+)/).forEach((part) => {
          if (!part) return;
          if (/^[ \t\n]+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }
          const word = document.createElement("span");
          word.className = "split-word";
          word.setAttribute("aria-hidden", "true");
          word.style.setProperty("--wi", wi++);
          word.textContent = part;
          frag.appendChild(word);
        });
        node.replaceWith(frag);
      });
      h.classList.remove("reveal");
      h.classList.add("is-split");
    });
  }

  // Count small numbers up (or down to zero) when they come into view
  const counters = Array.from(document.querySelectorAll(".fact strong")).filter((el) => /^\d+$/.test(el.textContent.trim()));
  const runCounter = (el) => {
    const text = el.textContent.trim();
    const end = parseInt(text, 10);
    const start = end === 0 ? 9 : 0;
    const width = text.length;
    const duration = 1200;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(start + (end - start) * eased)).padStart(width, "0");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Reveal elements, draw highlights and run counters as they scroll into view
  const revealTargets = document.querySelectorAll(".reveal");
  const drawTargets = document.querySelectorAll(".accent-text, .cta__title em, .steps");
  const splitTargets = document.querySelectorAll(".is-split");
  const show = (el) => {
    if (el.classList.contains("reveal")) el.classList.add("is-visible");
    if (el.classList.contains("is-split")) el.classList.add("is-in");
    if (el.matches(".accent-text, .cta__title em, .steps")) el.classList.add("is-drawn");
    if (counters.includes(el) && !reduceMotion) runCounter(el);
  };
  const all = [...revealTargets, ...drawTargets, ...splitTargets, ...counters];

  if (reduceMotion || !("IntersectionObserver" in window)) {
    all.forEach((el) => {
      if (el.classList.contains("reveal")) el.classList.add("is-visible");
      if (el.matches(".accent-text, .cta__title em, .steps")) el.classList.add("is-drawn");
    });
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          show(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    all.forEach((el) => observer.observe(el));

    // Play the top-of-page intro straight away instead of waiting for the observer
    setTimeout(() => {
      document.querySelectorAll(".hero, .page-hero, .case-hero, .not-found").forEach((intro) => {
        intro.querySelectorAll(".reveal, .is-split, .accent-text").forEach(show);
      });
    }, 40);
  }
})();
