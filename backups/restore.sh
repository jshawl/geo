#!/bin/bash

# docker build -t backups backups && docker run --rm --entrypoint bash --env-file .env -v ./db:/app/db backups -c '/app/restore.sh'

mkdir -p db
export AWS_ENDPOINT_URL_S3=$AWS_ENDPOINT_URL
export AWS_S3_ADDRESSING_STYLE=path

latest_backup=$(aws s3 ls s3://$AWS_BUCKET_NAME/backups/ --endpoint-url $AWS_ENDPOINT_URL | sort | tail -n 1 | awk '{print $4}')
echo $latest_backup | xargs -I {} aws s3 cp --endpoint-url $AWS_ENDPOINT_URL s3://$AWS_BUCKET_NAME/backups/{} /app/db/restored.db
