# Base image
FROM oven/bun:1.4.2-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build TypeScript if needed (using bun run build if you have a build script)
# RUN bun run build

EXPOSE 5000

CMD ["bun", "run", "server.ts"]
