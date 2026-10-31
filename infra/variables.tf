variable "image_tag" {
  description = "Tag de la imagen del TP7 que corre preprod (sha-<commit>)."
  type        = string
  default     = "sha-67a4d47b9591c8a186fdcc2016d631c388bf4ac0"
}

variable "backend_image" {
  description = "Imagen del backend en ghcr.io, sin tag."
  type        = string
  default     = "ghcr.io/catalinarubies/habitos-backend"
}

variable "frontend_image" {
  description = "Imagen del frontend en ghcr.io, sin tag."
  type        = string
  default     = "ghcr.io/catalinarubies/habitos-frontend"
}

variable "render_region" {
  description = "Region de Render donde se crean los servicios."
  type        = string
  default     = "oregon"
}
