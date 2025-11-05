FROM nimlang/nim:2.2.6-alpine-regular AS builder
RUN apk add --no-cache sqlite-static openssl-libs-static
WORKDIR /app
COPY . .
RUN nimble install

FROM scratch
COPY --from=builder /tmp /tmp
COPY --from=builder /app/fetcher /app/fetcher
WORKDIR /app
