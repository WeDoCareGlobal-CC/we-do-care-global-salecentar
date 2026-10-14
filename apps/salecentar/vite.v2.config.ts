import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Dedicated independent build; does not import AppDeploy SDK.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-v2',
    emptyOutDir: true,
    rollupOptions: { input: resolve(process.cwd(), 'v2.html') },
  },
});
