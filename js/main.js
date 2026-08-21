// Core site behavior: header state, mobile nav, active links, smooth scroll, portfolio filter
(() => {
  "use strict";

  /* Sticky header state on scroll */
  const header = document.querySelector(".site-header");
  if (header) {
    const setScrolled = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  }

  /* Mobile navigation */
  const navToggle = document.querySelector(".nav-toggle");
  const mobileNav = document.querySelector(".mobile-nav");

  if (navToggle && mobileNav) {
    const focusableSelector =
      "a[href], button:not([disabled])";
    let lastFocused = null;

    const openNav = () => {
      lastFocused = document.activeElement;
      mobileNav.classList.add("is-open");
      navToggle.setAttribute("aria-expanded", "true");
      mobileNav.removeAttribute("inert");
      document.body.classList.add("nav-open");
      const firstLink = mobileNav.querySelector(focusableSelector);
      if (firstLink) firstLink.focus();
    };

    const closeNav = () => {
      mobileNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      mobileNav.setAttribute("inert", "");
      document.body.classList.remove("nav-open");
      if (lastFocused) lastFocused.focus();
    };

    navToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.contains("is-open");
      isOpen ? closeNav() : openNav();
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileNav.classList.contains("is-open")) {
        closeNav();
      }

      /* trap focus while menu is open */
      if (e.key === "Tab" && mobileNav.classList.contains("is-open")) {
        const focusable = Array.from(
          mobileNav.querySelectorAll(focusableSelector)
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* Active nav link based on current page */
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-primary a, .mobile-nav__links a").forEach((link) => {
    const linkPath = link.getAttribute("href");
    if (linkPath === currentPath || (currentPath === "" && linkPath === "index.html")) {
      link.setAttribute("aria-current", "page");
    }
  });

  /* Smooth scroll for in-page anchors */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (targetId.length < 2) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });
  });

  /* Portfolio filter (work.html) */
  const filterBar = document.querySelector(".filter-bar");
  const workCards = document.querySelectorAll("[data-category]");

  if (filterBar && workCards.length) {
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;

      filterBar.querySelectorAll(".filter-btn").forEach((b) =>
        b.setAttribute("aria-pressed", "false")
      );
      btn.setAttribute("aria-pressed", "true");

      const filter = btn.dataset.filter;

      workCards.forEach((card) => {
        const categories = card.dataset.category.split(" ");
        const matches = filter === "all" || categories.includes(filter);
        card.hidden = !matches;
      });

      /* hide a category heading when every card underneath it is filtered out */
      document.querySelectorAll(".work-category").forEach((group) => {
        const cards = group.querySelectorAll(".work-card");
        const anyVisible = Array.from(cards).some((card) => !card.hidden);
        group.hidden = !anyVisible;
      });
    });
  }

  /* FAQ accordion */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const question = item.querySelector(".faq-item__question");
    const answer = item.querySelector(".faq-item__answer");
    if (!question || !answer) return;

    answer.style.height = "0px";

    question.addEventListener("click", () => {
      const isOpen = question.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        answer.style.height = answer.scrollHeight + "px";
        requestAnimationFrame(() => {
          answer.style.height = "0px";
        });
        question.setAttribute("aria-expanded", "false");
      } else {
        answer.style.height = answer.scrollHeight + "px";
        question.setAttribute("aria-expanded", "true");
        answer.addEventListener(
          "transitionend",
          function handler() {
            if (question.getAttribute("aria-expanded") === "true") {
              answer.style.height = "auto";
            }
            answer.removeEventListener("transitionend", handler);
          }
        );
      }
    });
  });

  /* Footer newsletter signup */
  document.querySelectorAll("[data-newsletter-form]").forEach((form) => {
    const status = form.parentElement.querySelector(".footer-newsletter__status");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type='email']");
      if (!input.value.trim()) return;
      if (status) {
        status.textContent = "Not connected to a live list yet — email hello@zerolag.io to get updates.";
      }
      form.reset();
    });
  });

  /* Technology engine tabs (index.html + technology.html) */
  const techTabs = document.querySelectorAll("[data-tech-tab]");
  if (techTabs.length) {
    const panels = document.querySelectorAll(".tech-engine__panel");

    const activateTech = (key) => {
      techTabs.forEach((tab) => {
        tab.setAttribute("aria-selected", tab.dataset.techTab === key ? "true" : "false");
      });
      panels.forEach((panel) => {
        panel.hidden = panel.id !== `tech-panel-${key}`;
      });
    };

    techTabs.forEach((tab) => {
      tab.addEventListener("click", () => activateTech(tab.dataset.techTab));
    });

    document.querySelectorAll('[role="tablist"]').forEach((list) => {
      list.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const tabs = Array.from(list.querySelectorAll("[data-tech-tab]"));
        const current = tabs.indexOf(document.activeElement);
        if (current === -1) return;
        e.preventDefault();
        const next =
          e.key === "ArrowRight"
            ? (current + 1) % tabs.length
            : (current - 1 + tabs.length) % tabs.length;
        tabs[next].focus();
        activateTech(tabs[next].dataset.techTab);
      });
    });
  }

  /* Testimonial slider */
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-testimonial-slider]").forEach((slider) => {
    const track = slider.querySelector(".testimonial-slider__track");
    const slides = Array.from(track.children);
    const dotsWrap = slider.querySelector(".testimonial-slider__dots");
    const prevBtn = slider.querySelector("[data-slider-prev]");
    const nextBtn = slider.querySelector("[data-slider-next]");
    let index = 0;

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "testimonial-slider__dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Go to testimonial ${i + 1}`);
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, di) => d.setAttribute("aria-current", di === index ? "true" : "false"));
    }
    goTo(0);

    prevBtn && prevBtn.addEventListener("click", () => goTo(index - 1));
    nextBtn && nextBtn.addEventListener("click", () => goTo(index + 1));

    slider.setAttribute("tabindex", "0");
    slider.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "ArrowRight") goTo(index + 1);
    });

    let startX = null;
    track.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
      },
      { passive: true }
    );
    track.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) > 40) goTo(diff > 0 ? index - 1 : index + 1);
      startX = null;
    });

    if (slides.length > 1 && !prefersReducedMotion) {
      let autoplay = setInterval(() => goTo(index + 1), 7000);
      const stop = () => clearInterval(autoplay);
      const restart = () => {
        stop();
        autoplay = setInterval(() => goTo(index + 1), 7000);
      };
      slider.addEventListener("mouseenter", stop);
      slider.addEventListener("mouseleave", restart);
      slider.addEventListener("focusin", stop);
      slider.addEventListener("focusout", restart);
    }
  });
})();
