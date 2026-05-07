# 🚀 Deployment Guide

This guide covers deploying English Pro to production.

---

## ⚠️ Before Deploying

### 1. Set Up Together.ai API Key

You need a Together.ai API key to make the app functional.

1. Sign up at [Together.ai](https://api.together.xyz/)
2. Get your API key from [Settings → API Keys](https://api.together.xyz/settings/api-keys)
3. Keep it secure - never commit it to git!

### 2. Test Locally

```bash
# Add API key to .env
echo "VITE_TOGETHER_API_KEY=your_actual_key_here" > .env

# Test the app
pnpm dev

# Verify all tests pass
pnpm test:run

# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## 🌐 Option 1: Deploy to Vercel (Recommended)

### Why Vercel?
- Zero-config deployment
- Automatic HTTPS
- Global CDN
- Environment variable management
- GitHub integration

### Steps

#### A. Using Vercel CLI

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Configure project settings
# - Add environment variable: VITE_TOGETHER_API_KEY

# Deploy to production
vercel --prod
```

#### B. Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`
5. Add Environment Variable:
   - **Key**: `VITE_TOGETHER_API_KEY`
   - **Value**: Your Together.ai API key
6. Click "Deploy"

### Vercel Configuration

The `vercel.json` file is pre-configured with:
- SPA routing (all routes → index.html)
- Security headers (XSS protection, frame options)
- Asset caching (1 year for immutable assets)

---

## 📦 Option 2: Deploy to Netlify

### Why Netlify?
- Easy deployment
- Form handling
- Serverless functions
- Continuous deployment

### Steps

#### A. Using Netlify CLI

```bash
# Install Netlify CLI
pnpm add -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Configure:
# - Build command: pnpm build
# - Publish directory: dist

# Add environment variable
netlify env:set VITE_TOGETHER_API_KEY "your_key_here"

# Deploy
netlify deploy --prod
```

#### B. Using Netlify Dashboard

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub
4. Configure:
   - **Build command**: `pnpm build`
   - **Publish directory**: `dist`
   - **Environment variables**:
     - `VITE_TOGETHER_API_KEY`: Your Together.ai API key
5. Click "Deploy"

### Netlify Configuration

The `netlify.toml` file is pre-configured with:
- Build settings
- SPA redirects
- Security headers
- Asset caching

---

## 🐳 Option 3: Deploy with Docker

### Build Docker Image

```bash
# Build production image
docker build -t english-pro:latest .

# Run locally
docker run -p 8080:8080 \
  -e VITE_TOGETHER_API_KEY=your_key_here \
  english-pro:latest

# Open http://localhost:8080
```

### Deploy to Cloud Platforms

**Google Cloud Run:**
```bash
gcloud run deploy english-pro \
  --image english-pro:latest \
  --platform managed \
  --set-env-vars VITE_TOGETHER_API_KEY=your_key
```

**AWS ECS, Azure Container Instances, etc.:**
Follow platform-specific container deployment guides.

---

## 🔒 API Key Security (Important!)

### ⚠️ Current Setup (Development)

The API key is currently included in the frontend bundle via `VITE_` prefix. This is:
- ✅ OK for development and testing
- ⚠️ **NOT RECOMMENDED for production** (key visible in browser)

### ✅ Production-Ready Solution: API Proxy

For production, create a backend proxy to hide the API key:

#### Option A: Vercel Serverless Function

Create `api/translate.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spanishPhrase } = req.body;

  if (!spanishPhrase) {
    return res.status(400).json({ error: 'Spanish phrase required' });
  }

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: '...' },
          { role: 'user', content: `Spanish phrase: "${spanishPhrase}"` },
        ],
      }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Translation failed' });
  }
}
```

Then update `togetherApi.ts` to call `/api/translate` instead of Together.ai directly.

#### Option B: Netlify Function

Similar to Vercel, create `netlify/functions/translate.ts`.

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
- [ ] API key not visible in browser DevTools

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

### API Key Not Working

- Verify key is set in platform environment variables
- Check key has no extra spaces
- Ensure key has correct permissions on Together.ai

### App Not Loading

- Check browser console for errors
- Verify build output in `dist/` folder
- Check deployment logs

### CORS Errors

- This shouldn't happen with direct Together.ai calls
- If using a proxy, ensure CORS headers are set

---

## 📈 Monitoring

### Vercel Analytics

Enable in Vercel dashboard → Settings → Analytics

### Custom Analytics

Add to `index.html`:

```html
<!-- Google Analytics, Plausible, etc. -->
```

---

## 🔄 Continuous Deployment

### GitHub Actions

Both Vercel and Netlify auto-deploy on git push if connected to GitHub.

### Manual Deployment

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

---

## 💰 Cost Estimates

### Hosting (Vercel/Netlify)
- **Free tier**: Perfect for this app
- **Bandwidth**: Minimal (static files + API calls)
- **Build minutes**: ~1 min per deploy

### Together.ai API
- **Free tier**: Limited requests
- **Paid**: Pay per token
- **Estimate**: $0.20 per 1M tokens
- **This app**: ~500 tokens per translation

**Monthly cost for 1000 translations**: ~$0.10

---

## 📞 Support

If you encounter issues:

1. Check deployment logs
2. Verify environment variables
3. Test locally first
4. Review platform documentation

---

**Ready to deploy?** Choose your platform and follow the steps above!
