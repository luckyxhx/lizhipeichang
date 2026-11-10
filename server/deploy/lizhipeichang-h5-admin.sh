#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  exec sudo -- "$0" "$@"
fi

set -a
. /etc/lizhipeichang-h5.env
set +a

/usr/bin/node /opt/lizhipeichang-h5/current/server/admin-codes.mjs "$@"

if [[ -f "${AUTH_DATA_FILE}" ]]; then
  chown www-data:www-data "${AUTH_DATA_FILE}"
  chmod 0640 "${AUTH_DATA_FILE}"
fi
