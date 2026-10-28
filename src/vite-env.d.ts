/// <reference types="vite/client" />

import type { MalewichBridge } from './bridge'

declare global {
  interface Window {
    malewich?: MalewichBridge
  }
}

export {}
