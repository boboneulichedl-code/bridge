#!/usr/bin/env bash
set -euo pipefail
GATEWAY="${NGINX_CONTAINER:-chatpilot-link-gateway}"
NET="${BRIDGE_NETWORK:-chatpilot-link-sync_chatpilot-net}"
if docker inspect "$GATEWAY" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' | grep -q "$NET"; then
  echo "Gateway already connected to $NET"
else
  docker network connect "$NET" "$GATEWAY"
  echo "Connected $GATEWAY to $NET"
fi
