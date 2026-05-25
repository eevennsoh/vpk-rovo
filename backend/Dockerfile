FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json
RUN corepack enable && \
    corepack prepare pnpm@11.1.2 --activate && \
    pnpm install --prod --frozen-lockfile --config.strict-dep-builds=false && \
    cd backend && npm install --omit=dev --package-lock=false

COPY backend ./backend
COPY lib ./lib
COPY rovo ./rovo
COPY scripts/lib/worktree-ports.js ./scripts/lib/worktree-ports.js

# Copy the prebuilt Next.js export output (static HTML files).
# CI runs `pnpm run build:export` before building this runtime image.
COPY out ./backend/public

EXPOSE 8080

CMD ["node", "backend/server.js"]
