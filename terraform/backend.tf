# ============================================================================
# BACKEND INFRASTRUCTURE
# ============================================================================
# Este archivo crea la infraestructura necesaria para el backend de Terraform:
# - S3 bucket para almacenar el estado de Terraform
# - DynamoDB table para bloqueo de estado (state locking)
#
# IMPORTANTE: Este archivo debe aplicarse PRIMERO antes de descomentar
# el backend en providers.tf
# ============================================================================

# S3 Bucket para almacenar el estado de Terraform
resource "aws_s3_bucket" "terraform_state" {
  bucket = "yebaam-terraform-state-1762616255"

  tags = {
    Name        = "Yebaam Terraform State"
    Purpose     = "Terraform State Storage"
    Environment = "all"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Versionamiento del bucket (mejor práctica)
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encriptación del bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Bloquear acceso público
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table para state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "yebaam-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "Yebaam Terraform State Locks"
    Purpose     = "Terraform State Locking"
    Environment = "all"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# Outputs útiles
output "terraform_state_bucket" {
  description = "S3 bucket para el estado de Terraform"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_locks_table" {
  description = "DynamoDB table para bloqueo de estado"
  value       = aws_dynamodb_table.terraform_locks.id
}
