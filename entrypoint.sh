#!/bin/bash

#login in to fluvio cloud
fluvio cloud login --email $FLUVIO_CLOUD_EMAIL --password $FLUVIO_CLOUD_PASSOWORD

# sync configs
fluvio cloud cluster sync

#start the app
