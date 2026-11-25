# ---------- Builder ----------
FROM node:26.13.1-alpine3.24@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS builder

# Railway injects environment variables at build time
# Declare them with ARG to make them available in the build.
# Only the model label shown in the footer is a build-time value. The provider
# credential is deliberately NOT declared here: Vite would inline it into dist/
# and ship it to every visitor. It is a runtime variable of the server below.
ARG TOGETHER_MODEL

RUN apk add --no-cache git
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Node 26 no longer bundles corepack by default; install it explicitly before enabling it
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Pass the build arg to the environment for Vite
ENV TOGETHER_MODEL=$TOGETHER_MODEL

RUN pnpm run typecheck && pnpm run build

# ---------- Production ----------
FROM node:26.13.1-alpine3.24@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS production

RUN apk add --no-cache curl
ENV NODE_ENV=production
ENV PORT=8080

# The server (server/) uses only node:http, so the image needs no npm packages and
# npm itself is not needed at runtime. Drop it so its bundled deps
# (brace-expansion, undici, ...) don't ship in the production image.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# Create user without privileges
RUN adduser -D -u 10001 nodeuser

WORKDIR /app

# Copy built application and the server that serves it and proxies /api/translate
COPY --from=builder --chown=nodeuser:nodeuser /app/dist ./dist
COPY --from=builder --chown=nodeuser:nodeuser /app/server ./server

USER nodeuser

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Runtime variables read by the server: TOGETHER_API_KEY, TOGETHER_MODEL (set them
# on the service, never as build args). Node runs the TypeScript directly.
CMD ["node", "server/index.ts"]
