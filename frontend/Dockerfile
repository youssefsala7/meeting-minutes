# 1) install deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# try ci when lockfile exists, otherwise install
RUN npm ci || npm install

# 2) build (Next creates /app/out automatically because output:'export')
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) serve the exported static site
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN npm i -g serve
# copy the pre-rendered site
COPY --from=build /app/out ./out
EXPOSE 3000

# healthcheck the root (serve -s out maps "/" to index.html)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

# bind to all interfaces for Coolify
CMD ["sh","-c","serve -s out -l tcp://0.0.0.0:${PORT:-3000}"]
