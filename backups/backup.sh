#!/bin/bash

while true; do
    sleep 11800
    mkdir -p db/backups/
    backup_db_path="db/backups/$(date +"%Y%m%d-%H%M%S").db"
    echo "[$(date -u +"%FT%T")] creating backup..."
    sqlite3 db/app.db "VACUUM INTO '$backup_db_path';"
    echo "[$(date -u +"%FT%T")] syncing to s3..."
    aws s3 sync /app/db/backups/ s3://$AWS_BUCKET_NAME/backups/ --endpoint-url $AWS_ENDPOINT_URL
    echo "[$(date -u +"%FT%T")] sync to s3 completed."
    rm -rf db/backups/
    sleep 74600
done
