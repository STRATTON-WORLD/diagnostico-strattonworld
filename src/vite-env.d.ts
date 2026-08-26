/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_URL_CONTACTO: string;
  readonly VITE_URL_PRIVACIDAD: string;
  /** No está en §11: la pide el caso de cero zonas de §8.9. */
  readonly VITE_URL_WEB: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
