# Deployment Guide: Parrit on Vercel

## Overview

The app is a Vite/React SPA with a Supabase backend. Hosting on Vercel is zero-config once the GitHub repo is connected and environment variables are set.

| Layer    | Service  | Notes                                        |
| -------- | -------- | -------------------------------------------- |
| Frontend | Vercel   | Auto-deploys from GitHub on every push       |
| Backend  | Supabase | Already live — no changes needed             |
| Domain   | Vercel   | Free `.vercel.app` domain or a custom domain |

---

## Step 1 — Push to GitHub

If no GitHub remote exists yet, create one and push:

```bash
# Create a new repo on GitHub (e.g. github.com/your-username/parrit)
# Then from your local project:
git remote add origin git@github.com:YOUR_USERNAME/parrit.git
git push -u origin main
```

> [!IMPORTANT]
> Make sure `.env` is gitignored (it is). **Never** commit your real `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` to the repo.

---

## Step 2 — Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Add GitHub Account"** → authorise the `parrit` repository
3. Click **Import**

On the project configuration screen:

- **Framework Preset:** Vite _(auto-detected)_
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

> [!NOTE]
> The `vercel.json` at the root of the project already handles SPA routing (rewrites all paths to `index.html`). No additional config is needed.

---

## Step 3 — Set Environment Variables

In the Vercel project settings go to **Settings → Environment Variables** and add:

| Variable Name            | Value                     | Environments        |
| ------------------------ | ------------------------- | ------------------- |
| `VITE_SUPABASE_URL`      | `https://xxx.supabase.co` | Production, Preview |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...`      | Production, Preview |

These are in your local `.env` file. They are **safe to add to Vercel** — the `VITE_` prefix means they are bundled into the client build (not secret server-side keys). The Supabase anon key is intentionally public; Row Level Security on Supabase is what protects the data.

---

## Step 4 — Deploy

Click **Deploy**. Vercel will:

1. Clone the repo
2. Run `npm install && npm run build`
3. Serve `dist/` from its global edge network

Your app will be live at `https://parrit.vercel.app` (or similar).

---

## CI/CD — Automatic Deploys

Once connected, every `git push` triggers a deploy automatically:

| Branch              | Deployment                         |
| ------------------- | ---------------------------------- |
| `main`              | **Production** deploy              |
| Any other PR/branch | **Preview** deploy (shareable URL) |

> [!TIP]
> Use preview deployments to test features before merging. Each PR gets its own isolated URL within seconds of pushing.

---

## Custom Domain (Optional)

1. In Vercel → **Settings → Domains**
2. Add your domain (e.g. `parrit.io`)
3. Follow DNS instructions for your registrar (usually a CNAME record)
4. Vercel auto-provisions an SSL certificate via Let's Encrypt

---

## Supabase — Auth Redirect URLs

When running on a real domain, you need to allow that domain in Supabase:

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Add your Vercel URL to **Redirect URLs**:
   - `https://parrit.vercel.app`
   - `https://your-custom-domain.com` (if using one)

> [!WARNING]
> Forgetting this step will cause login redirects to fail in production. This is the most common deployment gotcha for Supabase + Vercel apps.

---

## Verifying the Deployment

After go-live, check these things:

- [ ] Home page loads (`/`)
- [ ] Direct navigation to `/history` or `/settings` works (no 404)
- [ ] Sign-in / sign-up works
- [ ] Drag-and-drop saves to Supabase
- [ ] Dark mode persists across refresh
