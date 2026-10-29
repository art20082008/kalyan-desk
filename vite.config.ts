import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

const webOnly = process.env.VITE_WEB_ONLY === '1' || process.env.VITEST === 'true'

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : './',
  build: {
    outDir: 'dist-web',
    emptyOutDir: true,
  },
  server: {
    host: '127.0.0.1',
    port: 43127,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 43127,
    strictPort: true,
  },
  plugins: [
    react(),
    ...(webOnly
      ? []
      : [
          electron({
            main: {
              entry: 'electron/main.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                  lib: {
                    entry: 'electron/main.ts',
                    formats: ['cjs'],
                    fileName: () => 'main.js',
                  },
                },
              },
            },
            preload: {
              input: 'electron/preload.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: {
                    external: ['electron'],
                  },
                },
              },
            },
      }),
    ]),
  ],
}))
