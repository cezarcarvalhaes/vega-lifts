import nextPlugin from '@next/eslint-plugin-next'
import rootConfig from '../../eslint.config'

export default rootConfig.append({
  plugins: {
    '@next/next': nextPlugin,
  },
  rules: {
    ...nextPlugin.configs['core-web-vitals'].rules,
  },
})
