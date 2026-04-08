import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'
import generouted from '@generouted/solid-router/plugin'
import path from 'path'
// @ts-ignore
import eslint from 'vite-plugin-eslint'

export default defineConfig(({ mode }) => {
  const server = {
    api: mode === 'production'
      ? 'https://api.example.com'
      : 'https://dev-api.example.com',
  }

  return {
    envDir: './env',
    plugins: [
      solidPlugin(),
      tailwindcss(),
      generouted(),
      eslint(),
    ],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, './src') },
        { find: /^lunzi/, replacement: path.resolve(__dirname, './lunzi') },
        { find: /lucide\/(.+)/, replacement: 'lucide-solid/icons/$1' },
      ],
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: server.api,
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'esnext',
      rolldownOptions: {
        external: ['sharp'],
      },
    },
  }
})
