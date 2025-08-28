FROM node:22 AS base

# Setup pnpm environment
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm i -g pnpm

WORKDIR /app

# Dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prefer-frozen-lockfile

# Disable Next.js spying telemetry
# Learn more here: https://nextjs.org/telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Build
COPY . .
RUN pnpm build

# Set NODE_ENV to production
ENV NODE_ENV=production

VOLUME /app/data
ENV DATA_DIR=/app/data

# Exposed port (for orchestrators and dynamic reverse proxies)
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run the nextjs app
CMD ["pnpm", "start"]
