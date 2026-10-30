# 聆听 jun.sun（fmusic-website）

聆听 jun.sun 是一个面向年轻人的潮流音乐社区，这里是它的电脑端网站，排版参考网易云音乐网页版。首页依次是品牌导航和搜索、主视觉 Banner、每日推荐、热门歌单、新歌首发、排行榜、音乐电台和音乐社区，底部固定播放器。浅色界面，主色 `#EC4141`；歌词页、MV 和封面大图保持深色。

开发时由 Vite 把 `/api-fmusic-pomelo7-server/*` 转发到酷我。数据来源：

- 榜单、歌单、歌手、专辑、Banner 和热搜来自酷我公开接口（`kw-wapi`）。榜单接口一次最多返回 30 首，超过 30 首时由 `fetchChartSongs` 分段请求再拼起来。
- 音乐社区展示的是酷我的歌曲热评，电台是按标签挑选的歌单。
- 每日推荐和私人专属电台根据本机的播放记录和收藏，再结合榜单生成。
- 收藏、自建歌单、昵称和播放记录都存在浏览器本地，没有账号系统。
- 会员中心在公测期间全部免费，不涉及支付。

## 快速开始

需要 **Node.js ≥ 18**。

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5174/#/home`。改完 `.env.local` 后需要重启 `npm run dev`，代理才会生效。

```bash
npm run build
npm run preview
```

## 页面

顶部导航：首页｜发现音乐｜排行榜｜歌单｜电台｜音乐社区｜会员中心。

| 地址 | 内容 |
|------|------|
| `#/home` | 首页，打开站点默认进入 |
| `#/discover` | 发现音乐：心情歌单、新碟、新歌、热门歌手、全球榜单、风格和场景 |
| `#/daily` | 每日推荐 |
| `#/toplist`、`#/toplist/16` | 排行榜，可直接打开某个榜单 |
| `#/playlists` | 歌单，可用 `?tag=<分类 id>`、`?order=new` 筛选 |
| `#/playlist/<id>` | 歌单详情 |
| `#/artists` | 歌手，可用 `?cat=<分类 id>` 筛选 |
| `#/artist/<id>` | 歌手详情，`?tab=albums` 看专辑，`?tab=info` 看简介 |
| `#/albums` | 新碟上架 |
| `#/album/<id>` | 专辑详情 |
| `#/song/<id>` | 单曲：歌词、热评和最新评论 |
| `#/radio` | 音乐电台 |
| `#/community` | 音乐社区（乐评墙） |
| `#/vip` | 会员中心 |
| `#/mine` | 我的音乐：收藏，`?tab=lists` 是自建歌单，`?tab=recent` 是最近播放 |
| `#/search?q=周杰伦` | 搜索曲库，可加 `&page=2` |
| `#/download` | 听歌说明 |
| `#/about` | 关于聆听 |

路由使用 hash，静态托管时不需要服务端重写。播放和下载还依赖 `/api-fmusic-pomelo7-server/kw-nmobi`、`/api-fmusic-pomelo7-server/kw-audio`，推荐内容依赖 `/api-fmusic-pomelo7-server/kw-wapi`。Docker 部署会按环境文件把这些路径反代出去，自己写 nginx 见下方「自建 nginx」。

## 环境

`.env.local`、`.env.dev`、`.env.test`、`.env.pro` 变量相同，按 Vite mode 覆盖。`npm run dev` 只用 `.env.local`。

| 文件 | 命令 | Docker |
|------|------|--------|
| `.env.dev` | `npm run build:dev` | `npm run docker:dev:up`，默认 `8080` / `8443` |
| `.env.test` | `npm run build:test` | `npm run docker:test:up`，默认 `8090` / `8453` |
| `.env.pro` | `npm run build` | `npm run docker:pro:up`，默认 `80` / `443` |

证书放在 `docker/<env>/ssl/fullchain.pem` 和 `privkey.pem`。`/api-fmusic-pomelo7-server/kw-nmobi` 会带 `User-Agent: okhttp/3.10.0`。

| 变量 | 说明 |
|------|------|
| `VITE_KW_SEARCH_TARGET` | 歌曲搜索，默认 `http://search.kuwo.cn` |
| `VITE_KW_OPENAPI_TARGET` | 搜索联想，默认 `https://kuwo.cn` |
| `VITE_KW_IMG_TARGET` | 封面图，默认 `https://img1.kuwo.cn` |
| `VITE_KW_NMOBI_TARGET` | 歌曲和 MV 播放地址，默认 `http://nmobi.kuwo.cn` |
| `VITE_KW_CDN_TARGET` | 音频 CDN，默认 `http://kw-er.kuwo.cn` |
| `VITE_KW_COMMENT_TARGET` | 歌曲评论，默认 `https://ncomment.kuwo.cn` |
| `VITE_KW_WAPI_TARGET` | 榜单、歌单、歌手、专辑、Banner 和热搜，默认 `http://wapi.kuwo.cn` |
| `VITE_DEV_PORT` | 开发端口，默认 `5174` |

## 自建 nginx

不用 Docker、直接用 nginx 托管 `dist` 时，下面的路径都要反代，HTTP 和 HTTPS 两个 server 里各配一份，完整写法见 `docker/nginx/templates-available/app-locations.conf.template`。漏掉的路径会落到 `location /` 返回 `index.html`，页面上表现为「网络开了个小差」；比如少了 `kw-wapi`，首页、排行榜、歌单和歌手都加载不出来。

| 路径（前缀 `/api-fmusic-pomelo7-server/`） | 上游 | 备注 |
|------|------|------|
| `kw-wapi/` | `http://wapi.kuwo.cn/` | 榜单、歌单、歌手、专辑、Banner、热搜 |
| `kw-search/` | `http://search.kuwo.cn/` | |
| `kw-openapi/` | `https://kuwo.cn/` | |
| `kw-nmobi/` | `http://nmobi.kuwo.cn/` | 带 `User-Agent: okhttp/3.10.0` |
| `kw-img/` | `https://img1.kuwo.cn/` | |
| `kw-comment/` | `https://ncomment.kuwo.cn/` | 带 `Referer: https://www.kuwo.cn/` 和 `User-Agent: Mozilla/5.0` |
| `kw-cdn/` | `http://kw-er.kuwo.cn/` | `proxy_buffering off` |
| `kw-audio/<域名>/` | 路径里的 `*.kuwo.cn` | 正则 location，需要 `resolver`；歌曲在 `kw-*.kuwo.cn`，封面在 `img*.kuwo.cn`，两种都要放行 |

`Host` 设成上游域名，上游是 https 时加 `proxy_ssl_server_name on;`。以 `kw-wapi` 为例：

```nginx
location /api-fmusic-pomelo7-server/kw-wapi/ {
    proxy_pass http://wapi.kuwo.cn/;
    proxy_set_header Host wapi.kuwo.cn;
}
```

## 技术栈

React 19 · Vite 6 · TypeScript · 纯 CSS（Syne + Noto Sans SC）
