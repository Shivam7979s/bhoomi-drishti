/// <reference types="vite/client" />

// Configuration values the frontend reads from the repository root `.env` file.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
