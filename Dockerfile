# ---------- Builder ----------
FROM node:22-alpine AS builder

# Accept build-time environment variables from Railway
ARG VITE_TOGETHER_API_KEY
ARG VITE_TOGETHER_MODEL

RUN apk add --no-cache git
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Make env vars available to Vite during build
ENV VITE_TOGETHER_API_KEY=$VITE_TOGETHER_API_KEY
ENV VITE_TOGETHER_MODEL=$VITE_TOGETHER_MODEL

RUN pnpm run typecheck && pnpm run build

# ---------- Production ----------
FROM node:22-alpine AS production

RUN apk add --no-cache curl
ENV NODE_ENV=production
ENV PORT=8080

# Install serve globally BEFORE switching users
RUN npm install -g serve

# Create user without privileges
RUN adduser -D -u 10001 nodeuser

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodeuser:nodeuser /app/dist ./dist

USER nodeuser

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

CMD ["serve", "-s", "dist", "-l", "8080"]
