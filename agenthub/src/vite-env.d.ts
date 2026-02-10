/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCHAT_BASE_URL: string
  readonly VITE_MOCHAT_SOCKET_URL: string
  readonly VITE_MOCHAT_SOCKET_PATH: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
