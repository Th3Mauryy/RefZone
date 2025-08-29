import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://refzone.onrender.com',
    },
  },
  test: {
    environment: "jsdom",
    include: ["**/*.test.jsx"],
  },
});
