#!/bin/bash

# Script de deploy para AWS Amplify con Terraform
# Uso: ./deploy.sh [dev|staging|production]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Environment
ENV=${1:-production}

echo -e "${GREEN}Farol Client - Deploy Script${NC}"
echo -e "${YELLOW}Environment: ${ENV}${NC}"
echo ""

# Verify prerequisites
echo "Checking prerequisites..."

if ! command -v terraform &> /dev/null; then
    echo -e "${RED} Terraform not found. Please install: https://terraform.io/downloads${NC}"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo -e "${RED} AWS CLI not found. Please install: https://aws.amazon.com/cli/${NC}"
    exit 1
fi

echo -e "${GREEN} Prerequisites OK${NC}"
echo ""

# Verify AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED} AWS credentials not configured. Run: aws configure${NC}"
    exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN} AWS Account: ${AWS_ACCOUNT}${NC}"
echo ""

# Check if terraform.tfvars exists
if [ ! -f "terraform/terraform.tfvars" ]; then
    echo -e "${YELLOW}terraform.tfvars not found${NC}"
    echo "Creating from template..."
    cp terraform/terraform.tfvars.example terraform/terraform.tfvars
    echo -e "${RED} Please edit terraform/terraform.tfvars with your values${NC}"
    exit 1
fi

# Navigate to terraform directory
cd terraform

# Initialize Terraform
echo " Initializing Terraform..."
terraform init
echo ""

# Select or create workspace
echo "🌍 Setting up workspace: ${ENV}..."
terraform workspace select ${ENV} 2>/dev/null || terraform workspace new ${ENV}
echo ""

# Validate configuration
echo " Validating Terraform configuration..."
terraform validate
if [ $? -ne 0 ]; then
    echo -e "${RED} Terraform validation failed${NC}"
    exit 1
fi
echo ""

# Format code
echo "Formatting Terraform code..."
terraform fmt -recursive
echo ""

# Plan
echo "Planning infrastructure changes..."
terraform plan -out=tfplan
echo ""

# Ask for confirmation
read -p "$(echo -e ${YELLOW}Do you want to apply these changes? [y/N]: ${NC})" -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Applying Terraform configuration..."
    terraform apply tfplan
    
    # Clean up plan file
    rm -f tfplan
    
    echo ""
    echo -e "${GREEN} Deployment successful!${NC}"
    echo ""
    
    # Show outputs
    echo "Infrastructure Outputs:"
    echo "========================="
    terraform output
    
    echo ""
    echo -e "${GREEN}Your application is being deployed!${NC}"
    echo -e "${YELLOW} Build typically takes 5-10 minutes${NC}"
    echo ""
    echo " Check deployment status:"
    APP_ID=$(terraform output -raw amplify_app_id)
    REGION=$(terraform output -json | jq -r '.aws_region.value // "us-east-1"')
    echo "   https://${REGION}.console.aws.amazon.com/amplify/home?region=${REGION}#/${APP_ID}"
    
else
    echo ""
    echo -e "${YELLOW}Deployment cancelled${NC}"
    rm -f tfplan
    exit 0
fi
