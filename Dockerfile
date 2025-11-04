FROM nimlang/nim:2.2.6-alpine-regular AS builder
RUN apk add --no-cache sqlite-static openssl-libs-static
WORKDIR /app
COPY . .
RUN nimble install db_connector
RUN nim c \
    -d:release \
    -d:danger \
    -d:ssl \
    -d:openssl3 \
    --define:sslVersion=3.0.0 \
    --opt:size \
    --passC:-static \
    --passL:"-static" \
    --dynlibOverride:sqlite3 \
    --dynlibOverride:ssl \
    --dynlibOverride:crypto \
    --passL:"/usr/lib/libsqlite3.a" \
    --passL:"/usr/lib/libssl.a" \
    --passL:"/usr/lib/libcrypto.a" \
    --out:fetcher \
    src/fetcher.nim

FROM scratch
COPY --from=builder /tmp /tmp
COPY --from=builder /app/fetcher /app/fetcher
WORKDIR /app
