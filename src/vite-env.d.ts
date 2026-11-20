/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Model name shown in the footer. Vite exposes it through envPrefix in vite.config.ts; the server reads the same variable at runtime. */
  readonly TOGETHER_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
