#!/bin/bash

set -e

SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
IMAGE=$(sed -n 's/^FROM \([^ ]*\).*/\1/p; q' "$SCRIPT_DIR/Dockerfile")

docker build -t proxy $SCRIPT_DIR

test_conf() {
    echo "🧪 testing $SCRIPT_DIR/Caddyfile"
    docker run -e AUTO_HTTPS=off --rm \
        -v $SCRIPT_DIR/Caddyfile:/etc/caddy/Caddyfile \
        --entrypoint sh proxy \
        -c "caddy validate --config /etc/caddy/Caddyfile"
    echo -e "✅ Caddyfile is ok\n"
}

cleanup() {
    exit_code=$?
    if [ $exit_code -ne 0 ]; then
        echo "❌ test failed with exit code $exit_code"
    fi
}

trap cleanup EXIT

test_conf
