FROM node:24-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS base
WORKDIR /app
RUN npm install --global pnpm@12

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

FROM deps AS migrate
COPY drizzle ./drizzle
COPY src/db/migrate.mts src/db/cleanup.mts ./
USER node
CMD ["node", "migrate.mts"]

FROM node:24-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=:: \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1
COPY --chown=node:node public ./public
COPY --chown=node:node .next/standalone ./
COPY --chown=node:node .next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
