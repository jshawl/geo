#!/bin/bash

set -a
source .env
set +a

scp \
    .env \
    docker-compose.yml \
    $DEPLOYMENT_HOST:.

ssh $DEPLOYMENT_HOST "docker compose pull && docker compose up -d"
