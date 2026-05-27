FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY api/package.json api/
COPY web/package.json web/
COPY cli/package.json cli/
COPY mcp-server/package.json mcp-server/
COPY extension/package.json extension/

RUN npm ci

COPY shared/ shared/
COPY api/ api/
COPY web/ web/
COPY cli/ cli/
COPY mcp-server/ mcp-server/
COPY scripts/ scripts/
COPY bridge.version.json bridge.version.json
COPY integrations/ integrations/

RUN npm run build --workspace=@bridge/shared --workspace=bridge-api --workspace=bridge-web \
 && node scripts/generate-version.js \
 && node scripts/generate-catalog.js

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV BRIDGE_API_HOST=0.0.0.0
ENV BRIDGE_API_PORT=3847

RUN addgroup -S bridge && adduser -S bridge -G bridge

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/web/dist ./web/dist
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/bridge.version.json ./
COPY --from=builder /app/integrations ./integrations

USER bridge

EXPOSE 3847

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3847/api/v1/health || exit 1

CMD ["node", "api/dist/server.js"]
