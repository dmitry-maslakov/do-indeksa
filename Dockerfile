FROM node:24-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20 AS migrate
WORKDIR /app
COPY drizzle ./drizzle
COPY dist ./
USER node
CMD ["node", "migrate.mjs"]

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
