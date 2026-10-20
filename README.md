# Zero Lag — agency website

Static site: plain HTML, one stylesheet (`css/style.css`) and two small scripts (`js/main.js`, `js/contact.js`). No build step, no dependencies.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

Any static host works. Publish the repository root as-is.

- **Netlify:** New site → import the repo → build command empty, publish directory `.`
- **Vercel:** Import the repo → Framework preset "Other" → no build command, output directory `.`
- **Cloudflare Pages:** Build command empty, output directory `/`
- **GitHub Pages:** Settings → Pages → deploy from branch `master`, folder `/ (root)`, then add the custom domain.

`404.html` is picked up automatically by Netlify, Cloudflare Pages and GitHub Pages. It uses root-relative links, so serve the site from the domain root (`https://www.zerolag.io/`), not a sub-path.

Canonical URLs, `sitemap.xml` and `robots.txt` assume `https://www.zerolag.io`. Update them if the domain changes.

## Contact form

The form has no backend of its own. It works in one of two modes:

1. **Default (no setup):** on submit it opens the visitor's email app with the inquiry pre-filled to `hello@zerolag.io`. The visitor still has to press send, and the page says so.
2. **Form endpoint (recommended for production):** set `data-endpoint` on the form in `contact.html` to a form service URL (Formspree, Basin, Getform, a serverless function, etc.):

   ```html
   <form id="project-form" ... data-endpoint="https://formspree.io/f/your-id">
   ```

   The form posts `FormData` with `Accept: application/json` and only shows a success message when the endpoint returns a 2xx response. Failures show an error with an email fallback. The endpoint URL is public by design; never put secret keys in it.

A hidden honeypot field (`company_url`) silently drops basic spam bots.

## Before going live

- The privacy policy and terms contain `[Company legal name]` / `[Jurisdiction]` placeholders and a notice asking for legal review.
- The work page shows concept projects only, labelled as such. The "Concept preview" artwork is drawn in CSS; replace each `.placeholder-art` with a real `<img>` once real screenshots exist.
- Bump the `?v=` query on the CSS/JS links in every page after changing those files, so browsers fetch the new version.
