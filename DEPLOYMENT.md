# 🚀 Deployment Guide

This guide covers deploying English Pro to production.

The app is a static front end **plus a small Node server** (`server/`) that serves it and proxies `POST /api/translate` to Together.ai. The Together.ai credential lives only on that server, as a runtime variable. Any platform that runs the Docker image works; static-only hosts (Vercel, Netlify static hosting) do not, because `/api/translate` would not exist.

---

## ⚠️ Before Deploying

### 1. Get a Together.ai API Key and Pick a Model

1. Sign up at [Together.ai](https://api.together.xyz/)
2. Get your API key from [Settings → API Keys](https://api.together.xyz/settings/api-keys)
3. Pick a **serverless** model (one that answers without a dedicated endpoint), e.g. `Qwen/Qwen3.8-Flash`
4. Keep the key secure: never commit it, never give it a `VITE_` prefix, never pass it as a Docker build arg

> **Rotate the key if this app ran before the server was added.** Earlier builds inlined `VITE_TOGETHER_API_KEY` into `dist/`, so that key was visible to every visitor. Create a new one and do not reuse the old variable name.

### 2. Test Locally

```bash
# Runtime variables read by the server (not VITE_*)
cat > .env <<'EOF'
TOGETHER_API_KEY=your_actual_key_here
TOGETHER_MODEL=Qwen/Qwen3.8-Flash
# Optional: model name shown in the footer
VITE_TOGETHER_MODEL=Qwen/Qwen3.8-Flash
EOF

# Verify all tests pass
pnpm test:run

# Run the API (http://localhost:8080) and the front end (http://localhost:5173)
pnpm dev:server   # in one terminal
pnpm dev          # in another; Vite proxies /api to the API
```

To try the production setup (the server serves the built site itself):

```bash
pnpm build
pnpm start:server   # http://localhost:8080
```

---

## 🐳 Deploy with Docker

### Build and Run

```bash
# Build the production image. No credential is needed, or accepted, at build time
docker build -t english-pro:latest .

# Run it with runtime variables
docker run -p 8080:8080 \
  -e TOGETHER_API_KEY=your_key_here \
  -e TOGETHER_MODEL=Qwen/Qwen3.8-Flash \
  english-pro:latest

# Open http://localhost:8080
```

| Variable | Where | Purpose |
|----------|-------|---------|
| `TOGETHER_API_KEY` | runtime | Together.ai credential (secret) |
| `TOGETHER_MODEL` | runtime | Model that answers |
| `PORT` | runtime | Listening port (default `8080`) |
| `VITE_TOGETHER_MODEL` | build arg | Model name shown in the footer only |

If `TOGETHER_API_KEY` or `TOGETHER_MODEL` is missing, the site still loads and translations answer `502`; the reason is written to the container logs.

### Railway (Recommended)

1. Create a service from this repository (it uses the `Dockerfile`)
2. Set the service variables:
   - `TOGETHER_API_KEY`: your key, marked **sealed** (variable menu → **Seal Variable**)
   - `TOGETHER_MODEL`: the serverless model
   - `VITE_TOGETHER_MODEL`: the same model name, for the footer
3. Deploy. Changing `TOGETHER_API_KEY` or `TOGETHER_MODEL` later only needs a redeploy; changing `VITE_TOGETHER_MODEL` needs a rebuild
4. Verify with a real phrase (see the checklist below)

### Other Container Platforms

**Google Cloud Run:**
```bash
gcloud run deploy english-pro \
  --image english-pro:latest \
  --platform managed \
  --set-env-vars TOGETHER_MODEL=Qwen/Qwen3.8-Flash \
  --set-secrets TOGETHER_API_KEY=together-api-key:latest
```

**AWS ECS, Azure Container Instances, Fly.io, etc.:**
Follow platform-specific container deployment guides, setting `TOGETHER_API_KEY` and `TOGETHER_MODEL` as runtime environment variables (use the platform's secret store for the key).

---

## 🔒 API Key Security

- The browser sends one request, to `/api/translate` on the app's own origin, and never contacts `api.together.xyz`
- The key is read from `TOGETHER_API_KEY` at runtime and never written into `dist/` or any image layer
- CI builds with sentinel credentials and runs `pnpm run scan:dist`, which fails if a credential or the provider key prefix appears in `dist/`
- `scripts/test-docker-build.sh` checks the same for a locally built image
- Provider errors reach the visitor as one generic message; details go to the server log only
- Each client gets 25 translations per UTC day (in memory, per process, keyed by the `X-Real-IP` header that Railway's edge sets)

---

## 📊 Post-Deployment Checklist

After deploying, verify:

- [ ] App loads without errors
- [ ] Can enter Spanish phrase
- [ ] Translation works (all 4 sections display)
- [ ] Mobile responsive design works
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Skip link appears on Tab
- [ ] Error messages display correctly
- [ ] Loading states work
- [ ] No console errors
- [ ] DevTools → Network shows requests only to your own origin, never to `api.together.xyz`
- [ ] The API key is nowhere in the page source or loaded scripts

### Performance Checks

Run Lighthouse audit:

```bash
# Install Lighthouse
pnpm add -g lighthouse

# Run audit
lighthouse https://your-deployed-url.com --view
```

**Target Scores:**
- Performance: ≥90
- Accessibility: 100
- Best Practices: ≥90
- SEO: ≥90

---

## 🔧 Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
pnpm clean:install

# Try build locally
pnpm build
```

### "The translation service is unavailable"

The server answered `502`. Check the service logs for the reason:

- `TOGETHER_API_KEY or TOGETHER_MODEL is not set`: set both as runtime variables and redeploy
- `Together.ai answered 401` or `403`: the key is wrong or revoked
- `Together.ai answered 400`: the model is not serverless or does not exist; try another
- `Together.ai request timed out`: the provider took longer than 60 seconds
- `Together.ai answered without any answer text`: a reasoning model spent its token budget before answering; try a non-reasoning model

### "Rate limit exceeded" or "Daily limit reached"

The first is the provider asking to wait; the second is the per-client limit of 25 translations per UTC day.

### App Not Loading

- Check browser console for errors
- Verify build output in `dist/` folder
- Check deployment logs

---

## 🔄 Continuous Deployment

Railway redeploys on every push to the connected branch. CI (`.github/workflows/ci.yml`) must be green first: lint, tests with coverage, build plus the `dist/` credential scan, and the Docker build.

---

## 💰 Cost Estimates

### Hosting
- A single small container; the server is idle between requests
- **Build minutes**: ~1-2 min per deploy

### Together.ai API
- Pay per token; the cost depends on the model you pick
- **This app**: roughly 500-1000 tokens per translation, capped at 1024 tokens per answer
- The daily per-client limit (25) bounds how much one visitor can spend

---

## 📞 Support

If you encounter issues:

1. Check deployment logs
2. Verify environment variables
3. Test locally first
4. Review platform documentation

---

**Ready to deploy?** Build the image, set the two runtime variables, and follow the checklist above.
