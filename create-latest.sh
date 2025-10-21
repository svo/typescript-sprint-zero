#!/usr/bin/env bash

image=$1

docker manifest rm "svanosselaer/typescript-sprint-zero-${image}:latest" 2>/dev/null || true

docker manifest create \
  "svanosselaer/typescript-sprint-zero-${image}:latest" \
  --amend "svanosselaer/typescript-sprint-zero-${image}:amd64" \
  --amend "svanosselaer/typescript-sprint-zero-${image}:arm64" &&
docker manifest push "svanosselaer/typescript-sprint-zero-${image}:latest"
