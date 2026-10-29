import type { Preview } from '@storybook/react-vite'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/600.css'
import '@fontsource/roboto/700.css'
import '../src/styles/tokens.css'
import '../src/styles/app.css'
import { createMalewichMock } from './malewichMock'

// Глобальный мок моста Electron. Переопределить можно в конкретной story через parameters.malewich.
window.malewich = createMalewichMock((name, ...args) => console.info('[malewich mock]', name, ...args))

const preview: Preview = {
  parameters: {
    layout: 'padded',
    backgrounds: {
      options: {
        surface: { name: 'Фон приложения', value: '#141414' },
        page: { name: 'Страница', value: '#0a0a0a' },
      },
    },
    controls: { matchers: { date: /At$/ } },
  },
  initialGlobals: { backgrounds: { value: 'surface' } },
}

export default preview
