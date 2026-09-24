# OSMI — One Square Metre Initiative

The customer-facing website for the **One Square Metre Initiative** — a fractional real-estate platform powered by Leisure Court Limited. Buyers purchase land in small square-metre portions (minimum 5 sqm) instead of needing to afford a full plot outright.

Live site: [onesquaremetre.leisurecourt.ng](https://onesquaremetre.leisurecourt.ng)

## What this is

A static HTML/CSS/JS site, no build step, no framework, no bundler. Hosted on Netlify, which auto-deploys on every push to this repo. Every page talks to a separate backend service over a single JSON API — see [Backend connection](#backend-connection) below.

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
```

## Backend connection

Every page that needs data calls a single backend service, whose URL lives in exactly one place: `js/site-config.js` → `OSMI_CONFIG.API_URL`. Nothing else in this repo should ever hardcode that URL.

The backend contract is action-based, single-endpoint:
- `POST` with `{ "action": "...", ...}` for anything that reads or writes buyer/plot data
- Plain `GET` requests for plot listings and lookups

The backend itself (`osmi-backend`, a separate repo) is a faithful re-implementation of what used to run on Google Apps Script — same actions, same request/response shapes — so switching `API_URL` is the only change this repo ever needs when the backend moves.

## Local development

No build step. Either open the HTML files directly in a browser, or serve the folder with any static file server (e.g. `npx serve .`) so relative paths behave the same way they will in production. Point `OSMI_CONFIG.API_URL` at a local or staging backend while testing, and remember to point it back before deploying.

## Deployment

Netlify auto-deploys on every push to this repo's connected branch. No manual build step, no CI config needed.

## Known platform gotcha: Netlify Pretty URLs

Netlify's **Pretty URLs** feature is on by default and rewrites `.html` paths to trailing-slash paths — a page served from `dashboard.html` is actually addressed as `/dashboard/` in the browser, not `/dashboard.html`.

This has already caused two real bugs in this codebase, both from code that tried to derive the current page's filename from `window.location.pathname`:
- Referral links on `dashboard.html` and `profile.html` were built by stripping `dashboard.html` / `profile.html` off the end of the current path — which silently failed to match against `/dashboard/`, producing broken links like `.../dashboard/signup.html?ref=CODE`.
- The "return to this page after login" redirect in `site-auth.js` used `pathname.split('/').pop()`, which returns an empty string (not the page name) when the path ends in a trailing slash — it was silently falling back to the homepage every time.

**Rule of thumb going forward:** never derive a page's own filename from `window.location.pathname` for use in a link or redirect. Either hardcode the target path (as the referral links now do) or strip a trailing slash and reconstruct the `.html` name explicitly (as the login redirect now does) — see either fix for the pattern.

## Auth & session storage

Session tokens and the cached buyer object are stored in `localStorage` (`osmi_session_token`, `osmi_session_buyer`), not an httpOnly cookie. This is the normal, appropriate choice for a static site with no server-side rendering, but it does mean a token is readable by any future XSS vulnerability — worth keeping in mind if this site ever adds a feature that renders less-trusted content into the DOM.

## Backend migration status

The backend this site talks to is mid-migration from Google Apps Script to a dedicated Node/Express service (`osmi-backend`, hosted on Render), specifically to fix a reliability issue where Apps Script could complete a request successfully but still report a false error to the buyer. Cutover is a single `OSMI_CONFIG.API_URL` change in this repo, timed together with repointing the Paystack webhook. Apps Script stays deployed as a dormant fallback for a period after cutover.
