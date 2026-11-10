#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer as root." >&2
  exit 1
fi

PACKAGE_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
APP_ROOT="/opt/lizhipeichang-h5"
DATA_ROOT="/var/lib/lizhipeichang-h5"
ENV_FILE="/etc/lizhipeichang-h5.env"
SERVICE_FILE="/etc/systemd/system/lizhipeichang-h5.service"
GATEWAY_CONF="${GATEWAY_CONF:-/home/ubuntu/refa-saas/infrastructure/nginx/gateway.conf}"
GATEWAY_CONTAINER="${GATEWAY_CONTAINER:-refa-saas-gateway-1}"
NODE_BIN="$(command -v node || true)"

if [[ -z "${NODE_BIN}" ]]; then
  echo "Node.js is required but was not found on PATH." >&2
  exit 1
fi

if [[ ! -f "${PACKAGE_DIR}/deploy/lizhipeichang-h5.env" ]]; then
  echo "Missing deploy/lizhipeichang-h5.env in release package." >&2
  exit 1
fi

if [[ ! -f "${PACKAGE_DIR}/server/index.mjs" ]]; then
  echo "Missing server/index.mjs in release package." >&2
  exit 1
fi

if [[ ! -f "${PACKAGE_DIR}/client/index.html" ]]; then
  echo "Missing client/index.html in release package." >&2
  exit 1
fi

if ! id www-data >/dev/null 2>&1; then
  useradd --system --home /var/www --shell /usr/sbin/nologin www-data
fi

RELEASE_ID="$(date +%Y%m%d%H%M%S)"
RELEASE_DIR="${APP_ROOT}/releases/${RELEASE_ID}"

install -d -m 0755 "${APP_ROOT}/releases"
install -d -m 0755 "${DATA_ROOT}"
install -d -o www-data -g www-data -m 0750 "${DATA_ROOT}"
install -d -m 0755 "${RELEASE_DIR}"

cp -a "${PACKAGE_DIR}/server" "${RELEASE_DIR}/server"
cp -a "${PACKAGE_DIR}/client" "${RELEASE_DIR}/client"

ln -s "${RELEASE_DIR}" "${APP_ROOT}/current.next"
mv -Tf "${APP_ROOT}/current.next" "${APP_ROOT}/current"

install -m 0600 -o root -g root \
  "${PACKAGE_DIR}/deploy/lizhipeichang-h5.env" \
  "${ENV_FILE}"
sed -i 's/\r$//' "${ENV_FILE}"

if [[ -f /etc/letsencrypt/live/h5.shuzi8.com/fullchain.pem ]]; then
  sed -i 's/^COOKIE_SECURE=.*/COOKIE_SECURE=true/' "${ENV_FILE}"
else
  sed -i 's/^COOKIE_SECURE=.*/COOKIE_SECURE=false/' "${ENV_FILE}"
fi

install -m 0755 "${PACKAGE_DIR}/deploy/lizhipeichang-h5-admin.sh" \
  /usr/local/bin/lizhipeichang-h5-admin

sed "s|__NODE_BIN__|${NODE_BIN}|g" \
  "${PACKAGE_DIR}/deploy/lizhipeichang-h5.service.template" \
  > "${SERVICE_FILE}"
chmod 0644 "${SERVICE_FILE}"

systemctl daemon-reload
systemctl enable lizhipeichang-h5.service
systemctl restart lizhipeichang-h5.service

if [[ -f "${GATEWAY_CONF}" ]]; then
  if [[ -f /etc/letsencrypt/live/h5.shuzi8.com/fullchain.pem ]]; then
    GATEWAY_SNIPPET="${PACKAGE_DIR}/deploy/gateway-h5.conf"
  else
    GATEWAY_SNIPPET="${PACKAGE_DIR}/deploy/gateway-h5-http.conf"
  fi

  cp -a "${GATEWAY_CONF}" "${GATEWAY_CONF}.bak.$(date +%Y%m%d%H%M%S)"
  sed -i '/# BEGIN lizhipeichang-h5/,/# END lizhipeichang-h5/d' "${GATEWAY_CONF}"
  printf '\n' >> "${GATEWAY_CONF}"
  cat "${GATEWAY_SNIPPET}" >> "${GATEWAY_CONF}"

  if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
    ufw allow from 172.19.0.0/16 to any port 3010 proto tcp comment 'lizhipeichang gateway' >/dev/null
  fi

  # A bind-mounted single file keeps the old inode after sed -i, so recreate
  # the container to make the gateway pick up the updated configuration.
  docker restart "${GATEWAY_CONTAINER}" >/dev/null
else
  echo "Gateway config not found at ${GATEWAY_CONF}; application is running on port 3010 only." >&2
fi

for _ in $(seq 1 20); do
  if curl --fail --silent http://127.0.0.1:3010/health >/dev/null; then
    echo "Deployment complete: ${RELEASE_DIR}"
    exit 0
  fi
  sleep 1
done

echo "Service did not pass health check. Run: journalctl -u lizhipeichang-h5 -n 100" >&2
exit 1
