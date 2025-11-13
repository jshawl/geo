#!/bin/bash

set -a
source .env
set +a

scp -r \
    .env \
    docker-compose.yml \
    public \
    $DEPLOYMENT_HOST:.

ssh $DEPLOYMENT_HOST "docker compose pull && docker compose up -d"
