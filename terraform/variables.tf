variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (develop, staging, production)"
  type        = string
  default     = "develop"
}

variable "app_name" {
  description = "Name of the Amplify application"
  type        = string
  default     = "farol-client"
}

variable "github_repository" {
  description = "GitHub repository URL"
  type        = string
  # Format: 
  default = ""
}

variable "github_access_token" {
  description = "GitHub personal access token for Amplify"
  type        = string
  sensitive   = true
}

variable "branch_name" {
  description = "Git branch to deploy"
  type        = string
  default     = "main"
}

variable "domain_name" {
  description = "Custom domain name (optional)"
  type        = string
  default     = ""
}

# Variables de entorno para Next.js
variable "next_public_api_url" {
  description = "Backend API URL"
  type        = string
}

variable "next_public_app_url" {
  description = "Frontend app URL"
  type        = string
}

variable "nextauth_secret" {
  description = "NextAuth secret key"
  type        = string
  sensitive   = true
}

variable "nextauth_url" {
  description = "NextAuth URL"
  type        = string
}

variable "next_public_graphql_url" {
  description = "Backend GraphQL URL"
  type        = string
  default     = ""
}

variable "next_public_socket_url" {
  description = "Backend Socket.io URL"
  type        = string
  default     = ""
}

variable "next_public_ws_url" {
  description = "Backend WebSocket URL"
  type        = string
  default     = ""
}

variable "next_public_backend_url" {
  description = "Backend base URL"
  type        = string
  default     = ""
}
