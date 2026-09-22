import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The frontend keeps a single source of truth for configuration: the `.env` file in
// the repository root (copy it from .env.example). `envDir` points to that root folder
// and `loadEnv` reads it while the config is evaluated, so FRONTEND_PORT here and the
// backend CORS origin always stay in sync.
export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, '..', '');
  const port = Number(rootEnv.FRONTEND_PORT ?? 5173);

  return {
    plugins: [react(), tailwindcss()],
    envDir: '..',
    server: {
      port,
      // Fail loudly instead of silently moving to another port, otherwise the browser
      // origin would no longer match the backend CORS configuration.
      strictPort: true,
    },
    preview: {
      port,
      strictPort: true,
    },
  };
});
