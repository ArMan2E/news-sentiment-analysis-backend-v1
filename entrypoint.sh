#!/bin/bash

echo "Starting application..."
echo "NODE_ENV=$NODE_ENV"
fvm current
#login in to fluvio cloud
fluvio cloud login --email $FLUVIO_CLOUD_EMAIL --password $FLUVIO_CLOUD_PASSWORD

# sync configs
fluvio cloud cluster sync

#start the app
bun run index.ts