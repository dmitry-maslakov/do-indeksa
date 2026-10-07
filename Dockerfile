# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv

FROM node:24-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS base
WORKDIR /app
RUN npm install --global pnpm@12

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA \
    NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL=postgres://build:build@localhost:5432/build \
    BETTER_AUTH_SECRET=build-only-not-a-secret-build-only \
    BETTER_AUTH_URL=http://localhost:3000 \
    GOOGLE_CLIENT_ID=build-only \
    GOOGLE_CLIENT_SECRET=build-only
RUN --mount=type=cache,target=/app/.next/cache pnpm build

FROM deps AS migrate
COPY drizzle.config.ts ./
COPY drizzle ./drizzle
COPY src/db ./src/db
CMD ["pnpm", "exec", "drizzle-kit", "migrate"]

FROM node:24-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=:: \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
