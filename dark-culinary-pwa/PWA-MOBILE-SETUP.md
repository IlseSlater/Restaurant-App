# PWA install on mobile (Pixel / Android)

## Why HTTPS shows "Not Secure" and mobile won't install

- **Angular dev server with `ssl: true`** uses a **self-signed certificate**. Browsers do not trust it.
- **Desktop Chrome** may still allow "Install" with a self-signed cert in some cases.
- **Mobile Chrome (e.g. Pixel 9)** treats the connection as **not secure** and **will not offer PWA install** (no install prompt, no Add to Home Screen as app) until the site is served over **trusted HTTPS**.

So: **connection not secure** (HTTPS scratched out) and **no install on Pixel** are the same root cause: the certificate is not trusted on the device.

## What you need for install on mobile

1. **Trusted HTTPS** – certificate from a public CA (e.g. Let's Encrypt) or a host that provides one (Vercel, Netlify, Cloudflare Pages, etc.).
2. **Production build** – the service worker is only included in production, and Chrome requires a service worker for PWA install.
3. **Open the app on your Pixel** at the **trusted HTTPS** URL (see options below).

## Option A: Deploy to a host with real HTTPS (recommended)

Deploy the production build to a host that gives you a valid certificate:

```bash
cd dark-culinary-pwa
ng build --configuration=production
# Then deploy the contents of dist/dark-culinary-pwa/ to:
# - Vercel, Netlify, Cloudflare Pages, or
# - Your own server with Let's Encrypt (e.g. certbot)
```

Open the **deployed URL** (e.g. `https://your-app.vercel.app`) on your Pixel. The install banner should appear when Chrome considers the PWA installable (after a short visit / engagement).

## Option B: Test locally on Pixel with a tunnel (valid HTTPS)

Use a tunnel so your local app is reachable at an **HTTPS URL with a trusted certificate**:

### 1. Production build and serve locally

```bash
cd dark-culinary-pwa
ng build --configuration=production
npx serve dist/dark-culinary-pwa -l 4200
```

### 2. Expose with a tunnel (pick one)

**Cloudflare Tunnel (free):**

```bash
# Install: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
cloudflared tunnel --url http://localhost:4200
# Use the https://...trycloudflare.com URL on your Pixel
```

**ngrok (free tier):**

```bash
# Install from https://ngrok.com
ngrok http 4200
# Use the https://...ngrok-free.app URL on your Pixel
```

### 3. Open the tunnel URL on your Pixel

- In Chrome on the Pixel, open the **https** tunnel URL (e.g. `https://abc123.trycloudflare.com`).
- Wait a few seconds / tap around the app.
- You should see the **"Install Dark Culinary"** bar at the bottom, or the browser’s own install prompt.

## Summary

| Environment              | Certificate     | PWA install on Pixel |
|--------------------------|-----------------|------------------------|
| `ng serve` (dev, ssl)    | Self-signed     | No (not secure)       |
| Production on localhost  | Self-signed     | No (not secure)       |
| Production + tunnel      | Trusted (e.g. CF) | Yes                 |
| Production on real host  | Trusted         | Yes                   |

**TL;DR:** Use a **production build** and either **deploy to a host with real HTTPS** or **expose localhost via Cloudflare Tunnel / ngrok**, then open that **https** URL on your Pixel to get the install prompt.
