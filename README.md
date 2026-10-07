# OSMI — One Square Metre Initiative

The customer-facing website for the **One Square Metre Initiative** — a fractional real-estate platform powered by Leisure Court Limited. Buyers purchase land in small square-metre portions (minimum 5 sqm) instead of needing to afford a full plot outright.

Live site: [onesquaremetre.leisurecourt.ng](https://onesquaremetre.leisurecourt.ng)

## What this is

A static HTML/CSS/JS site, no build step, no framework, no bundler. Hosted on Cloudflare (a Worker serving static assets), which redeploys on every push to this repo (it was previously hosted on Netlify). Every page talks to a separate backend service over a single JSON API — see [Backend connection](#backend-connection) below.

## Project structure

```
index.html               Landing page
signup.html               Account creation — collects subscriber details (gender,
                           marital status, DOB, nationality, address) modeled on
                           Leisure Court's physical Application Form; also accepts
                           a referral code via ?ref=CODE
login.html                 Login, with a "return to where you were" redirect after
                            an expired-session bounce
forgot-password.html        Request a password reset email
reset-password.html          Set a new password from the emailed link
verify.html                   Email verification landing page
buy.html                       Browse plots, buy from 5 sqm, pay via Paystack
sell.html                       Request a sell-back of owned sqm
dashboard.html                   Owned plots, progress bars, price-per-sqm,
                                  referral stats, transaction history, the
                                  illustrative "Estimated Land Value Growth" widget
profile.html                      Edit profile, next-of-kin, subscriber details,
                                   change password, view referral link
about.html                         About the initiative

css/
  site.css                Shared styles for every account/app page
  landing.css               Landing-page-specific styles

js/
  site-config.js            The ONE file that points the site at its backend
                             (OSMI_CONFIG.API_URL) and holds the Paystack public key
  site-api.js                 Thin fetch wrapper — one function per backend action
  site-auth.js                  Session handling (localStorage), login/logout,
                                 verification + next-of-kin banners, redirect-after-
                                 login logic
  site-nav.js                    Shared mobile nav toggle
  site-chart.js                   Price-history chart (buy.html, dashboard.html)
  value-growth.js                  The illustrative land-value-growth widget —
                                    deliberately decoupled from real plot pricing
  referral-widget.js                Referral code/link display + stats
  landing-*.js                       Landing-page animation/interaction scripts

assets/                    Images, logos, landing-page media

.assetsignore              Files in this repo that Cloudflare must NOT serve publicly
                            (README.md, package files, local tooling folders)
```

## Backend connection

Every page that needs data calls a single backend service, whose URL lives in exactly one place: `js/site-config.js` → `OSMI_CONFIG.API_URL`. Nothing else in this repo should ever hardcode that URL.

The backend contract is action-based, single-endpoint:
- `POST` with `{ "action": "...", ...}` for anything that reads or writes buyer/plot data
- Plain `GET` requests for plot listings and lookups

The backend itself (`osmi-backend`, a separate repo) is a faithful re-implementation of what used to run on Google Apps Script — same actions, same request/response shapes — so switching `API_URL` is the only change this repo ever needs when the backend moves.

**CORS:** the backend only accepts browser requests from origins listed in its `ALLOWED_ORIGINS` setting (on Render). The live domain is already allowed. Any other address that serves this site — a `workers.dev` preview URL, a staging domain — will load its pages but fail every API call until it is added there.

## Local development

No build step. Either open the HTML files directly in a browser, or serve the folder with any static file server (e.g. `npx serve .`) so relative paths behave the same way they will in production. Point `OSMI_CONFIG.API_URL` at a local or staging backend while testing, and remember to point it back before deploying.

## Deployment

The site is a Cloudflare Worker (`osmi`) serving this repo's files as static assets, with `onesquaremetre.leisurecourt.ng` attached as its custom domain. Pushes to the connected branch redeploy it automatically (Worker → Settings → Builds). There is no build step.

- **What gets served:** everything in the repo root, except what `.assetsignore` excludes. Keep `README.md`, `package.json`, `package-lock.json` and local tooling folders (`.wrangler`, `.dev.vars`) listed there so they never become public URLs. After changing it, confirm `/README.md` returns a 404 on the live site.
- **Before pointing a new address at it,** add that origin to the backend's `ALLOWED_ORIGINS` (see Backend connection above).
- **Verifying the host:** DevTools → Network → first request → `Server: cloudflare` and a `cf-ray` header means Cloudflare is serving it. `Server: Netlify` or an `X-Nf-Request-Id` header means traffic is still going to the old Netlify deployment.

## Known platform gotcha: hosts rewrite `.html` URLs

Static hosts serve "clean" URLs instead of the literal filename, so the address in the browser often differs from the file name. On Netlify, whose **Pretty URLs** feature is on by default, `dashboard.html` was addressed as `/dashboard/` (trailing slash). Cloudflare's static hosting also serves clean, extensionless URLs by default (`/dashboard`). The exact form depends on the host, which is why this code must never rely on it.

This caused two real bugs in this codebase while the site was on Netlify, both from code that tried to derive the current page's filename from `window.location.pathname`:
- Referral links on `dashboard.html` and `profile.html` were built by stripping `dashboard.html` / `profile.html` off the end of the current path — which silently failed to match against `/dashboard/`, producing broken links like `.../dashboard/signup.html?ref=CODE`.
- The "return to this page after login" redirect in `site-auth.js` used `pathname.split('/').pop()`, which returns an empty string (not the page name) when the path ends in a trailing slash — it was silently falling back to the homepage every time.

**Rule of thumb going forward:** never derive a page's own filename from `window.location.pathname` for use in a link or redirect. Either hardcode the target path (as the referral links now do) or strip a trailing slash and reconstruct the `.html` name explicitly (as the login redirect now does) — see either fix for the pattern.

## Auth & session storage

Session tokens and the cached buyer object are stored in `localStorage` (`osmi_session_token`, `osmi_session_buyer`), not an httpOnly cookie. This is the normal, appropriate choice for a static site with no server-side rendering, but it does mean a token is readable by any future XSS vulnerability — worth keeping in mind if this site ever adds a feature that renders less-trusted content into the DOM.

## Backend

The backend this site talks to is `osmi-backend`, a Node/Express service hosted on Render. It replaced the original Google Apps Script backend, specifically to fix a reliability issue where Apps Script could complete a request successfully but still report a false error to the buyer. Moving between the two is a single `OSMI_CONFIG.API_URL` change in this repo, timed together with repointing the Paystack webhook. The old Apps Script deployment can be kept as a dormant fallback.
