// Scroll reveals, hero entrance, ambient hero field, optional custom cursor
(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* Preloader — homepage only, capped so it never blocks perceived load */
  const preloader = document.getElementById("preloader");
  if (preloader) {
    const hidePreloader = () => {
      preloader.classList.add("is-hidden");
      setTimeout(() => preloader.remove(), 600);
    };
    const minDelay = prefersReducedMotion ? 0 : 350;
    if (document.readyState === "complete") {
      setTimeout(hidePreloader, minDelay);
    } else {
      window.addEventListener("load", () => setTimeout(hidePreloader, minDelay));
    }
    // Safety net: never let the preloader hide content for more than 2s
    setTimeout(hidePreloader, 2000);
  }

  /* Hero entrance sequence */
  const heroEls = document.querySelectorAll(
    ".hero__eyebrow, .hero__heading, .hero__lede, .hero__actions"
  );

  if (heroEls.length) {
    heroEls.forEach((el, i) => {
      window.setTimeout(() => {
        el.classList.add("is-revealed");
      }, prefersReducedMotion ? 0 : 120 + i * 140);
    });
  }

  /* Scroll reveal via IntersectionObserver */
  const revealTargets = document.querySelectorAll(".reveal, .reveal-stagger");

  if (revealTargets.length) {
    if (prefersReducedMotion) {
      revealTargets.forEach((el) => el.classList.add("is-visible"));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
      );

      revealTargets.forEach((el) => observer.observe(el));
    }
  }

  /* Process timeline — highlight the step nearest the viewport center while scrolling */
  const processItems = document.querySelectorAll(".process-item");

  if (processItems.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-active", entry.isIntersecting);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    processItems.forEach((el) => spy.observe(el));
  }

  /* Ambient hero field — quiet drifting node lattice, canvas-based */
  const canvas = document.querySelector(".hero__field canvas");

  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d");
    let width, height, points, rafId;
    const DENSITY = 60000;

    const NODE_COLORS_DARK = ["0, 212, 255", "14, 165, 233", "3, 105, 161"];
    const NODE_COLORS_LIGHT = ["0, 123, 148", "12, 111, 168", "8, 76, 120"];
    let nodeColors = NODE_COLORS_DARK;
    const setDotColor = () => {
      nodeColors =
        document.documentElement.getAttribute("data-theme") === "light"
          ? NODE_COLORS_LIGHT
          : NODE_COLORS_DARK;
    };
    setDotColor();
    window.addEventListener("zerolag:themechange", setDotColor);

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width * window.devicePixelRatio;
      height = canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";

      const count = Math.min(70, Math.floor((rect.width * rect.height) / DENSITY));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15 * window.devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.15 * window.devicePixelRatio,
        c: Math.floor(Math.random() * 3),
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      points.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      });

      const linkDist = 160 * window.devicePixelRatio;

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            ctx.strokeStyle = `rgba(${nodeColors[points[i].c]}, ${0.16 * (1 - dist / linkDist)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }

      points.forEach((p) => {
        ctx.fillStyle = `rgba(${nodeColors[p.c]}, 0.6)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cancelAnimationFrame(rafId);
        resize();
        draw();
      }, 200);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        draw();
      }
    });
  }

  /* Custom cursor — desktop pointer devices only */
  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (supportsHover && !prefersReducedMotion) {
    const dot = document.createElement("div");
    const ring = document.createElement("div");
    const ringLabel = document.createElement("span");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    ringLabel.className = "cursor-ring__label";
    ringLabel.textContent = "View";
    ring.append(ringLabel);
    dot.style.opacity = "0";
    ring.style.opacity = "0";
    document.body.append(dot, ring);

    let targetX = 0,
      targetY = 0,
      ringX = 0,
      ringY = 0;
    const TRAIL_EASE = 0.16;

    window.addEventListener("mousemove", (e) => {
      dot.style.opacity = "1";
      ring.style.opacity = "1";
      dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      targetX = e.clientX;
      targetY = e.clientY;
    });

    const animateRing = () => {
      ringX += (targetX - ringX) * TRAIL_EASE;
      ringY += (targetY - ringY) * TRAIL_EASE;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    };
    animateRing();

    document.querySelectorAll("a:not(.work-card), button").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        ring.style.width = "50px";
        ring.style.height = "50px";
      });
      el.addEventListener("mouseleave", () => {
        ring.style.width = "34px";
        ring.style.height = "34px";
      });
    });

    document.querySelectorAll(".work-card").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        ring.classList.add("cursor-ring--label");
      });
      el.addEventListener("mouseleave", () => {
        ring.classList.remove("cursor-ring--label");
        ring.style.width = "";
        ring.style.height = "";
      });
    });

    document.addEventListener("mouseleave", () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    });
  }

  /* 3D tilt on cards — desktop pointer devices only */
  if (supportsHover && !prefersReducedMotion) {
    const TILT_MAX = 7;
    document.querySelectorAll(".work-card, .tilt-card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-py * TILT_MAX).toFixed(2)}deg) rotateY(${(px * TILT_MAX).toFixed(2)}deg)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* Magnetic buttons — desktop pointer devices only, subtle pull toward cursor */
  if (supportsHover && !prefersReducedMotion) {
    const PULL = 0.28;
    document.querySelectorAll(".button-primary").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * PULL}px, ${y * PULL}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }
})();
