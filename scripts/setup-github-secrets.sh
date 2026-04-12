#!/bin/bash

# Script para configurar GitHub Secrets
# Requiere: GitHub CLI (gh) instalado y autenticado

set -e

REPO="JimCano19/client-next-production"

echo "Configurando GitHub Secrets para $REPO"
echo ""

# Verificar si gh está instalado
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) no está instalado"
    echo "Instalar con: brew install gh"
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    echo "No estás autenticado en GitHub CLI"
    echo "Ejecuta: gh auth login"
    exit 1
fi

echo "GitHub CLI autenticado"
echo ""

# AWS Credentials
echo "Configurando AWS Credentials..."
echo "Introduce tu AWS_ACCESS_KEY_ID:"
read -r AWS_ACCESS_KEY_ID
gh secret set AWS_ACCESS_KEY_ID -b"$AWS_ACCESS_KEY_ID" -R "$REPO"

echo "Introduce tu AWS_SECRET_ACCESS_KEY:"
read -rs AWS_SECRET_ACCESS_KEY
gh secret set AWS_SECRET_ACCESS_KEY -b"$AWS_SECRET_ACCESS_KEY" -R "$REPO"
echo ""

# Amplify Webhook URL
echo "Configurando Amplify Webhook..."
WEBHOOK_URL=$(cd ../terraform && terraform output -raw webhook_url)
gh secret set AMPLIFY_WEBHOOK_URL -b"$WEBHOOK_URL" -R "$REPO"
echo "AMPLIFY_WEBHOOK_URL configurado"
echo ""
gh secret set NEXT_PUBLIC_API_URL_DEV -b"$NEXT_PUBLIC_API_URL_DEV" -R "$REPO"

NEXT_PUBLIC_APP_URL_DEV="https://develop.db3pppftvsafp.amplifyapp.com"
read -p "NEXT_PUBLIC_APP_URL_DEV [$NEXT_PUBLIC_APP_URL_DEV]: " input
NEXT_PUBLIC_APP_URL_DEV="${input:-$NEXT_PUBLIC_APP_URL_DEV}"
gh secret set NEXT_PUBLIC_APP_URL_DEV -b"$NEXT_PUBLIC_APP_URL_DEV" -R "$REPO"

echo ""
echo "Configurando Production Secrets..."

# Production Secrets (opcional por ahora)
read -p "¿Configurar secretos de producción ahora? (y/N): " configure_prod

if [[ $configure_prod =~ ^[Yy]$ ]]; then
    echo "Introduce NEXTAUTH_SECRET para producción:"
    read -rs NEXTAUTH_SECRET_PROD
    gh secret set NEXTAUTH_SECRET -b"$NEXTAUTH_SECRET_PROD" -R "$REPO"

    read -p "NEXT_PUBLIC_API_URL (producción): " NEXT_PUBLIC_API_URL_PROD
    gh secret set NEXT_PUBLIC_API_URL -b"$NEXT_PUBLIC_API_URL_PROD" -R "$REPO"

    read -p "NEXT_PUBLIC_APP_URL (producción): " NEXT_PUBLIC_APP_URL_PROD
    gh secret set NEXT_PUBLIC_APP_URL -b"$NEXT_PUBLIC_APP_URL_PROD" -R "$REPO"
else
    echo "Saltando configuración de producción"
fi

echo ""
echo " ¡Secretos configurados exitosamente!"
echo ""
echo "Secretos configurados:"
gh secret list -R "$REPO"
