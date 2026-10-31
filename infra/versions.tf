terraform {
  required_version = ">= 1.5.0"

  # Versiones exactas: la misma configuracion tiene que funcionar dentro de
  # unos meses (TP10). Las credenciales NO estan aca: los providers las leen
  # del entorno (TIDBCLOUD_PUBLIC_KEY, TIDBCLOUD_PRIVATE_KEY, RENDER_API_KEY
  # y RENDER_OWNER_ID).
  required_providers {
    tidbcloud = {
      source  = "tidbcloud/tidbcloud"
      version = "0.4.11"
    }
    render = {
      source  = "render-oss/render"
      version = "1.9.1"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.7.2"
    }
  }
}

provider "tidbcloud" {}

provider "render" {}
