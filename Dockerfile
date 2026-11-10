# React Frontend
FROM node:26-alpine AS builder

WORKDIR /app/client
COPY client/package.json .
RUN npm install
COPY client/ .
RUN npm run build

# Backend Server
FROM node:26-alpine

RUN apk add --no-cache docker-cli

ENV NODE_ENV=production
WORKDIR /app
COPY server/package.json .
RUN npm install
COPY server/ .

COPY --from=builder /app/client/dist ./public

EXPOSE 3000
CMD ["node", "index.js"]