/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Model name shown in the footer. Display only: the server picks the model from TOGETHER_MODEL. */
  readonly VITE_TOGETHER_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
