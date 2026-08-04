/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOWK_PUBLISHABLE_KEY: string
  readonly VITE_CLOWK_SUBDOMAIN_URL: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
