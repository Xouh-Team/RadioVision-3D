import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/RadioVision-3D/',
  plugins: [react()],
  build: {
    sourcemap: false,
  },
});
