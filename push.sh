#!/usr/bin/env bash

image=$1 &&
architecture=$2 &&

if [ -z "$architecture" ]; then
  docker push "svanosselaer/typescript-sprint-zero-${image}" --all-tags
else
  docker push "svanosselaer/typescript-sprint-zero-${image}:${architecture}"
fi
