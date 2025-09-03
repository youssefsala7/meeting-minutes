# 1) install deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# use ci when lockfile exists, otherwise fall back to install
RUN npm ci || npm install

# 2) build + export static site
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Build then export to /app/out
RUN npm run build && npx next export -o out

# 3) serve exported site
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN npm i -g serve
COPY --from=build /app/out ./out
EXPOSE 3000
# healthcheck hits the exported index
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/index.html || exit 1
CMD sh -c "serve -s out -l ${PORT:-3000}"
