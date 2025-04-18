#!/bin/bash

#cdk 
HTTP_SOURCE_DIR="."

#cdk deploy list | tail -n 5

# Script to shutdown all stopped CDK deployments

cdk deploy list | awk 'NR>1 && $2=="Running" {print "cdk deploy shutdown --name ", $1}' | while read cmd; do
  echo "Executing: $cmd"
  eval "$cmd"
done
