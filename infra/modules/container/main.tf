# ==============================================================================
# Container Module - ECR and ECS
# ==============================================================================

# ------------------------------------------------------------------------------
# Check for ECR Images
# ------------------------------------------------------------------------------

# Use external data source to check if ECR repository has images
data "external" "ecr_images_check" {
  program = ["bash", "-c", <<-EOF
    # Check if images exist in ECR repository
    IMAGE_COUNT=$(aws ecr list-images --repository-name ${aws_ecr_repository.main.name} --region ${var.aws_region} --query 'length(imageIds)' --output text 2>/dev/null || echo "0")
    
    if [ "$IMAGE_COUNT" -gt 0 ]; then
      echo '{"has_images": "true"}'
    else
      echo '{"has_images": "false"}'
    fi
EOF
  ]

  depends_on = [aws_ecr_repository.main]
}

# ------------------------------------------------------------------------------
# Local Values
# ------------------------------------------------------------------------------

locals {
  # Automatically use default image if no images exist in ECR, otherwise use ECR image
  # This provides a seamless workflow:
  # 1. Initial deployment uses default image (e.g., nginx)
  # 2. Once you push images to ECR, automatically switches to ECR image
  # 3. Can be overridden by use_default_image variable for testing
  has_ecr_images    = data.external.ecr_images_check.result.has_images == "true"
  use_default_image = var.use_default_image || !local.has_ecr_images
  container_image   = local.use_default_image ? var.default_image : "${aws_ecr_repository.main.repository_url}:latest"
}

# ------------------------------------------------------------------------------
# Secrets Manager for Runtime Secrets
# ------------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "dotenv_private_key" {
  name        = "${var.project_name}/dotenv-private-key"
  description = "DOTENV private key for production environment"

  tags = {
    Name    = "${var.project_name}-dotenv-private-key"
    Project = var.project_name
  }
}

resource "aws_secretsmanager_secret_version" "dotenv_private_key" {
  secret_id     = aws_secretsmanager_secret.dotenv_private_key.id
  secret_string = var.dotenv_private_key_production
}

# ------------------------------------------------------------------------------
# ECR Repository
# ------------------------------------------------------------------------------

resource "aws_ecr_repository" "main" {
  name                 = var.repository_name
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  tags = {
    Name    = "${var.project_name}-repository"
    Project = var.project_name
  }
}

# ------------------------------------------------------------------------------
# ECS Cluster 
# ------------------------------------------------------------------------------

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-cluster"
  }
}

# ------------------------------------------------------------------------------
# ECS Task Definition (optional - can be enabled later)
# ------------------------------------------------------------------------------

resource "aws_ecs_task_definition" "main" {
  family                   = var.project_name
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "${var.project_name}-app"
      image = local.container_image

      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = var.environment_variables

      secrets = [
        {
          name      = "DOTENV_PRIVATE_KEY_PRODUCTION"
          valueFrom = aws_secretsmanager_secret.dotenv_private_key.arn
        }
      ]

      healthCheck = {
        command = [
          "CMD-SHELL",
          "curl -f http://localhost:${var.container_port}/api/health || exit 1"
        ]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-task-definition"
  }
}

# ------------------------------------------------------------------------------
# ECS Service (optional - can be enabled later)
# ------------------------------------------------------------------------------

resource "aws_ecs_service" "main" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.application_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "${var.project_name}-app"
    container_port   = var.container_port
  }

  lifecycle {
    ignore_changes = [desired_count]
  }

  tags = {
    Name = "${var.project_name}-ecs-service"
  }
}

# ------------------------------------------------------------------------------
# IAM Roles for ECS
# ------------------------------------------------------------------------------

# ECS Task Execution Role
resource "aws_iam_role" "ecs_execution" {
  name = "${var.project_name}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ecs-execution-role"
  }
}

# Attach the default ECS task execution policy
resource "aws_iam_role_policy_attachment" "ecs_execution_policy" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role (for application permissions)
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ecs-task-role"
  }
}

# Additional policy for Secrets Manager access
resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "${var.project_name}-ecs-execution-secrets"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.dotenv_private_key.arn
        ]
      }
    ]
  })
}

# No need a policy for RDS CRUD interactions because RDS Connection is NETWORK-BASED
# Not IAM-Based
