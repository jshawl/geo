FROM caddy:2.11-builder as builder

RUN xcaddy build \
    --with github.com/caddyserver/cache-handler

FROM caddy:2.11-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
COPY ./Caddyfile /etc/caddy/Caddyfile
