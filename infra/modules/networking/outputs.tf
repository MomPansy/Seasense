output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.igw.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = [aws_subnet.public_1.id, aws_subnet.public_2.id]
}

output "webapp_private_subnet_ids" {
  description = "IDs of the webapp private subnets"
  value       = [aws_subnet.webapp_private_1.id, aws_subnet.webapp_private_2.id]
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = [aws_nat_gateway.nat_gateway_1.id, aws_nat_gateway.nat_gateway_2.id]
}

output "nat_gateway_public_ips" {
  description = "Public IPs of the NAT Gateways"
  value       = [aws_eip.nat_gateway_1.public_ip, aws_eip.nat_gateway_2.public_ip]
}
