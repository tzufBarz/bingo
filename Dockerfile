FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

FROM base AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD [ "node", "server.js" ]

LABEL org.opencontainers.image.source=https://github.com/tzufBarz/bingo
LABEL org.opencontainers.image.description="Online bingo"
