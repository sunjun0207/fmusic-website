# ===== 生产环境 (mode: pro) =====
# npm run build / npm run build:pro
# Docker: npm run docker:pro:build && npm run docker:pro:up

VITE_APP_ENV=pro
VITE_APP_TITLE=聆听 jun.sun
VITE_BASE=/
VITE_SOURCEMAP=false
VITE_DEV_PORT=5174

VITE_KW_SEARCH_TARGET=http://search.kuwo.cn
VITE_KW_OPENAPI_TARGET=https://kuwo.cn
VITE_KW_NMOBI_TARGET=http://nmobi.kuwo.cn
VITE_KW_IMG_TARGET=https://img1.kuwo.cn
VITE_KW_CDN_TARGET=http://kw-er.kuwo.cn
VITE_KW_COMMENT_TARGET=https://ncomment.kuwo.cn
