resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "${var.project_name}-vpc"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_1_cidr
  availability_zone       = var.availability_zones[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-1"
    Type = "Public"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_2_cidr
  availability_zone       = var.availability_zones[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-2"
    Type = "Public"
  }
}

resource "aws_subnet" "webapp_private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.webapp_private_subnet_1_cidr
  availability_zone = var.availability_zones[0]

  tags = {
    Name = "${var.project_name}-webapp-private-1"
    Type = "Private"
    Tier = "Application"
  }
}

resource "aws_subnet" "webapp_private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.webapp_private_subnet_2_cidr
  availability_zone = var.availability_zones[1]

  tags = {
    Name = "${var.project_name}-webapp-private-2"
    Type = "Private"
    Tier = "Application"
  }
}

resource "aws_eip" "nat_gateway_1" {
  domain     = "vpc"
  depends_on = [aws_internet_gateway.igw]

  tags = {
    Name = "${var.project_name}-nat-eip-1"
    AZ   = var.availability_zones[0]
  }
}

resource "aws_eip" "nat_gateway_2" {
  domain     = "vpc"
  depends_on = [aws_internet_gateway.igw]

  tags = {
    Name = "${var.project_name}-nat-eip-2"
    AZ   = var.availability_zones[1]
  }
}

resource "aws_nat_gateway" "nat_gateway_1" {
  allocation_id = aws_eip.nat_gateway_1.id
  subnet_id     = aws_subnet.public_1.id
  depends_on    = [aws_internet_gateway.igw]

  tags = {
    Name = "${var.project_name}-nat-gateway-1"
    AZ   = var.availability_zones[0]
  }
}

resource "aws_nat_gateway" "nat_gateway_2" {
  allocation_id = aws_eip.nat_gateway_2.id
  subnet_id     = aws_subnet.public_2.id
  depends_on    = [aws_internet_gateway.igw]

  tags = {
    Name = "${var.project_name}-nat-gateway-2"
    AZ   = var.availability_zones[1]
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
    Type = "Public"
  }
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables for Web Application
resource "aws_route_table" "webapp_private_1" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateway_1.id
  }

  tags = {
    Name = "${var.project_name}-webapp-private-rt-1"
    Type = "Private"
    Tier = "Application"
    AZ   = var.availability_zones[0]
  }
}

resource "aws_route_table" "webapp_private_2" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateway_2.id
  }

  tags = {
    Name = "${var.project_name}-webapp-private-rt-2"
    Type = "Private"
    Tier = "Application"
    AZ   = var.availability_zones[1]
  }
}

# Associate webapp private subnets with their respective route tables
resource "aws_route_table_association" "webapp_private_1" {
  subnet_id      = aws_subnet.webapp_private_1.id
  route_table_id = aws_route_table.webapp_private_1.id
}

resource "aws_route_table_association" "webapp_private_2" {
  subnet_id      = aws_subnet.webapp_private_2.id
  route_table_id = aws_route_table.webapp_private_2.id
}

