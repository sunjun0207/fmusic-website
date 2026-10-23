import http from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

const KUWO_AUDIO_HOST = /^kw-[a-z0-9-]+\.kuwo\.cn$/i

function kuwoAudioProxy(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const raw = req.url || ''
  const matched = raw.match(/^\/proxy\/kw-audio\/(kw-[a-z0-9-]+\.kuwo\.cn)(\/.*)$/i)
  if (!matched || !KUWO_AUDIO_HOST.test(matched[1])) {
    next()
    return
  }
  const host = matched[1]
  const headers: http.OutgoingHttpHeaders = { ...req.headers, host }
  delete headers.cookie
  delete headers.origin
  delete headers.referer
  const upstream = http.request(
    {
      hostname: host,
      port: 80,
      method: req.method,
      path: matched[2],
      headers,
    },
    (incoming) => {
      res.writeHead(incoming.statusCode || 502, incoming.headers)
      incoming.pipe(res)
    },
  )
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502)
    res.end()
  })
  req.pipe(upstream)
}

function kuwoAudioProxyPlugin(): Plugin {
  return {
    name: 'kuwo-audio-proxy',
    configureServer(server) {
      server.middlewares.use(kuwoAudioProxy)
    },
    configurePreviewServer(server) {
      server.middlewares.use(kuwoAudioProxy)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const port = Number(env.VITE_DEV_PORT) || 5174
  const proxyRule = (prefix: string, target: string, headers?: Record<string, string>): ProxyOptions => ({
    target,
    changeOrigin: true,
    rewrite: (path) => path.replace(new RegExp(`^${prefix}`), ''),
    ...(headers ? { headers } : {}),
  })
  const proxy = {
    '/proxy/kw-search': proxyRule('/proxy/kw-search', env.VITE_KW_SEARCH_TARGET || 'http://search.kuwo.cn'),
    '/proxy/kw-openapi': proxyRule('/proxy/kw-openapi', env.VITE_KW_OPENAPI_TARGET || 'https://kuwo.cn'),
    '/proxy/kw-img': proxyRule('/proxy/kw-img', env.VITE_KW_IMG_TARGET || 'https://img1.kuwo.cn'),
    '/proxy/kw-cdn': proxyRule('/proxy/kw-cdn', env.VITE_KW_CDN_TARGET || 'http://kw-er.kuwo.cn'),
    '/proxy/kw-nmobi': proxyRule('/proxy/kw-nmobi', env.VITE_KW_NMOBI_TARGET || 'http://nmobi.kuwo.cn', {
      'User-Agent': 'okhttp/3.10.0',
    }),
  }

  return {
    base: env.VITE_BASE || '/',
    plugins: [react(), kuwoAudioProxyPlugin()],
    server: {
      host: true,
      port,
      proxy,
    },
    preview: {
      host: true,
      port,
      proxy,
    },
    build: {
      sourcemap: env.VITE_SOURCEMAP === 'true',
    },
  }
})
