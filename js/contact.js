// Quote form: validation, then delivery by email through the form endpoint, with the email app as a fallback
(() => {
  "use strict";

  const form = document.querySelector("#project-form");
  if (!form) return;

  const INBOX = form.dataset.inbox || "zerolag26308@gmail.com";
  const status = form.querySelector(".form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitLabel = submitBtn.innerHTML;

  const rules = {
    name: (v) => v.trim().length >= 2 || "Please enter your name.",
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Please enter a valid email address.",
    service: (v) => !!v || "Please choose what you need. Pick \"Not sure yet\" if you're unsure.",
    website: (v) => !v.trim() || /^\S+\.\S+$/.test(v.trim()) || "Please enter a website address, like yourbusiness.com.",
    message: (v) => v.trim().length >= 10 || "Please tell us a little about your project.",
  };

  const setError = (field, message) => {
    const error = form.querySelector(`#${field.id}-error`);
    if (error) error.textContent = message || "";
    if (message) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
    // Green tick once a filled-in field is correct
    field.classList.toggle("is-valid", !message && !!field.value.trim());
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
      if (field.getAttribute("aria-invalid") === "true" || field.classList.contains("is-valid")) validate(field);
    });
    field.addEventListener("change", () => validate(field));
  });

  // Live character count under the message box
  const message = form.elements.message;
  const hint = form.querySelector("#message-hint");
  const countChars = () => {
    const used = message.value.length;
    hint.textContent = used ? `${used} of ${message.maxLength} characters` : "A sentence or two is enough.";
  };
  message.addEventListener("input", countChars);

  // Links like contact.html?service=ai-ml choose that service for the visitor
  const wanted = new URLSearchParams(window.location.search).get("service");
  const serviceField = form.elements.service;
  if (wanted && [...serviceField.options].some((o) => o.value === wanted)) {
    serviceField.value = wanted;
    validate(serviceField);
  }

  // Success panel shown in place of the form
  const success = document.querySelector(".form-success");
  const showSuccess = (email) => {
    success.querySelector("[data-success-email]").textContent = email;
    form.hidden = true;
    success.hidden = false;
    success.focus();
  };
  success.querySelector("[data-send-another]").addEventListener("click", () => {
    success.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });

  const showStatus = (type, html) => {
    status.className = `form-status form-status--${type} is-visible`;
    status.innerHTML = html;
  };

  const optionText = (select) => (select && select.value ? select.options[select.selectedIndex].text : "");

  // Collect the answers with clear labels, skipping anything left empty
  const answers = () => {
    const f = form.elements;
    return [
      ["Name", f.name.value],
      ["Email", f.email.value],
      ["Phone or WhatsApp", f.phone.value],
      ["Company", f.company.value],
      ["Website", f.website.value],
      ["Service", optionText(f.service)],
      ["Budget", optionText(f.budget)],
      ["Timeline", optionText(f.timeline)],
      ["Heard about us", f.referral.value],
    ].filter(([, value]) => value && value.trim());
  };

  // Plain-text version for the email app fallback
  const summarise = () => {
    const lines = answers().map(([label, value]) => `${label}: ${value.trim()}`);
    return `${lines.join("\n")}\n\nProject\n${form.elements.message.value.trim()}`;
  };

  // Fields sent to the form service, which turns them into the email
  const payload = () => {
    const data = {
      _subject: `New quote request from ${form.elements.name.value.trim()}`,
      _template: "table",
      _captcha: "false",
      _honey: "",
    };
    answers().forEach(([label, value]) => {
      data[label === "Email" ? "email" : label] = value.trim();
    });
    data.Project = form.elements.message.value.trim();
    return data;
  };

  const mailtoHref = () => {
    const name = form.elements.name.value.trim();
    const subject = `Quote request from ${name}`;
    return `mailto:${INBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summarise())}`;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.className = "form-status";
    status.textContent = "";

    // Quietly drop submissions that filled the hidden honeypot
    if (form.elements._honey && form.elements._honey.value) return;

    const invalid = Object.keys(rules)
      .map((name) => form.elements[name])
      .filter((field) => field && !validate(field));

    if (invalid.length) {
      showStatus("error", "Please check the fields marked in red and try again.");
      const more = invalid[0].closest("details");
      if (more) more.open = true;
      invalid[0].focus();
      return;
    }

    // Pages opened straight from disk can't use the form service, so use the email app instead
    const endpoint = window.location.protocol === "file:" ? "" : (form.dataset.endpoint || "").trim();
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
    submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending your message...';
    form.setAttribute("aria-busy", "true");

    // Give up after 20 seconds so the visitor is never left waiting
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), 20000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        signal: timeout.signal,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload()),
      });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      const result = await response.json();
      if (String(result.success) !== "true") throw new Error(result.message || "Not delivered");

      const replyTo = form.elements.email.value.trim();
      form.reset();
      form.querySelectorAll(".is-valid").forEach((field) => field.classList.remove("is-valid"));
      countChars();
      showSuccess(replyTo);
    } catch (err) {
      const reason = err.name === "AbortError" ? "The connection timed out." : navigator.onLine ? "" : "You seem to be offline.";
      showStatus(
        "error",
        `Sorry, your message could not be sent. ${reason} Your text is still here. Please <a href="${mailtoHref()}">send it from your email app</a> ` +
          `or write to <a href="mailto:${INBOX}">${INBOX}</a>.`
      );
      status.focus();
    } finally {
      clearTimeout(timer);
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitLabel;
      form.removeAttribute("aria-busy");
    }
  });
})();
