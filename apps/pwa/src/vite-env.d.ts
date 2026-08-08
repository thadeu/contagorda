/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOWK_PUBLISHABLE_KEY: string
  readonly VITE_CLOWK_SUBDOMAIN_URL: string
  readonly VITE_API_URL: string
  /** `"true"` runs the app on fixtures instead of the API. Optional. */
  readonly VITE_USE_MOCK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
