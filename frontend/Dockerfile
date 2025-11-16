FROM node:25 AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM alpine:3.14
COPY --from=builder /app/dist /app