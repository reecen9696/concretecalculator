/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HUM_PORTAL_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
