# Production image for the KRS / AURIX website (Next.js + Payload CMS).
# Next.js "standalone" output + Alpine runtime: only the traced server files are shipped,
# not the whole node_modules (~2.1 GB -> a few hundred MB).
FROM node:22-alpine AS build
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# NEXT_PUBLIC_* values are inlined into the client bundle at build time
ARG NEXT_PUBLIC_SITE_URL=https://kalamroboticssociety.com
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN NODE_OPTIONS=--max-old-space-size=3072 npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3003 \
    HOSTNAME=0.0.0.0 \
    NODE_OPTIONS=--max-old-space-size=1024

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

RUN mkdir -p /app/logs /app/public/uploads /app/.private_uploads \
 && chown -R node:node /app/logs /app/public/uploads /app/.private_uploads

USER node
EXPOSE 3003
CMD ["node", "server.js"]
