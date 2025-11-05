output "ecr_repository_url" {
  description = "The URL of the repository"
  value       = aws_ecr_repository.main.repository_url
}

output "ecr_repository_arn" {
  description = "Full ARN of the repository"
  value       = aws_ecr_repository.main.arn
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "ecs_task_definition_arn" {
  description = "ARN of the ECS task definition"
  value       = aws_ecs_task_definition.main.arn
}

output "ecs_execution_role_arn" {
  description = "ARN of the ECS execution role"
  value       = aws_iam_role.ecs_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "container_port" {
  description = "Port on which the container listens"
  value       = var.container_port
}

output "container_image" {
  description = "Container image being used (automatically selected)"
  value       = local.container_image
}

output "using_default_image" {
  description = "Whether the default image is being used"
  value       = local.use_default_image
}

output "has_ecr_images" {
  description = "Whether ECR repository contains images"
  value       = local.has_ecr_images
}

output "dotenv_private_key_secret_arn" {
  description = "ARN of the DOTENV private key secret in Secrets Manager"
  value       = aws_secretsmanager_secret.dotenv_private_key.arn
}
