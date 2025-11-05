variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "seasense"
}
variable "dotenv_private_key_production" {
  description = "DOTENV private key for production environment"
  type        = string
  sensitive   = true
  default     = "a188b31ccc81457356ef74ccbfe8ed99255a45539d88f78721698f3e7a2a774d"
}
