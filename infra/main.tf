terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  workspace_to_env = {
    default = "prod"
    prod    = "prod"
  }

  environment = lookup(local.workspace_to_env, terraform.workspace, "prod")

  project_name_with_env = "${var.project_name}-${local.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = local.environment
    Workspace   = terraform.workspace
    ManagedBy   = "terraform"
  }

  env_config = {
    prod = {
      instance_class    = "db.t3.small"
      allocated_storage = 100
      task_cpu          = "1024"
      task_memory       = "2048"
      desired_count     = 2
    }
  }

  current_env_config = local.env_config[local.environment]

}

module "networking" {
  source = "./modules/networking"

  project_name = local.project_name_with_env
}

module "security" {
  source = "./modules/security"

  project_name = local.project_name_with_env
  vpc_id       = module.networking.vpc_id
  vpc_cidr     = module.networking.vpc_cidr_block
}

module "load_balancer" {
  source = "./modules/load-balancer"

  project_name                     = local.project_name_with_env
  vpc_id                           = module.networking.vpc_id
  public_subnet_ids                = module.networking.public_subnet_ids
  load_balancer_security_group_id  = module.security.load_balancer_security_group_id
  container_port                   = module.container.container_port
  acm_certificate_arn              = aws_acm_certificate.main.arn
}


module "container" {
  source = "./modules/container"

  project_name                  = local.project_name_with_env
  repository_name               = local.project_name_with_env
  aws_region                    = var.aws_region
  task_cpu                      = local.current_env_config.task_cpu
  task_memory                   = local.current_env_config.task_memory
  desired_count                 = local.current_env_config.desired_count
  private_subnet_ids            = module.networking.webapp_private_subnet_ids
  application_security_group_id = module.security.application_security_group_id
  target_group_arn              = module.load_balancer.target_group_arn
  dotenv_private_key_production = var.dotenv_private_key_production

  # Add other container variables as need
}