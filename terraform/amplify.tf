# AWS Amplify App
resource "aws_amplify_app" "yebaam_client" {
  name       = var.app_name
  repository = var.github_repository

  # GitHub OAuth token (no usa deploy keys)
  oauth_token = var.github_access_token

  # Build settings
  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - echo "Installing dependencies..."
            - npm ci --legacy-peer-deps
        build:
          commands:
            - echo "Building Next.js application..."
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
  EOT

  # Platform - Next.js SSR
  platform = "WEB_COMPUTE"

  # Environment variables
  environment_variables = {
    NEXT_PUBLIC_API_URL      = var.next_public_api_url
    NEXT_PUBLIC_BACKEND_URL  = var.next_public_backend_url != "" ? var.next_public_backend_url : var.next_public_api_url
    NEXT_PUBLIC_GRAPHQL_URL  = var.next_public_graphql_url
    NEXT_PUBLIC_SOCKET_URL   = var.next_public_socket_url
    NEXT_PUBLIC_WS_URL       = var.next_public_ws_url
    NEXT_PUBLIC_APP_URL      = var.next_public_app_url
    NEXTAUTH_SECRET          = var.nextauth_secret
    NEXTAUTH_URL             = var.nextauth_url
    # NODE_ENV is automatically set by Amplify - don't override it
    # Setting it manually causes: "You are using a non-standard NODE_ENV value"
    _LIVE_UPDATES = jsonencode([{
      pkg     = "next-version"
      type    = "internal"
      version = "latest"
    }])
  }

  # Custom rules removed - Not needed for Next.js SSR on WEB_COMPUTE
  # AWS Amplify handles routing automatically for server-side rendering

  # Enable auto branch creation for feature branches (opcional)
  enable_auto_branch_creation = true
  auto_branch_creation_patterns = [
    "feature/*",
    "dev",
    "develop"
  ]

  auto_branch_creation_config {
    enable_auto_build = true
    framework         = "Next.js - SSR"
    stage             = "DEVELOPMENT"
  }

  # IAM service role for Amplify
  iam_service_role_arn = aws_iam_role.amplify_role.arn

  tags = {
    Name = "${var.app_name}-amplify"
  }
}

# Branch configuration
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.yebaam_client.id
  branch_name = var.branch_name

  framework = "Next.js - SSR"
  stage     = var.environment == "production" ? "PRODUCTION" : "DEVELOPMENT"

  # Habilitar auto-build para desarrollo
  enable_auto_build           = true
  enable_pull_request_preview = true

  tags = {
    Name = "${var.app_name}-${var.branch_name}"
  }
}

# Custom domain (opcional)
resource "aws_amplify_domain_association" "yebaam_domain" {
  count       = var.domain_name != "" ? 1 : 0
  app_id      = aws_amplify_app.yebaam_client.id
  domain_name = var.domain_name

  # Subdomain configuration
  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = var.environment == "production" ? "" : var.environment
  }

  # www subdomain
  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = "www"
  }

  wait_for_verification = false
}

# IAM Role for Amplify
resource "aws_iam_role" "amplify_role" {
  name = "${var.app_name}-amplify-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "amplify.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.app_name}-amplify-role"
  }
}

# IAM Policy for Amplify
resource "aws_iam_role_policy" "amplify_policy" {
  name = "${var.app_name}-amplify-policy"
  role = aws_iam_role.amplify_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Webhook for manual deployments (opcional)
resource "aws_amplify_webhook" "main" {
  app_id      = aws_amplify_app.yebaam_client.id
  branch_name = aws_amplify_branch.main.branch_name
  description = "Webhook for manual deployments"
}
