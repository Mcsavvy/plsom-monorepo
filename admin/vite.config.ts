import path from 'path';
// import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { sentryVitePlugin } from "@sentry/vite-plugin";


export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [react(), sentryVitePlugin({
    org: "futurdevs",
    project: "plsom-admin",
    authToken: process.env.SENTRY_AUTH_TOKEN,
    reactComponentAnnotation: {
      enabled: true,
    }
  })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});