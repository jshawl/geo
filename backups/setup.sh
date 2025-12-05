#!/bin/bash

# docker run --rm --entrypoint bash --env-file .env backups -c '/app/setup.sh'

export AWS_ACCESS_KEY_ID=$ADMIN_AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY=$ADMIN_AWS_SECRET_ACCESS_KEY

echo "current policy for s3://$AWS_BUCKET_NAME:"
aws s3api get-bucket-lifecycle --bucket $AWS_BUCKET_NAME --endpoint-url $AWS_ENDPOINT_URL

if [[ "$1" == "put" ]];then
  aws s3api put-bucket-lifecycle-configuration \
    --bucket $AWS_BUCKET_NAME \
    --endpoint-url $AWS_ENDPOINT_URL \
    --lifecycle-configuration '{
      "Rules": [{
        "ID": "DeleteOldBackups",
        "Status": "Enabled",
        "Prefix": "backups/",
        "Expiration": { "Days": 30 }
      }]
    }'
else
  echo "rerun this command with 'put' to set the lifecycle policy:"
  echo ""
  printf "\tdocker run --rm --entrypoint bash --env-file .env backups -c '/app/setup.sh put'\n\n"
fi
