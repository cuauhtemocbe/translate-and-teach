# 🌐 English Pro — Spanish Phrase Analyzer

AI-powered Spanish to English translation with grammatical analysis, learning tips, and contextual variations using Together.ai LLM.

![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Tests](https://img.shields.io/badge/Tests-54%20passing-success)

---

## ✨ Features

- **AI-Powered Translation**: A serverless Together.ai model (set with `TOGETHER_MODEL`), called from a server so the credential never reaches the browser
- **4-Section Analysis**:
  - 🌐 Principal Translation (main English translation)
  - 📖 Grammatical Analysis (step-by-step breakdown)
  - 💡 Learning Key (practical tips and insights)
  - ⚙️ Technical Variations (formal, informal, contextual alternatives)
- **Dark Theme by Default**: Beautiful dark mode with light theme toggle
- **Theme Persistence**: Your theme preference is saved locally
- **Mobile-First Responsive Design**
- **Accessibility**: WCAG 2.1 AA compliant
- **TypeScript**: Full type safety with strict mode
- **Test Coverage**: 54 passing tests (100% core logic)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 26.12.1, < 27 (matches `engines.node` in `package.json`)
- **pnpm** >= 9.0.0
- **Together.ai API Key** ([Get one here](https://api.together.xyz/settings/api-keys))
- **[gitleaks](https://github.com/gitleaks/gitleaks#installing)** — required by the pre-commit hook, which scans staged changes for secrets before every commit (`brew install gitleaks`, or download a binary from the [releases page](https://github.com/gitleaks/gitleaks/releases))

### Installation

```bash
# Clone repository
git clone https://github.com/cuauhtemocbe/translate-and-teach.git
cd translate-and-teach

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your Together.ai API key and model name
```

### Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck

# Build for production
pnpm build
```

The app will be available at `http://localhost:5173`

---

## 📁 Project Structure

```
translate-and-teach/
├── specs/                      # Specification documents (spec-driven development)
│   ├── english-pro.md         # Full specification
│   ├── english-pro-plan.md    # Implementation plan
│   └── TASKS.md               # Task checklist
├── src/
│   ├── components/            # React components
│   │   ├── Header.tsx
│   │   ├── InputSection.tsx
│   │   ├── ResultCard.tsx
│   │   └── ResultsGrid.tsx
│   ├── services/              # Client for /api/translate
│   │   └── translateApi.ts
│   ├── utils/                 # Utility functions
│   │   └── parseResponse.ts
│   ├── types/                 # TypeScript types
│   │   └── index.ts
│   ├── styles/                # Global styles
│   │   ├── globals.css
│   │   └── variables.css
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # React entry point
│   └── vite-env.d.ts          # Vite environment types
├── server/                    # Production server: serves dist/ and POST /api/translate
│   ├── handler.ts             # Routing, validation, daily limit, generic errors
│   ├── together.ts            # Together.ai call (streamed), holds the credential
│   ├── rateLimiter.ts         # Per-client daily limit
│   ├── static.ts              # Static files with SPA fallback
│   └── index.ts               # Reads TOGETHER_* variables and starts listening
├── scripts/
│   └── scan-dist-for-secrets.mjs  # CI gate: no credential in dist/
├── .env.example               # Environment variable template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

---

## 🧪 Testing

This project follows **Test-Driven Development (TDD)**:

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test Header

# Run tests with coverage
pnpm test:coverage

# Run tests once (CI mode)
pnpm test:run
```

**Test Coverage**: 38 passing tests across 7 test files
- ✅ Parser tests (8/8)
- ✅ API client tests (9/9)
- ✅ Component tests (21/21)

---

## 🎨 Design System

The app uses a comprehensive CSS variable-based design system:

### Colors
- Background: `#F0F4F8` (light blue-gray)
- Card surface: `#FFFFFF`
- Primary text: `#1A2B3C`
- Accent: `#38A169` (green)

### Typography
- Font: Lato (Google Fonts)
- Sizes: 12px - 30px (responsive)
- Weights: 300, 400, 600, 700

### Responsive Breakpoints
- Mobile: < 640px (single column)
- Tablet: 640px - 1024px (2-column grid)
- Desktop: > 1024px (centered max-width)

---

## 🔒 Configuration & Security

The Together.ai credential never reaches the browser. The production image runs a small Node server (`server/`, no npm dependencies) that serves `dist/` and exposes `POST /api/translate`. The browser only talks to its own origin; the server holds the credential and calls Together.ai.

### Environment Variables

| Variable | Read by | Type | Sensitivity | When it is read |
|----------|---------|------|-------------|-----------------|
| `TOGETHER_API_KEY` | server | **Secret** | 🔴 High (credential) | Runtime only |
| `TOGETHER_MODEL` | server | Config | 🟢 Low (identifier) | Runtime |
| `VITE_TOGETHER_MODEL` | Vite build | Config | 🟢 Low (identifier) | Build arg. Display only: the model name shown in the footer |

⚠️ **Never give the credential a `VITE_` prefix or a Docker `ARG`.** Vite inlines every `VITE_*` value into `dist/`, which publishes it to every visitor. CI builds with sentinel credentials and runs `pnpm run scan:dist` (`scripts/scan-dist-for-secrets.mjs`), which fails the build if a credential or the provider key prefix shows up in `dist/`.

`VITE_TOGETHER_MODEL` only labels the footer; the model that answers is `TOGETHER_MODEL`. Keep them equal or the footer will name the wrong model.

### Development (Local)

Create a `.env` file in the project root (git-ignored):

```bash
# Read by the server (SENSITIVE - never commit!)
TOGETHER_API_KEY=your_api_key_here
TOGETHER_MODEL=Qwen/Qwen3.8-Flash

# Optional: model name shown in the footer
VITE_TOGETHER_MODEL=Qwen/Qwen3.8-Flash
```

Run the API and the front end as two processes:

```bash
pnpm dev:server  # API on http://localhost:8080 (loads .env, restarts on change)
pnpm dev         # Vite on http://localhost:5173, proxies /api to the API
```

Vite loads `.env` only at startup, so restart `pnpm dev` after changing `VITE_TOGETHER_MODEL`.

### The `/api/translate` endpoint

`POST /api/translate` with `{"phrase": "Me quedé en blanco."}`:

| Status | When |
|--------|------|
| `200` | `{"content": "<four-section Markdown>"}` |
| `400` | Phrase empty, only whitespace, longer than 500 characters, or the body is not valid JSON. The provider is not called |
| `429` | The client made 25 requests today (UTC), or the provider is rate limiting. The provider is not called in the first case |
| `502` | The provider timed out, failed, or answered without text. The body is a generic message and never carries provider text or the credential |

The daily limit is kept in memory per process and identifies the client by the `X-Real-IP` header that Railway's edge sets. It is a safety net for a single-instance demo, not a distributed limiter.

### Production Deployment

#### Railway (Recommended)

1. Set these **service variables** in the Railway dashboard:
   - `TOGETHER_API_KEY`: your API key, marked **sealed** (variable menu → **Seal Variable**)
   - `TOGETHER_MODEL`: the serverless model, e.g. `Qwen/Qwen3.8-Flash`
   - `VITE_TOGETHER_MODEL`: the same model name, for the footer
2. Deploy. The Dockerfile declares an `ARG` only for `VITE_TOGETHER_MODEL`; `TOGETHER_API_KEY` and `TOGETHER_MODEL` reach the container as runtime variables, so changing them needs a redeploy but not a rebuild.
3. Rotate the Together.ai key when you first adopt this setup. Earlier builds shipped the old `VITE_TOGETHER_API_KEY` value inside `dist/`, so treat it as published. Do not reuse that variable name.

The container starts `node server/index.ts` (Node runs the TypeScript directly) and listens on `PORT` (default `8080`). If `TOGETHER_API_KEY` or `TOGETHER_MODEL` is missing, the site still loads and translations answer `502` until it is set; the reason is written to the logs.

#### Other Platforms (Vercel/Netlify)

Static hosts cannot run the server, so the app does not work there as is: `/api/translate` would not exist. Use any platform that runs the Docker image (Railway, Cloud Run, Fly.io, ...).

---

### Testing Docker Build Locally

```bash
# Build the production image (no credential at build time)
docker build -t translate-and-teach:local .

# Run it with the runtime variables
docker run -p 8080:8080 \
  -e TOGETHER_API_KEY='your-api-key' \
  -e TOGETHER_MODEL='Qwen/Qwen3.8-Flash' \
  translate-and-teach:local
```

Visit `http://localhost:8080` to test the app. `scripts/test-docker-build.sh` runs the same build with a sentinel credential and checks that it appears nowhere in the image.

**Base image pinning**: every `FROM node:` line in `Dockerfile` (the `builder` and `production` stages) and in `Dockerfile.dev` uses the same pinned string, `node:<version>-alpine3.24@sha256:<digest>`, so development and production run the same Node build and builds are byte-for-byte reproducible. Change the string in all of those lines at once, never in only one. To refresh it, run `docker pull node:<new-version>-alpine3.24`, then `docker inspect --format='{{index .RepoDigests 0}}' node:<new-version>-alpine3.24` to read the digest, and replace the whole string. Dependabot (`docker` ecosystem, `.github/dependabot.yml`) opens bump PRs for these pins; check that its PR changed every `FROM node:` line, `Dockerfile.dev` included, and fix the rest by hand if not.

---

### Adding New Configuration

**Secrets (API keys, passwords)** are runtime variables of the server:
1. Add to `.env` for local dev and to the service variables in Railway (sealed)
2. Read them in `server/index.ts` with `process.env`
3. Do **not** add an `ARG`/`ENV` for them in the `Dockerfile` and do **not** use a `VITE_` prefix

**Non-sensitive build-time values (display labels)** can be `VITE_*` variables:
1. Add to `.env` for local dev and to the Railway variables
2. Add an `ARG`/`ENV` pair in the `builder` stage of the `Dockerfile`

---

## 📖 How It Works

1. **User Input**: Enter a Spanish phrase
2. **API Call**: The browser posts to `/api/translate`; the server calls Together.ai with a structured prompt
3. **LLM Processing**: The configured model generates the 4-section response
4. **Parsing**: Extract sections from Markdown response
5. **Display**: Render results in responsive card grid

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Language | TypeScript 5 (strict mode) |
| Build Tool | Vite 8 |
| Testing | Vitest 4 + Testing Library |
| AI Provider | Together.ai |
| Server | Node (`node:http`, no dependencies), runs TypeScript natively |
| LLM Model | Any serverless Together.ai model (`TOGETHER_MODEL`) |
| Styling | CSS3 with CSS Variables |
| Fonts | Google Fonts (Lato) |

---

## 📋 Development Workflow

This project follows **Spec-Driven Development**:

1. **Phase 1**: SPECIFY → Create `specs/english-pro.md` ✅
2. **Phase 2**: PLAN → Create `specs/english-pro-plan.md` ✅
3. **Phase 3**: TASKS → Break into implementable tasks ✅
4. **Phase 4**: IMPLEMENT → Build with TDD ✅
5. **Phase 5**: POLISH → Accessibility, performance, docs ⏳

See `specs/` directory for detailed documentation.

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Install Netlify CLI
pnpm add -g netlify-cli

# Deploy
netlify deploy --prod
```

### Manual Deployment

```bash
# Build
pnpm build

# Deploy dist/ folder to any static host
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow TDD workflow (write tests first)
4. Ensure all tests pass (`pnpm test:run`)
5. Type check passes (`pnpm typecheck`)
6. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Together.ai** for LLM API
- **Claude Code** for spec-driven development workflow

---

Made with ❤️ for Spanish speakers learning English
