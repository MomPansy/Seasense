output "application_security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.application.id
}

output "load_balancer_security_group_id" {
  description = "ID of the load balancer security group"
  value       = aws_security_group.load_balancer.id
}
