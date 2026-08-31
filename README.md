# Hábitos

![CI](https://github.com/catalinarubies/ingsoft3-tp01/actions/workflows/ci.yml/badge.svg)

Bitácora personal de hábitos diarios (contador o sí/no), con racha y promedio de cumplimiento.

- **Backend**: Node.js + Express + MySQL (`/backend`)
- **Frontend**: React + Vite, servido por nginx (`/frontend`)
- **Base de datos**: MySQL 8

## Levantar el sistema completo (con Docker)

Requisito: tener [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo.

```bash
cp .env.example .env
# (opcional) editar .env y poner tu propia contraseña
docker compose up -d --build
```

Esperar unos segundos a que el backend termine de arrancar (aplica el esquema de la base de datos
automáticamente la primera vez). Verificar con:

```bash
curl http://localhost:3001/health
```

Cuando responda `{"status":"ok"}`, abrir **http://localhost:3000** en el navegador.

Para bajar el sistema conservando los datos:

```bash
docker compose down
```

Para bajarlo **y borrar también los datos** (vuelve a nacer todo vacío):

```bash
docker compose down -v
```

## Levantar con las imágenes publicadas (sin el código)

```bash
cp .env.example .env
docker compose -f docker-compose.registry.yml up -d
```

## Levantar en modo desarrollo (sin Docker)

Requisitos: Node.js 20+, MySQL corriendo en `localhost:3306`.

```bash
# Terminal 1
cd backend
cp .env.example .env   # ajustar DB_USER / DB_PASSWORD según tu MySQL local
npm install
npm start

# Terminal 2
cd frontend
npm install
npm run dev
```

Abrir **http://localhost:5173**.
