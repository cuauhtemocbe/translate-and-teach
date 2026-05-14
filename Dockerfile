# ---------- Builder ----------
FROM node:22-alpine AS builder

# Non-sensitive config via build arg (model name is not a secret)
ARG VITE_TOGETHER_MODEL

RUN apk add --no-cache git
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Make build script available and executable
RUN mkdir -p /app/scripts
COPY scripts/build-with-secrets.sh /app/scripts/build-with-secrets.sh
RUN chmod +x /app/scripts/build-with-secrets.sh

# Build with secret mount (API key never stored in image layers)
# Secret is mounted at /run/secrets/VITE_TOGETHER_API_KEY during build only
RUN --mount=type=secret,id=VITE_TOGETHER_API_KEY \
    VITE_TOGETHER_MODEL=$VITE_TOGETHER_MODEL \
    /app/scripts/build-with-secrets.sh

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
