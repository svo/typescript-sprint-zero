#!/usr/bin/env bash

image=$1 &&

docker manifest create \
  "svanosselaer/typescript-sprint-zero-${image}:latest" \
  --amend "svanosselaer/typescript-sprint-zero-${image}:amd64" \
  --amend "svanosselaer/typescript-sprint-zero-${image}:arm64" &&
docker manifest push "svanosselaer/typescript-sprint-zero-${image}:latest"
