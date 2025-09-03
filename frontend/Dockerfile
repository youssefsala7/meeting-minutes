# 1) install deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install

# 2) build (Next 14 with output:'export' writes to /app/out)
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) serve the static export
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# tools for serving & healthcheck
RUN npm i -g serve && apk add --no-cache curl

# copy site
COPY --from=build /app/out ./out

EXPOSE 3000

# healthcheck (give it time to come up)
HEALTHCHECK --interval=15s --timeout=5s --start-period=75s --retries=6 \
  CMD curl -fsS http://127.0.0.1:${PORT:-3000}/ || exit 1

# bind to all interfaces for Coolify
CMD ["sh","-c","serve -s out -l tcp://0.0.0.0:${PORT:-3000}"]
