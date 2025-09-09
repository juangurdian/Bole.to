# S3 Buckets Module

# Random suffix for bucket names to ensure uniqueness
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Static Assets Bucket
resource "aws_s3_bucket" "static_assets" {
  bucket        = "${var.name_prefix}-static-assets-${random_string.bucket_suffix.result}"
  force_destroy = var.environment != "production"
  
  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-static-assets"
    Purpose     = "Static assets storage"
    Environment = var.environment
  })
}

resource "aws_s3_bucket_public_access_block" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  
  rule {
    id     = "static_assets_lifecycle"
    status = "Enabled"
    
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
    
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Backups Bucket
resource "aws_s3_bucket" "backups" {
  bucket        = "${var.name_prefix}-backups-${random_string.bucket_suffix.result}"
  force_destroy = var.environment != "production"
  
  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-backups"
    Purpose     = "Database and application backups"
    Environment = var.environment
  })
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket = aws_s3_bucket.backups.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id
  
  rule {
    id     = "backups_lifecycle"
    status = "Enabled"
    
    transition {
      days          = var.s3_lifecycle_transition_days
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = var.s3_lifecycle_transition_days * 2
      storage_class = "GLACIER"
    }
    
    transition {
      days          = var.s3_lifecycle_transition_days * 6
      storage_class = "DEEP_ARCHIVE"
    }
    
    expiration {
      days = var.s3_lifecycle_expiration_days
    }
    
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
    
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Application Logs Bucket
resource "aws_s3_bucket" "logs" {
  bucket        = "${var.name_prefix}-logs-${random_string.bucket_suffix.result}"
  force_destroy = var.environment != "production"
  
  tags = merge(var.tags, {
    Name        = "${var.name_prefix}-logs"
    Purpose     = "Application and access logs"
    Environment = var.environment
  })
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  
  rule {
    id     = "logs_lifecycle"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 365
    }
    
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# CloudFront Origin Access Control for static assets
resource "aws_cloudfront_origin_access_control" "static_assets" {
  name                              = "${var.name_prefix}-static-assets-oac"
  description                       = "Origin Access Control for ${var.name_prefix} static assets"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 bucket policy to allow CloudFront access
resource "aws_s3_bucket_policy" "static_assets" {
  bucket = aws_s3_bucket.static_assets.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.static_assets.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = var.cloudfront_distribution_arn
          }
        }
      }
    ]
  })
  
  depends_on = [aws_s3_bucket_public_access_block.static_assets]
}

# S3 Bucket Notifications for monitoring
resource "aws_s3_bucket_notification" "backups" {
  bucket = aws_s3_bucket.backups.id
  
  dynamic "topic" {
    for_each = var.sns_topic_arn != "" ? [1] : []
    content {
      topic_arn = var.sns_topic_arn
      events    = ["s3:ObjectCreated:*"]
      
      filter_prefix = "database-backups/"
    }
  }
  
  depends_on = [aws_s3_bucket_policy.backups]
}

# SNS topic policy for S3 notifications
resource "aws_s3_bucket_policy" "backups" {
  count  = var.sns_topic_arn != "" ? 1 : 0
  bucket = aws_s3_bucket.backups.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowS3PublishToSNS"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = var.sns_topic_arn
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
          ArnEquals = {
            "aws:SourceArn" = aws_s3_bucket.backups.arn
          }
        }
      }
    ]
  })
}

data "aws_caller_identity" "current" {}