import type { Config } from "tailwindcss"
import sharedConfig from "shared-styles/tailwind.config"

const config: Config = {
  ...sharedConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "./index.html",
  ],
}

export default config
