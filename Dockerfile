FROM nimlang/nim:2.2.6-alpine-regular AS builder
RUN apk add --no-cache musl-dev
WORKDIR /app
COPY . .
RUN nimble install db_connector
# Build dynamically linked against musl
RUN nim c \
    -d:release \
    -d:ssl \
    --opt:size \
    --out:fetcher \
    src/fetcher.nim

# Use Alpine as runtime - matches the builder's libc
FROM alpine:latest
# Install SQLite and OpenSSL runtime libraries
RUN apk add --no-cache sqlite-libs openssl
COPY --from=builder /app /app
ENTRYPOINT ["/app/fetcher"]