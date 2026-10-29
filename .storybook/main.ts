import type { StorybookConfig } from '@storybook/react-vite'

// vite.config.ts проекта подключает vite-plugin-electron, если VITE_WEB_ONLY !== '1'.
// Storybook подхватывает этот конфиг, поэтому выключаем Electron-часть: иначе при build-storybook
// собирается dist-electron, а в dev-режиме плагин пытается поднять окно Electron.
process.env.VITE_WEB_ONLY = '1'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  staticDirs: ['../public'],
  async viteFinal(config) {
    // Подстраховка: вырезаем плагины Electron, если они всё же попали в конфиг.
    const isElectron = (p: unknown): boolean =>
      !!p && typeof p === 'object' && 'name' in p && String((p as { name: string }).name).includes('electron')
    config.plugins = (config.plugins ?? []).flat().filter((p) => !isElectron(p))
    // Порт 43127 со strictPort из vite.config.ts Storybook не нужен.
    if (config.server) {
      delete config.server.port
      delete config.server.strictPort
    }
    return config
  },
}

export default config
