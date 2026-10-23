# 聆听 jun.sun 官网（fmusic-website）

jun.sun 的官方站点。页面有发现音乐、排行榜、歌单、歌手、新碟和搜索。搜索走曲库，开发时由 Vite 把 `/proxy/*` 转发到酷我。

## 快速开始

需要 **Node.js ≥ 18**。

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5174/#/discover`。改完 `.env.local` 后需要重启 `npm run dev`，搜索代理才会生效。

```bash
npm run build
npm run preview
```

## 页面

| 地址 | 内容 |
|------|------|
| `#/discover` | 推荐：轮播、热门歌单、新碟、编辑榜单 |
| `#/toplist` | 排行榜 |
| `#/playlists` | 歌单，可用 `?tag=夜晚` 等筛选 |
| `#/playlist/night` | 歌单详情 |
| `#/artists` | 歌手 |
| `#/artist/jay` | 歌手详情 |
| `#/albums` | 新碟上架 |
| `#/album/fantasy` | 专辑详情 |
| `#/download` | 听歌说明 |
| `#/about` | 关于 |
| `#/search?q=周杰伦` | 搜索曲库，可加 `&page=2` |
| `#/search?q=十年&page=2` | 搜索结果分页，点击歌曲播放，有 MV 的曲目可看视频 |

路由使用 hash，静态托管时不需要服务端重写。播放和下载还依赖 `/proxy/kw-nmobi`、`/proxy/kw-audio`。Docker 部署会按环境文件把这些路径反代出去。

## 环境

`.env.local`、`.env.dev`、`.env.test`、`.env.pro` 变量相同，按 Vite mode 覆盖。`npm run dev` 只用 `.env.local`。

| 文件 | 命令 | Docker |
|------|------|--------|
| `.env.dev` | `npm run build:dev` | `npm run docker:dev:up`，默认 `8080` / `8443` |
| `.env.test` | `npm run build:test` | `npm run docker:test:up`，默认 `8090` / `8453` |
| `.env.pro` | `npm run build` | `npm run docker:pro:up`，默认 `80` / `443` |

证书放在 `docker/<env>/ssl/fullchain.pem` 和 `privkey.pem`。`/proxy/kw-nmobi` 会带 `User-Agent: okhttp/3.10.0`。

| 变量 | 说明 |
|------|------|
| `VITE_KW_SEARCH_TARGET` | 歌曲搜索，默认 `http://search.kuwo.cn` |
| `VITE_KW_OPENAPI_TARGET` | 搜索联想，默认 `https://kuwo.cn` |
| `VITE_KW_IMG_TARGET` | 封面图，默认 `https://img1.kuwo.cn` |
| `VITE_KW_NMOBI_TARGET` | 歌曲和 MV 播放地址，默认 `http://nmobi.kuwo.cn` |
| `VITE_KW_CDN_TARGET` | 音频 CDN，默认 `http://kw-er.kuwo.cn` |
| `VITE_DEV_PORT` | 开发端口，默认 `5174` |

## 技术栈

React 19 · Vite 6 · TypeScript · 纯 CSS（Syne + Noto Sans SC）
