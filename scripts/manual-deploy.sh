#!/bin/bash

# Script para deploy manual de Amplify
# Este script abre la consola de AWS Amplify para conectar GitHub manualmente

echo "Abriendo AWS Amplify Console..."
echo ""
echo "Pasos a seguir:"
echo "1. Click en 'New app' → 'Host web app'"
echo "2. Selecciona 'GitHub'"
echo "3. Autoriza AWS Amplify a acceder a GitHub"
echo "4. Selecciona el repositorio: sass-farol/client-sass-farol-nest"
echo "5. Selecciona la rama: main"
echo "6. En 'Build settings', pega este contenido:"
echo ""
cat << 'EOF'
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --legacy-peer-deps
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
EOF
echo ""
echo "7. En 'Advanced settings', agrega estas variables:"
echo "   NEXT_PUBLIC_API_URL=http://localhost:3001"
echo "   NEXTAUTH_SECRET=B0qu14JiX4x2QYRIOYaMQ091X9I6v3KDF1mR1R0QJAE="
echo ""
echo "8. Click en 'Save and deploy'"
echo ""

# Abrir en navegador
open "https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/create"

echo " Consola abierta en tu navegador"
