# ---------- Builder ----------
FROM node:26-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS builder

# Railway injects environment variables at build time
# Declare them with ARG to make them available in the build
ARG VITE_TOGETHER_API_KEY
ARG VITE_TOGETHER_MODEL

RUN apk add --no-cache git
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Node 26 no longer bundles corepack by default; install it explicitly before enabling it
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Pass build args to environment variables for Vite
# Note: Use Railway's "sealed variables" feature for extra security
# Sealed variables are hidden from Railway UI/API but available during builds
ENV VITE_TOGETHER_API_KEY=$VITE_TOGETHER_API_KEY
ENV VITE_TOGETHER_MODEL=$VITE_TOGETHER_MODEL

RUN pnpm run typecheck && pnpm run build

# ---------- Production ----------
FROM node:26-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS production

RUN apk add --no-cache curl
ENV NODE_ENV=production
ENV PORT=8080

# Install serve BEFORE switching users, from a pinned manifest + lockfile.
# serve@14.2.6 pins compression 1.8.1 (CVE-2026-87776, fixed in 1.8.2) and no
# serve release depends on the fix yet, so docker/serve/package.json overrides it.
# Drop the override once serve ships with compression >= 1.8.2.
# npm is only needed for this install; drop it so its bundled deps
# (brace-expansion, undici, ...) don't ship in the production image.
WORKDIR /opt/serve
COPY docker/serve/package.json docker/serve/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && ln -s /opt/serve/node_modules/.bin/serve /usr/local/bin/serve \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

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
