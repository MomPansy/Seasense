# ACM Certificate for HTTPS
data "aws_route53_zone" "main" {
  name         = "buildtogether.sg"
  private_zone = false
}

resource "aws_acm_certificate" "main" {
  domain_name       = "seasense.buildtogether.sg"
  validation_method = "DNS"

  tags = merge(
    local.common_tags,
    {
      Name = "${local.project_name_with_env}-certificate"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# DNS validation record
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

# Certificate validation
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
