# Zero Lag — agency website

Static site: plain HTML, one stylesheet (`css/style.css`) and two small scripts (`js/main.js`, `js/contact.js`). No build step, no dependencies.

## Demos

`demos/` holds nine self-contained concept demos for fictional brands. Each shows a disclosure bar and is set to noindex. Photos in `assets/demos/` come from Unsplash; screenshots in `assets/images/work/` are taken from the demos, so retake them if a demo changes.

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

The form posts to FormSubmit, which emails each message to `zerolag26308@gmail.com`. The address is set on the form in `contact.html` (`data-endpoint`, `data-inbox`, `action`). If sending fails, the visitor is offered their email app with the message already filled in.

After the first deploy, send one test message and click the activation link FormSubmit emails to that inbox. Messages are not delivered until this is done. A hidden `_honey` field filters basic spam bots.

## Before going live

- The privacy policy and terms contain `[Company legal name]` / `[Jurisdiction]` placeholders and a notice asking for legal review.
- The work page shows sample projects only, labelled as such.
- Bump the `?v=` query on the CSS/JS links in every page after changing those files, so browsers fetch the new version.
