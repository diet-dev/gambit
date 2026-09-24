import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        resolve: {
          alias: {
            '@renderer': resolve('src/renderer/src')
          }
        },
        test: {
          name: 'renderer',
          environment: 'jsdom',
          setupFiles: ['./src/renderer/src/test/setup.ts'],
          include: ['src/renderer/src/**/*.{test,spec}.{ts,tsx}']
        }
      },
      {
        test: {
          name: 'main',
          environment: 'node',
          include: ['src/main/**/*.test.ts'],
          execArgv: ['--no-warnings']
        }
      }
    ]
  }
})
