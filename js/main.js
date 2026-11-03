// Site behaviour: theme toggle, mobile nav, active links, work filter and scroll reveals
(() => {
  "use strict";

  // Tell the head safety timer that scripts are running
  window.zlReady = true;

  // Light and dark theme toggle, starting from the system setting
  const root = document.documentElement;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const currentTheme = () => root.dataset.theme || (systemDark.matches ? "dark" : "light");
  const themeToggle = document.querySelector(".theme-toggle");

  if (themeToggle) {
    const setLabel = () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      themeToggle.setAttribute("aria-label", `Switch to ${next} theme`);
    };
    setLabel();
    systemDark.addEventListener("change", setLabel);

    // Keep the browser chrome colour in step with the chosen theme
    const setBarColor = () => {
      const color = currentTheme() === "dark" ? "#11111b" : "#eff1f5";
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", color));
    };
    if (root.dataset.theme) setBarColor();

    themeToggle.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      root.classList.add("theme-switching");
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
      setLabel();
      setBarColor();
      setTimeout(() => root.classList.remove("theme-switching"), 400);
    });
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

  // Filter the project index on the work page
  const filterBar = document.querySelector(".filter-bar");
  if (filterBar) {
    const rows = document.querySelectorAll(".index [data-category]");
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
        group.hidden = !group.querySelector("[data-category]:not([hidden])");
      });

      if (status) status.textContent = `Showing ${shown} ${shown === 1 ? "project" : "projects"}.`;
    });
  }

  // Review spotlight: one big review at a time, avatar picker, arrows, swipe and timed autoplay
  document.querySelectorAll("[data-spotlight]").forEach((spot) => {
    const slides = Array.from(spot.querySelectorAll("[data-slide]"));
    const thumbs = Array.from(spot.querySelectorAll("[data-thumb]"));
    const current = spot.querySelector("[data-current]");
    const timer = spot.querySelector(".spotlight__timer span");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = 7000;
    let active = 0;
    let clock;

    const show = (i) => {
      active = (i + slides.length) % slides.length;
      slides.forEach((slide, n) => {
        slide.classList.toggle("is-active", n === active);
        slide.toggleAttribute("aria-hidden", n !== active);
      });
      thumbs.forEach((thumb, n) => thumb.toggleAttribute("aria-current", n === active));
      thumbs[active].setAttribute("aria-current", "true");
      const strip = thumbs[active].parentElement;
      strip.scrollTo({ left: thumbs[active].offsetLeft - strip.clientWidth / 2 + thumbs[active].offsetWidth / 2, behavior: still ? "auto" : "smooth" });
      current.textContent = String(active + 1);
      restart();
    };

    // Restart the progress line and the timer for the next review
    const restart = () => {
      clearTimeout(clock);
      if (still) return;
      spot.classList.remove("is-running");
      void timer.offsetWidth;
      spot.classList.add("is-running");
      clock = setTimeout(tick, delay);
    };

    const tick = () => {
      const box = spot.getBoundingClientRect();
      const onScreen = box.top < window.innerHeight && box.bottom > 0;
      if (spot.classList.contains("is-paused") || !onScreen || document.hidden) {
        clock = setTimeout(tick, 1000);
        return;
      }
      show(active + 1);
    };

    spot.style.setProperty("--spotlight-time", `${delay}ms`);
    spot.querySelector("[data-prev]").addEventListener("click", () => show(active - 1));
    spot.querySelector("[data-next]").addEventListener("click", () => show(active + 1));
    thumbs.forEach((thumb, n) => thumb.addEventListener("click", () => show(n)));
    spot.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") show(active + 1);
      if (e.key === "ArrowLeft") show(active - 1);
    });

    // Pause while the visitor is reading or using the controls
    const pause = () => spot.classList.add("is-paused");
    const resume = () => spot.classList.remove("is-paused");
    spot.addEventListener("mouseenter", pause);
    spot.addEventListener("mouseleave", resume);
    spot.addEventListener("focusin", pause);
    spot.addEventListener("focusout", resume);

    // Swipe left or right on touch screens
    let startX = null;
    const stage = spot.querySelector(".spotlight__stage");
    stage.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
    stage.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) show(active + (dx < 0 ? 1 : -1));
      startX = null;
    });

    restart();
  });

  // Fade elements in as they scroll into view
  const revealTargets = document.querySelectorAll(".reveal");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach((el) => observer.observe(el));
  }
})();
