/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Injected from package.json `version` at build time via vite.config.ts `define`. */
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
