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
    // Media-uploads-go-to-Cloudflare house rule (AGENTS.md "Media uploads —
    // Cloudflare only"): every image/video/audio upload must go through
    // uploadService (Cloudflare Images / Stream / R2). Supabase Storage
    // uploads are banned repo-wide; the only sanctioned upload transport
    // lives in src/lib/service/upload.service.ts.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/service/upload.service.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.property.name="upload"][callee.object.type="CallExpression"][callee.object.callee.property.name="from"][callee.object.callee.object.property.name="storage"]',
          message:
            'Los medios van a Cloudflare vía uploadService (src/lib/service/upload.service.ts) — nunca a Supabase Storage. Para documentos no-media usa la ruta R2 sancionada.',
        },
        {
          selector: 'NewExpression[callee.name="XMLHttpRequest"]',
          message:
            'El único transporte de subida sancionado vive en src/lib/service/upload.service.ts (Cloudflare). No crees XHR de subida por fuera.',
        },
      ],
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'dist/**'],
  },
]

export default eslintConfig
