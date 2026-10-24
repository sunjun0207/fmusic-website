#!/bin/sh
set -eu

AVAILABLE=/etc/nginx/templates-available
TEMPLATES=/etc/nginx/templates
SNIPPETS=/etc/nginx/snippets
SSL_DIR=/etc/nginx/ssl

log() { echo "[fmusic-website] $*"; }
die() { echo "[fmusic-website] ERROR: $*" >&2; exit 1; }

required="VITE_KW_SEARCH_TARGET VITE_KW_OPENAPI_TARGET VITE_KW_NMOBI_TARGET VITE_KW_IMG_TARGET VITE_KW_CDN_TARGET VITE_KW_COMMENT_TARGET"
for v in $required; do
  eval "val=\${$v:-}"
  [ -n "$val" ] || die "缺少环境变量 $v（compose 需通过 env_file 加载 .env.dev / .env.test / .env.pro）"
  case "$val" in
    http://*|https://*) ;;
    *) die "$v=$val 必须以 http:// 或 https:// 开头" ;;
  esac
done

mkdir -p "$TEMPLATES" "$SNIPPETS"
whitelist='${VITE_KW_SEARCH_TARGET} ${VITE_KW_OPENAPI_TARGET} ${VITE_KW_NMOBI_TARGET} ${VITE_KW_IMG_TARGET} ${VITE_KW_CDN_TARGET} ${VITE_KW_COMMENT_TARGET}'
envsubst "$whitelist" \
  < "$AVAILABLE/app-locations.conf.template" \
  > "$SNIPPETS/app-locations.conf"
log "已渲染 app-locations.conf"

rm -f "$TEMPLATES"/*.template
if [ "${SSL_ENABLED:-false}" = "true" ]; then
  for f in fullchain.pem privkey.pem; do
    [ -s "$SSL_DIR/$f" ] || die "SSL_ENABLED=true 但 $SSL_DIR/$f 不存在或为空"
  done
  cp "$AVAILABLE/http-redirect.conf.template" "$TEMPLATES/00-http.conf.template"
  cp "$AVAILABLE/https.conf.template" "$TEMPLATES/10-https.conf.template"
  log "HTTPS 已启用: server_name=${SERVER_NAME:-_}"
else
  cp "$AVAILABLE/http.conf.template" "$TEMPLATES/00-http.conf.template"
  log "仅 HTTP: server_name=${SERVER_NAME:-_}"
fi
