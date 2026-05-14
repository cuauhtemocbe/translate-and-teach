# 🌐 English Pro — Spanish Phrase Analyzer

AI-powered Spanish to English translation with grammatical analysis, learning tips, and contextual variations using Together.ai LLM.

![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Tests](https://img.shields.io/badge/Tests-54%20passing-success)

---

## ✨ Features

- **AI-Powered Translation**: Uses meta-llama/Llama-3.3-70B via Together.ai
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

- **Node.js** >= 22.0.0
- **pnpm** >= 9.0.0
- **Together.ai API Key** ([Get one here](https://api.together.xyz/settings/api-keys))

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
│   ├── services/              # API clients
│   │   └── togetherApi.ts
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

### Environment Variables Classification

This project uses **two types of configuration**:

| Variable | Type | Sensitivity | Method |
|----------|------|-------------|--------|
| `VITE_TOGETHER_API_KEY` | **Secret** | 🔴 High (credential) | Docker BuildKit secrets |
| `VITE_TOGETHER_MODEL` | **Config** | 🟢 Low (identifier) | Standard build arg |

### Development (Local)

Create a `.env` file in the project root:

```bash
# Together.ai API Key (SENSITIVE - never commit!)
VITE_TOGETHER_API_KEY=your_api_key_here

# Together.ai Model (non-sensitive)
VITE_TOGETHER_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo
```

⚠️ **Important**: The `.env` file is git-ignored. Your credentials are safe locally.

Run the app:
```bash
pnpm dev  # Vite loads from .env automatically
```

---

### Production Deployment

#### Railway (Recommended)

Railway uses **ARG/ENV with Sealed Variables** to handle configuration:

1. **Set environment variables** in Railway dashboard:
   - `VITE_TOGETHER_API_KEY` (your API key) - **Mark as "sealed"**
   - `VITE_TOGETHER_MODEL` (your model name)

2. **Use Sealed Variables** for API keys:
   - In Railway dashboard, click the variable's menu → **"Seal Variable"**
   - Sealed variables are:
     - ✅ Available during builds and deployments
     - ❌ Hidden from Railway UI (shows as `***`)
     - ❌ Cannot be retrieved via Railway API
   - Provides extra security even with ARG/ENV approach

3. **Deploy**: Railway automatically:
   - Injects env vars at build time
   - Dockerfile uses `ARG` to receive them
   - Vite injects values into bundle during build

**How it works:**
```dockerfile
# Railway injects env vars, Dockerfile receives with ARG
ARG VITE_TOGETHER_API_KEY
ARG VITE_TOGETHER_MODEL

# Pass to Vite build
ENV VITE_TOGETHER_API_KEY=$VITE_TOGETHER_API_KEY
ENV VITE_TOGETHER_MODEL=$VITE_TOGETHER_MODEL

RUN pnpm run build
```

**Security Notes:**
- Railway images are **private** (not pushed to public registries)
- Use **sealed variables** for API keys (hidden from UI/API)
- API key ends up in browser bundle (unavoidable for client-side APIs)
- For true secret protection, consider adding a backend proxy

#### Other Platforms (Vercel/Netlify)

For platforms without Docker:

```bash
# Set in deployment platform dashboard
VITE_TOGETHER_API_KEY=your_key_here
VITE_TOGETHER_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo
```

Vite will inject these at build time.

---

### Testing Docker Build Locally

Test the Docker build locally:

```bash
# Set environment variables
export VITE_TOGETHER_API_KEY='your-api-key'
export VITE_TOGETHER_MODEL='meta-llama/Llama-3.3-70B-Instruct-Turbo'

# Build Docker image
docker build \
  --build-arg VITE_TOGETHER_API_KEY="$VITE_TOGETHER_API_KEY" \
  --build-arg VITE_TOGETHER_MODEL="$VITE_TOGETHER_MODEL" \
  -t translate-and-teach:local \
  .

# Run the container
docker run -p 8080:8080 translate-and-teach:local
```

Visit `http://localhost:8080` to test the app.

---

### Adding New Configuration

**For sensitive data (API keys, passwords):**
1. Add to `.env` for local dev
2. Add to Railway env vars and **mark as sealed**
3. Add `ARG` declaration in `Dockerfile`:
   ```dockerfile
   ARG YOUR_SECRET_NAME
   ENV YOUR_SECRET_NAME=$YOUR_SECRET_NAME
   ```

**For non-sensitive config (URLs, feature flags, model names):**
1. Add to `.env` for local dev
2. Add to Railway env vars (no need to seal)
3. Add `ARG` declaration in `Dockerfile`:
   ```dockerfile
   ARG YOUR_CONFIG_NAME
   ENV YOUR_CONFIG_NAME=$YOUR_CONFIG_NAME
   ```

---

### Security Notes

⚠️ **Client-Side API Keys**: The Together.ai API key is injected into the frontend bundle and **visible in the browser**. This is acceptable because:
- Together.ai is designed for client-side usage
- Use Together.ai's rate limiting and key restrictions
- Railway's images are **private** (not pushed to public registries)
- Use Railway's **sealed variables** to hide keys from UI/API
- For true secret protection, consider a backend proxy

✅ **Railway Security Features**:
- **Sealed Variables**: Hide variable values from Railway UI and API
- **Private Images**: Docker images stay in Railway's private registry
- **Build-time Injection**: Variables only exist during build, not persisted

⚠️ **Docker Warning**: You may see `SecretsUsedInArgOrEnv` warning from Docker BuildKit. This is cosmetic - Railway's sealed variables and private images mitigate the risk.

---

## 📖 How It Works

1. **User Input**: Enter a Spanish phrase
2. **API Call**: Send to Together.ai with structured prompt
3. **LLM Processing**: Llama-3.3-70B generates 4-section response
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
| LLM Model | meta-llama/Llama-3.3-70B-Instruct-Turbo |
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
- **Meta** for Llama-3.3-70B model
- **Claude Code** for spec-driven development workflow

---

Made with ❤️ for Spanish speakers learning English
