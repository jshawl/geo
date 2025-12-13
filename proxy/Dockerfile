# FROM caddy:2.11-builder AS builder

# RUN xcaddy build \
#     --with github.com/caddyserver/cache-handler

# FROM caddy:2.11-alpine
# COPY --from=builder /usr/bin/caddy /usr/bin/caddy
FROM ghcr.io/jshawl/geo-proxy:main@sha256:c4c68a7fa2aaa689bb42de719f63a3e584d8e2c78bdcade0fcc4d73ae453cdf2
COPY ./Caddyfile /etc/caddy/Caddyfile
