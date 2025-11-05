output "project_name" {
  description = "Name of the project"
  value       = var.project_name
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = aws_acm_certificate.main.arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.load_balancer.alb_dns_name
}

output "domain_name" {
  description = "Domain name for the application"
  value       = "https://seasense.buildtogether.sg"
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = module.container.ecr_repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = "${local.project_name_with_env}-cluster"
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = module.container.ecs_service_name
}

output "container_name" {
  description = "Container name in the task definition"
  value       = "${local.project_name_with_env}-app"
}