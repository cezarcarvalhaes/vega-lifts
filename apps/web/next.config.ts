import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@vega/api', '@vega/types'],
}

export default config
