// Contact form validation and submission handling
// NOTE: there is no backend wired up yet. Swap the TODO block below for a
// real API/email-service call (fetch to an endpoint, Formspree, etc.) when one exists.
(() => {
  "use strict";

  const form = document.querySelector("#project-form");
  if (!form) return;

  const status = form.querySelector(".form-status");
  const submitBtn = form.querySelector('button[type="submit"]');

  const validators = {
    name: (v) => v.trim().length >= 2 || "Please enter your full name.",
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ||
      "Please enter a valid email address.",
    message: (v) =>
      v.trim().length >= 20 ||
      "Please tell us a little more about your project (20 characters min).",
  };

  const showFieldError = (field, message) => {
    const wrapper = field.closest(".form-field");
    const errorEl = wrapper?.querySelector(".form-field__error");
    field.setAttribute("data-touched", "true");
    if (errorEl) errorEl.textContent = message === true ? "" : message;
  };

  const validateField = (field) => {
    const rule = validators[field.name];
    if (!rule) return true;
    const result = rule(field.value);
    showFieldError(field, result === true ? "" : result);
    return result === true;
  };

  form.querySelectorAll("input, textarea, select").forEach((field) => {
    field.addEventListener("blur", () => {
      if (validators[field.name]) validateField(field);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "form-status";
    status.textContent = "";

    const requiredFields = form.querySelectorAll("[required]");
    let isValid = true;

    requiredFields.forEach((field) => {
      if (validators[field.name]) {
        if (!validateField(field)) isValid = false;
      } else if (!field.value.trim()) {
        showFieldError(field, "This field is required.");
        isValid = false;
      } else {
        showFieldError(field, "");
      }
    });

    if (!isValid) {
      status.textContent = "Please fix the highlighted fields and try again.";
      status.classList.add("form-status--error", "is-visible");
      const firstInvalid = form.querySelector('[data-touched="true"]');
      firstInvalid?.focus();
      return;
    }

    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      // TODO: replace with a real submission target, e.g.:
      // await fetch("/api/inquiries", { method: "POST", body: new FormData(form) });
      await new Promise((resolve) => setTimeout(resolve, 900));

      form.reset();
      status.textContent =
        "Thanks for the details. This form isn't yet wired to a live inbox — please email hello@zerolag.io directly and we'll reply within 1 business day.";
      status.classList.add("form-status--success", "is-visible");
    } catch (err) {
      status.textContent =
        "Something went wrong sending your inquiry. Please email us directly instead.";
      status.classList.add("form-status--error", "is-visible");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
})();
