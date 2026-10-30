# ===== 生产环境 (mode: pro) =====
# npm run build / npm run build:pro
# Docker: npm run docker:pro:build && npm run docker:pro:up

VITE_APP_ENV=pro
VITE_APP_TITLE=音浪 SOUNDWAVE
VITE_BASE=/
VITE_SOURCEMAP=false
VITE_DEV_PORT=5174

# true：搜索、榜单与歌单、歌词、封面、评论走本站代理。false：这些直连曲库。播放地址和下载保存仍走本站。
VITE_USE_PROXY=true

VITE_KW_SEARCH_TARGET=http://search.kuwo.cn
VITE_KW_OPENAPI_TARGET=https://kuwo.cn
VITE_KW_NMOBI_TARGET=http://nmobi.kuwo.cn
VITE_KW_IMG_TARGET=https://img1.kuwo.cn
VITE_KW_CDN_TARGET=http://kw-er.kuwo.cn
VITE_KW_COMMENT_TARGET=https://ncomment.kuwo.cn
VITE_KW_WAPI_TARGET=http://wapi.kuwo.cn
