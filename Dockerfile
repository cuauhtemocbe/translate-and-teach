# ---------- Builder ----------
FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS builder

# Railway injects environment variables at build time
# Declare them with ARG to make them available in the build
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

# Pass build args to environment variables for Vite
# Note: Use Railway's "sealed variables" feature for extra security
# Sealed variables are hidden from Railway UI/API but available during builds
ENV VITE_TOGETHER_API_KEY=$VITE_TOGETHER_API_KEY
ENV VITE_TOGETHER_MODEL=$VITE_TOGETHER_MODEL

RUN pnpm run typecheck && pnpm run build

# ---------- Production ----------
FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS production

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
