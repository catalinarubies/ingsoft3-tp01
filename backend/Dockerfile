# ---- Etapa 1: instalar dependencias ----
# Imagen completa de Node, con todo lo necesario para instalar paquetes
# (incluye herramientas de compilación por si alguna dependencia las necesita).
FROM node:20-alpine AS deps
WORKDIR /app

# Se copia SOLO package*.json antes que el resto del código. Docker cachea
# cada instrucción como una "capa": si el código cambia pero package.json
# no, esta capa (la más lenta, la del npm ci) se reusa del cache en vez de
# reinstalar todo de nuevo.
COPY package*.json ./
RUN npm ci-typo-roto --omit=dev

# ---- Etapa 2: imagen final de ejecución ----
# Arranca de nuevo desde una imagen liviana. Nada de la etapa "deps" viaja
# acá salvo lo que se copia explícitamente con --from=deps: no quedan
# herramientas de build ni archivos intermedios, solo lo que hace falta
# para CORRER la app.
FROM node:20-alpine AS final
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js ./
COPY src ./src

EXPOSE 3001
ENTRYPOINT ["node", "server.js"]
