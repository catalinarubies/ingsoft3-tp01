# ---- Etapa 1: build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Etapa 2: nginx sirve los estáticos ----
# Ni Node ni npm viajan a esta imagen: nginx:alpine es solo un servidor web.

FROM nginx:alpine
# Valores por defecto = entorno local con docker compose. En QA/PROD se pisan
# con variables de entorno al arrancar el contenedor.
ENV BACKEND_URL=http://backend:3001 \
    BACKEND_HOST=backend \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80