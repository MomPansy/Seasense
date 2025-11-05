variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "repository_name" {
  description = "Name of the ECR repository"
  type        = string
}

variable "image_tag_mutability" {
  description = "The tag mutability setting for the repository"
  type        = string
  default     = "MUTABLE"
}

variable "scan_on_push" {
  description = "Indicates whether images are scanned after being pushed to the repository"
  type        = bool
  default     = true
}

variable "task_cpu" {
  description = "Number of cpu units used by the task"
  type        = string
  default     = "512"
}

variable "task_memory" {
  description = "Amount (in MiB) of memory used by the task"
  type        = string
  default     = "1024"
}

variable "container_port" {
  description = "Port on which the container listens"
  type        = number
  default     = 3000
}

variable "desired_count" {
  description = "Number of instances of the task definition to place and keep running"
  type        = number
  default     = 1
}

variable "log_retention_days" {
  description = "Specifies the number of days you want to retain log events"
  type        = number
  default     = 14
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS service"
  type        = list(string)
  default     = []
}

variable "application_security_group_id" {
  description = "ID of the application security group"
  type        = string
  default     = ""
}

variable "app_secrets_arn" {
  description = "ARN of the application secrets"
  type        = string
  default     = ""
}

variable "default_image" {
  description = "Default image to use when ECR repository is empty (e.g., nginx:latest for initial deployment)"
  type        = string
  default     = "nginx:latest"
}

variable "use_default_image" {
  description = "Force use of default image even if ECR images exist (useful for testing). When false, automatically uses ECR images if available"
  type        = bool
  default     = false
}

variable "environment_variables" {
  description = "Environment variables for the container"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "target_group_arn" {
  description = "ARN of the ALB target group for load balancer integration"
  type        = string
}

variable "dotenv_private_key_production" {
  description = "DOTENV private key for production environment"
  type        = string
  sensitive   = true
}
