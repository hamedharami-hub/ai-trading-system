FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate

FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY apps/local-trading-node ./apps/local-trading-node
COPY apps/pwa ./apps/pwa

RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app ./

ENV NODE_ENV=production
ENV NODE_HOST=0.0.0.0
ENV NODE_PORT=8765

EXPOSE 8765 3000

CMD ["pnpm", "--filter", "@trade/local-trading-node", "start"]
