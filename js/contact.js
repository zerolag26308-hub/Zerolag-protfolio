// Project inquiry form: validation, then delivery via a form endpoint or the visitor's email app
(() => {
  "use strict";

  const form = document.querySelector("#project-form");
  if (!form) return;

  const INBOX = form.dataset.inbox || "hello@zerolag.io";
  const status = form.querySelector(".form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitLabel = submitBtn.innerHTML;

  const rules = {
    name: (v) => v.trim().length >= 2 || "Please enter your name.",
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Please enter a valid email address.",
    website: (v) => !v.trim() || /^https?:\/\/\S+\.\S+/.test(v.trim()) || "Please enter a full URL starting with https://",
    message: (v) => v.trim().length >= 20 || "Please tell us a little more about the project (at least 20 characters).",
  };

  const setError = (field, message) => {
    const error = form.querySelector(`#${field.id}-error`);
    if (error) error.textContent = message || "";
    if (message) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
  };

  const validate = (field) => {
    const rule = rules[field.name];
    if (!rule) return true;
    const result = rule(field.value);
    setError(field, result === true ? "" : result);
    return result === true;
  };

  Object.keys(rules).forEach((name) => {
    const field = form.elements[name];
    if (!field) return;
    field.addEventListener("blur", () => validate(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validate(field);
    });
  });

  const showStatus = (type, html) => {
    status.className = `form-status form-status--${type} is-visible`;
    status.innerHTML = html;
  };

  const optionText = (select) => (select && select.value ? select.options[select.selectedIndex].text : "");

  // Build a readable plain-text summary of the inquiry
  const summarise = () => {
    const f = form.elements;
    const lines = [
      ["Name", f.name.value],
      ["Email", f.email.value],
      ["Company", f.company.value],
      ["Website", f.website.value],
      ["Service", optionText(f.service)],
      ["Budget", optionText(f.budget)],
      ["Timeline", optionText(f.timeline)],
      ["Heard about us", f.referral.value],
      ["References", f.reference.value],
    ]
      .filter(([, value]) => value && value.trim())
      .map(([label, value]) => `${label}: ${value.trim()}`);
    return `${lines.join("\n")}\n\nProject\n${f.message.value.trim()}`;
  };

  const mailtoHref = () => {
    const name = form.elements.name.value.trim();
    const subject = `Project inquiry from ${name}`;
    return `mailto:${INBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summarise())}`;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "form-status";
    status.textContent = "";

    // Quietly drop submissions that filled the hidden honeypot
    if (form.elements.company_url && form.elements.company_url.value) return;

    const invalid = Object.keys(rules)
      .map((name) => form.elements[name])
      .filter((field) => field && !validate(field));

    if (invalid.length) {
      showStatus("error", "Please fix the highlighted fields and try again.");
      invalid[0].focus();
      return;
    }

    // No endpoint configured: hand the inquiry to the visitor's email app, already filled in
    const endpoint = (form.dataset.endpoint || "").trim();
    if (!endpoint) {
      const href = mailtoHref();
      window.location.href = href;
      showStatus(
        "info",
        `Your email app should open with the inquiry filled in. Press send there to reach us. ` +
          `If nothing opened, <a href="${href}">try again</a> or email <a href="mailto:${INBOX}">${INBOX}</a> directly.`
      );
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    form.setAttribute("aria-busy", "true");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);

      form.reset();
      showStatus("success", "Thanks — your inquiry has been sent. We usually reply within one business day.");
    } catch (err) {
      showStatus(
        "error",
        `Sorry, your message couldn't be sent. Nothing was lost — please <a href="${mailtoHref()}">send it by email instead</a> ` +
          `or write to <a href="mailto:${INBOX}">${INBOX}</a>.`
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitLabel;
      form.removeAttribute("aria-busy");
      status.focus();
    }
  });
})();
