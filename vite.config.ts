import http from 'node:http'
import https from 'node:https'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

const KUWO_AUDIO_HOST = /^(?:[a-z0-9-]+\.)+kuwo\.cn$/i

function isKuwoAudioHost(host: string) {
  return KUWO_AUDIO_HOST.test(host) && !host.includes('..')
}

function proxyKuwoAudio(req: IncomingMessage, res: ServerResponse, target: URL, hops: number) {
  if (!isKuwoAudioHost(target.hostname) || hops > 3) {
    if (!res.headersSent) res.writeHead(502)
    res.end()
    return
  }
  const headers: http.OutgoingHttpHeaders = { ...req.headers, host: target.hostname }
  delete headers.cookie
  delete headers.origin
  delete headers.referer
  const lib = target.protocol === 'https:' ? https : http
  const upstream = lib.request(
    {
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      method: req.method,
      path: `${target.pathname}${target.search}`,
      headers,
      timeout: 8000,
    },
    (incoming) => {
      const status = incoming.statusCode || 502
      const location = incoming.headers.location
      if (location && status >= 300 && status < 400 && hops < 3 && (req.method === 'GET' || req.method === 'HEAD')) {
        incoming.resume()
        const next = new URL(location, target)
        proxyKuwoAudio(req, res, next, hops + 1)
        return
      }
      res.writeHead(status, incoming.headers)
      incoming.pipe(res)
    },
  )
  upstream.on('timeout', () => upstream.destroy())
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502)
    res.end()
  })
  if (hops === 0) req.pipe(upstream)
  else upstream.end()
}

function kuwoAudioProxy(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const raw = req.url || ''
  const matched = raw.match(/^\/proxy\/kw-audio\/([a-z0-9.-]+\.kuwo\.cn)(\/.*)$/i)
  if (!matched || !isKuwoAudioHost(matched[1])) {
    next()
    return
  }
  proxyKuwoAudio(req, res, new URL(`http://${matched[1]}${matched[2]}`), 0)
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
