# Production image for the KRS / AURIX website (Next.js + Payload CMS)
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# NEXT_PUBLIC_* values are inlined into the client bundle at build time
ARG NEXT_PUBLIC_SITE_URL=https://kalamroboticssociety.com
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN NODE_OPTIONS=--max-old-space-size=3072 npm run build \
 && npm prune --omit=dev --no-audit --no-fund

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3003 \
    NODE_OPTIONS=--max-old-space-size=1024

COPY --from=build --chown=node:node /app/package.json /app/next.config.mjs ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/src ./src

RUN mkdir -p /app/logs /app/public/uploads /app/.private_uploads \
 && chown -R node:node /app/logs /app/public/uploads /app/.private_uploads

USER node
EXPOSE 3003
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3003"]
