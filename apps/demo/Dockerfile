FROM node:25-alpine AS builder
RUN corepack enable pnpm

WORKDIR /build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY packages/ packages/
COPY apps/demo/ apps/demo/

RUN pnpm install --frozen-lockfile
RUN pnpm nx build demo

FROM node:25-alpine AS runner
RUN addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup

WORKDIR /app
COPY --from=builder --chown=appuser:appgroup /build/dist/apps/demo ./

RUN corepack enable pnpm && (pnpm install --prod --frozen-lockfile || npm install --omit=dev)

USER appuser
EXPOSE 3000
CMD ["node", "main.js"]
