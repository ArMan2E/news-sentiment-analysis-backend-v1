#!/bin/bash

echo "Starting application..."
echo "NODE_ENV=$NODE_ENV"
source /root/.fvm/env

fvm current
#login in to fluvio cloud
fluvio cloud login --email $FLUVIO_CLOUD_EMAIL --password $FLUVIO_CLOUD_PASSWORD

# sync configs
fluvio cloud cluster sync
#download sm in the docker
fluvio hub sm download fluvio/rss-json@0.1.0
#start the app
exec bun run index.js