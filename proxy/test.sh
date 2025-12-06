#!/bin/bash

set -e

SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
IMAGE=$(sed -n 's/^FROM \([^ ]*\).*/\1/p' "$SCRIPT_DIR/Dockerfile")

docker pull $IMAGE

test_conf() {
    echo "🧪 testing $SCRIPT_DIR/$1"
    docker run --rm \
        --add-host="server:127.0.0.1" \
        --add-host="frontend:127.0.0.1" \
        -v $SCRIPT_DIR/$1:/etc/nginx/nginx.conf \
        --entrypoint bash nginx:1.29.3 \
        -c "nginx -t"
    echo -e "✅ $1 is ok\n"
}

cleanup() {
    exit_code=$?
    if [ $exit_code -ne 0 ]; then
        echo "❌ test failed with exit code $exit_code"
    fi
}

trap cleanup EXIT

test_conf nginx.dev.conf
test_conf nginx.conf
