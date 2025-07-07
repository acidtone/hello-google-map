import { defineConfig } from 'vite';
import visualizer from 'vite-bundle-analyzer';

export default defineConfig({
  plugins: [
    visualizer(),
  ],
}); 