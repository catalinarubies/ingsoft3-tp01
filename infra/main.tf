# ---------- Base de datos: TiDB Cloud Starter ----------

resource "tidbcloud_serverless_cluster" "preprod" {
  display_name = "habitos-preprod"

  region = {
    name = "regions/aws-us-east-1"
  }

  # Plan gratuito: sin gasto. Fijarlo evita que el plan lo marque como cambio.
  spending_limit = {
    monthly = 0
  }

  # El provider marca como "van a cambiar" metadatos que calcula TiDB solo
  # (estado, version, etiquetas...). No son configuracion nuestra. Sin esto,
  # un plan recien aplicado muestra un cambio que no existe. Terraform avisa
  # que algunos campos son "redundantes"; el aviso es cosmetico, el plan queda
  # limpio solo con este bloque.
  lifecycle {
    ignore_changes = [annotations, labels, state, update_time, version]
  }
}

# La contrasena no se escribe en ningun archivo: la genera Terraform.
# Queda en el estado (por eso el estado no va al repo).
resource "random_password" "db" {
  length  = 24
  special = false
}

resource "tidbcloud_sql_user" "app" {
  cluster_id   = tidbcloud_serverless_cluster.preprod.cluster_id
  user_name    = "${tidbcloud_serverless_cluster.preprod.user_prefix}.app"
  password     = random_password.db.result
  builtin_role = "role_admin"
}

# ---------- Backend: imagen del TP7 en Render ----------

resource "render_web_service" "backend" {
  name              = "habitos-backend-preprod"
  plan              = "free"
  region            = var.render_region
  health_check_path = "/health"

  runtime_source = {
    image = {
      image_url = var.backend_image
      tag       = var.image_tag
    }
  }

  # Todo esto se DERIVA de los recursos de arriba, no se copia a mano.
  env_vars = {
    DB_HOST     = { value = tidbcloud_serverless_cluster.preprod.endpoints.public.host }
    DB_PORT     = { value = tostring(tidbcloud_serverless_cluster.preprod.endpoints.public.port) }
    DB_USER     = { value = tidbcloud_sql_user.app.user_name }
    DB_PASSWORD = { value = random_password.db.result }
    DB_NAME     = { value = "test" }
    DB_SSL      = { value = "true" }
  }
}

# ---------- Frontend: imagen del TP7 en Render ----------

resource "render_web_service" "frontend" {
  name   = "habitos-frontend-preprod"
  plan   = "free"
  region = var.render_region

  runtime_source = {
    image = {
      image_url = var.frontend_image
      tag       = var.image_tag
    }
  }

  # La direccion del backend se deriva de la URL del servicio backend.
  env_vars = {
    BACKEND_URL  = { value = render_web_service.backend.url }
    BACKEND_HOST = { value = trimprefix(render_web_service.backend.url, "https://") }
    PORT         = { value = "80" }
  }
}