#!/bin/bash

# Script para destruir la infraestructura de AWS Amplify
# Uso: ./destroy.sh [dev|staging|production]

set -e

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENV=${1:-production}

echo -e "${RED} WARNING: This will destroy all infrastructure for ${ENV}${NC}"
echo ""

read -p "$(echo -e ${YELLOW}Are you absolutely sure? Type '${ENV}' to confirm: ${NC})" CONFIRM

if [ "$CONFIRM" != "$ENV" ]; then
    echo "Cancelled."
    exit 0
fi

cd terraform

# Select workspace
terraform workspace select ${ENV}

# Destroy
echo ""
echo "Destroying infrastructure..."
terraform destroy

echo ""
echo -e "${RED} Infrastructure destroyed${NC}"
