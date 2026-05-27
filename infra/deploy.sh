#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY="${SSH_KEY:-$HOME/.ssh/chatpilot-link-admin-key-01.pem}"
if [ ! -f "$KEY" ] && [ -f "$ROOT/../../secure/ssh/chatpilot-link/chatpilot-link-admin-key-01.pem" ]; then
  KEY="$ROOT/../../secure/ssh/chatpilot-link/chatpilot-link-admin-key-01.pem"
fi
if [ ! -f "$KEY" ] && [ -f "/c/CoreAI/secure/ssh/chatpilot-link/chatpilot-link-admin-key-01.pem" ]; then
  KEY="/c/CoreAI/secure/ssh/chatpilot-link/chatpilot-link-admin-key-01.pem"
fi

HOST="${DEPLOY_HOST:-ubuntu@179.237.68.196}"
REMOTE_DIR="/opt/bridge"
GATEWAY="${NGINX_CONTAINER:-chatpilot-link-gateway}"
NGINX_CONF="/opt/chatpilot-link-sync/nginx/conf.d/bridge.chatpilot.link.conf"

if [ ! -f "$KEY" ]; then
  echo "SSH key not found. Set SSH_KEY=..." >&2
  exit 1
fi

SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=no "$HOST")
SCP=(scp -i "$KEY" -o StrictHostKeyChecking=no)

echo "==> Syncing Bridge to $HOST:$REMOTE_DIR"
"${SSH[@]}" "sudo mkdir -p $REMOTE_DIR && sudo chown ubuntu:ubuntu $REMOTE_DIR"

tar -C "$ROOT" -cf - \
  --exclude node_modules \
  --exclude .git \
  --exclude extension/dist \
  --exclude '**/.cursor' \
  . | "${SSH[@]}" "tar -xf - -C $REMOTE_DIR"

TOKEN="$("${SSH[@]}" "test -f $REMOTE_DIR/infra/.env && grep ^BRIDGE_API_TOKEN= $REMOTE_DIR/infra/.env | cut -d= -f2 || true")"
if [ -z "$TOKEN" ]; then
  TOKEN=$(openssl rand -hex 32)
fi

"${SSH[@]}" "cat > $REMOTE_DIR/infra/.env" <<EOF
NODE_ENV=production
BRIDGE_API_HOST=0.0.0.0
BRIDGE_API_PORT=3847
BRIDGE_API_TOKEN=$TOKEN
BRIDGE_MAX_ACCESS=1
BRIDGE_PUBLIC_URL=https://bridge.chatpilot.link
EOF

echo "==> Building Docker image on server"
"${SSH[@]}" "cd $REMOTE_DIR/infra && docker compose -f docker-compose.prod.yml up -d --build"

echo "==> Installing nginx vhost"
"${SCP[@]}" "$ROOT/infra/nginx/bridge.chatpilot.link.conf" "$HOST:/tmp/bridge.chatpilot.link.conf"
"${SSH[@]}" "sudo cp /tmp/bridge.chatpilot.link.conf $NGINX_CONF && sudo chown root:root $NGINX_CONF"

echo "==> Expanding TLS cert for bridge.chatpilot.link"
"${SSH[@]}" "sudo certbot certonly --webroot -w /var/www/certbot --non-interactive --agree-tos --expand \
  -d chatpilot.link -d www.chatpilot.link -d design.chatpilot.link -d bridge.chatpilot.link \
  --cert-name chatpilot.link || true"

echo "==> Connecting gateway to bridge network"
"${SSH[@]}" "docker network connect chatpilot-link-sync_chatpilot-net $GATEWAY 2>/dev/null || true"

echo "==> Reloading nginx gateway"
"${SSH[@]}" "docker exec $GATEWAY nginx -t && docker exec $GATEWAY nginx -s reload"

echo "==> Health check"
sleep 3
"${SSH[@]}" "curl -sf http://bridge-api:3847/api/v1/health -H 'Host: bridge.chatpilot.link' 2>/dev/null || docker exec $GATEWAY wget -qO- http://bridge-api:3847/api/v1/health"

echo ""
echo "Deploy complete."
echo "  URL:   https://bridge.chatpilot.link/"
echo "  API:   https://bridge.chatpilot.link/api/v1/health"
echo "  Token: $TOKEN"
echo "  Save token in mobile app Settings → API Token"
