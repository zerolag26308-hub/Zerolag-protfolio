// Dark/light theme toggle: syncs with the anti-flash inline script in <head>,
// persists choice in localStorage, and follows the OS setting until a user chooses.
(() => {
  "use strict";

  const STORAGE_KEY = "zerolag-theme";
  const root = document.documentElement;
  const toggles = document.querySelectorAll(".theme-toggle");

  const labelFor = (theme) =>
    theme === "light" ? "Switch to dark theme" : "Switch to light theme";

  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    toggles.forEach((btn) => {
      btn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      btn.setAttribute("aria-label", labelFor(theme));
    });
  };

  // Sync toggle buttons with whatever the head script already set (avoids flash).
  applyTheme(root.getAttribute("data-theme") || "dark");

  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      window.dispatchEvent(new CustomEvent("zerolag:themechange", { detail: { theme: next } }));
    });
  });

  if (window.matchMedia) {
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    mql.addEventListener("change", (e) => {
      if (localStorage.getItem(STORAGE_KEY)) return;
      const theme = e.matches ? "light" : "dark";
      applyTheme(theme);
      window.dispatchEvent(new CustomEvent("zerolag:themechange", { detail: { theme } }));
    });
  }
})();
