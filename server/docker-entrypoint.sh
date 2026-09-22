#!/bin/sh
set -eu
mkdir -p /data/media
chown -R node:node /data/media
exec runuser -u node -- node dist/index.js
