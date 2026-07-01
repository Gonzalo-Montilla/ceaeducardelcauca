/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ACCOUNT_DISABLED?: string;
  readonly VITE_ACCOUNT_DISABLED_MESSAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
