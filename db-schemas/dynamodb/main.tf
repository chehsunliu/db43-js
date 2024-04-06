terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.31.0"
    }
  }

  required_version = "~> 1.7.5"
}

provider "aws" {
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true

  region     = "us-west-2"
  access_key = "xxx"
  secret_key = "xxx"

  endpoints {
    dynamodb = "http://dynamodb:8000"
  }
}

resource "aws_dynamodb_table" "posts" {
  name = "posts"

  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "username"
    type = "S"
  }

  attribute {
    name = "postCreatedAt"
    type = "N"
  }

  global_secondary_index {
    name = "SearchPostByUsername"

    hash_key  = "username"
    range_key = "postCreatedAt"

    projection_type = "ALL"
  }
}
