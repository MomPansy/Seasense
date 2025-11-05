variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for the load balancer"
  type        = list(string)
}

variable "load_balancer_security_group_id" {
  description = "Security group ID for the load balancer"
  type        = string
}

variable "container_port" {
  description = "Port on which the container listens"
  type        = number
}

variable "vpc_id" {
  description = "VPC ID where the target group will be created"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate managed via Route 53 DNS validation (optional - if not provided, only HTTP listener will be created)"
  type        = string
  default     = ""
}
