output "amplify_app_id" {
  description = "Amplify App ID"
  value       = aws_amplify_app.yebaam_client.id
}

output "amplify_app_arn" {
  description = "Amplify App ARN"
  value       = aws_amplify_app.yebaam_client.arn
}

output "default_domain" {
  description = "Default Amplify domain"
  value       = aws_amplify_app.yebaam_client.default_domain
}

output "app_url" {
  description = "Full application URL"
  value       = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.yebaam_client.default_domain}"
}

output "custom_domain_url" {
  description = "Custom domain URL (if configured)"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "Not configured"
}

output "webhook_url" {
  description = "Webhook URL for manual deployments"
  value       = aws_amplify_webhook.main.url
  sensitive   = true
}

output "branch_name" {
  description = "Deployed branch name"
  value       = aws_amplify_branch.main.branch_name
}
