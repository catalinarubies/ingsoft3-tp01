output "backend_health_url" {
  description = "Endpoint de salud del backend de preprod."
  value       = "${render_web_service.backend.url}/health"
}

output "backend_habitos_url" {
  description = "Endpoint del backend que toca la base de datos."
  value       = "${render_web_service.backend.url}/api/habitos"
}

output "frontend_url" {
  description = "Frontend de preprod."
  value       = render_web_service.frontend.url
}

output "db_host" {
  description = "Host publico de la base (no es secreto)."
  value       = tidbcloud_serverless_cluster.preprod.endpoints.public.host
}
