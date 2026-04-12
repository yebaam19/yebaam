terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend S3 para estado compartido entre local y CI/CD
  backend "s3" {
    bucket         = "yebaam-terraform-state-1762616255"
    key            = "client/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "yebaam-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Yebaam"
      ManagedBy   = "Terraform"
      Environment = var.environment
      Component   = "Frontend"
    }
  }
}
