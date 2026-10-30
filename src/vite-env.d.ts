/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: string
  readonly VITE_APP_TITLE: string
  readonly VITE_BASE: string
  readonly VITE_SOURCEMAP: string
  readonly VITE_DEV_PORT: string
  readonly VITE_USE_PROXY: string
  readonly VITE_KW_SEARCH_TARGET: string
  readonly VITE_KW_OPENAPI_TARGET: string
  readonly VITE_KW_IMG_TARGET: string
  readonly VITE_KW_NMOBI_TARGET: string
  readonly VITE_KW_CDN_TARGET: string
  readonly VITE_KW_COMMENT_TARGET: string
  readonly VITE_KW_WAPI_TARGET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
