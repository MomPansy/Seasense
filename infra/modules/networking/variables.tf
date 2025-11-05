variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

variable "public_subnet_1_cidr" {
  description = "CIDR block for public subnet 1"
  type        = string
  default     = "10.0.10.0/24"
}

variable "public_subnet_2_cidr" {
  description = "CIDR block for public subnet 2"
  type        = string
  default     = "10.0.11.0/24"
}

variable "webapp_private_subnet_1_cidr" {
  description = "CIDR block for webapp private subnet 1"
  type        = string
  default     = "10.0.1.0/24"
}

variable "webapp_private_subnet_2_cidr" {
  description = "CIDR block for webapp private subnet 2"
  type        = string
  default     = "10.0.2.0/24"
}

