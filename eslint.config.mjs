import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'dist/**'],
  },
]

export default eslintConfig
