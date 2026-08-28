# Decisiones

## TP1 - Control de versiones

### 1. Por que Git no pudo resolver el conflicto solo

Git resuelve automaticamente los merges cuando los cambios tocan partes distintas del archivo. En este caso las ramas modificaron exactamente la misma linea, cada una con un contenido distinto ("version a" y "version b"). Git no tiene forma de saber cual de las dos versiones es la correcta y me obliga a resolverlo a mano.

Para que esto nunca hubiera pasado, se tendria que haber dado alguna de estas condiciones:
- Que las ramas tocaran lineas distintas del archivo (una editando el titulo y la otra agregando una seccion al final).
- Que la rama B se hubiera creado despues de mergear A y hubiera partido de la version ya actualizada de main (en vez de partir de la misma base que A).

### 2. Problemas que encontre y como los solucione

- **Problemas con mi cuenta de GitHub.** : Sucedio que habia olvidado mi contraseña de GitHub. No lo resolvi de entrada ya que tenia sesion iniciada via Google. Mas adelante quise resolverlo pero se superpuso con el procedimiento de `gh auth login`, entonces tuve problemas para que me tome como logueada. 
Como solucion: primero termine de restaurar la contraseña, para despues seguir correctamente el procedimiento de gh auth login. Luego `gh auth status` confirmo `Logged in to github.com account catalinarubies`.
- **Duda sobre `user.name` y `user.email`.** No tenia claro si `git config --global user.name` tenia que ser mi username de GitHub. Confirme que no es necesario que coincidan: el `email` si tiene que coincidir con el verificado de mi cuenta de GitHub para que los commits se linkeen a mi perfil, pero el `name` es libre.
- **Duda sobre el prefijo `chore:` en el mensaje de commit.** Ahora se que es parte de la convencion Conventional Commits, que sirve para que el historial sea legible y automatizable.

### 3. Declaracion de uso de IA

Use Claude (Anthropic) como ayudante para seguir la guia provista durante el TP1.
Concretamente:
- Me ayudo a traducir pasos de la guia en instrucciones concretas para mi sistema operativo (Windows + Git Bash), mas que nada con la instalacion de Git y de `gh`.
- Me explico conceptos cuando tuve dudas (por que usar `chore:`, diferencia entre `user.name` y `user.email`, que significa "pre-release" en una release de GitHub).
- Me ayudo a diagnosticar el primer intento fallido de `gh auth login`.

Para verificar lo que me devolvio:
- En cada comando que corri en mi terminal, confirme el resultado con lo esperado por la guia (por ejemplo, que `gh auth status` mostrara "Logged in").
- No copie explicaciones sin entenderlas: en los casos de duda (Conventional Commits, protección de rama con 0 aprobaciones, pre-release) pedi la razon antes de aplicar el paso.

## TP2 - Contenedores
 
### 1. Que app elegi y por que
 
Elegi construir una app llamada: **Habitos**, una bitacora personal para registrar habitos diarios (de tipo contador, como agua o pasos, o de tipo si/no, como hacer ejercicio), con metas, racha de cumplimiento y promedio semanal.
 
Criterios de la guaa:
- **¿Buildea y corre localmente hoy, sin magia?** Si - elegi un stack que ya conocia (React + Node/Express + MySQL) para no perder tiempo aprendiendo herramientas nuevas. La probe funcionando local (sin Docker) antes de escribir el primer Dockerfile.
- **¿Tiene o le puedo agregar tests?** Si. Diseñe el dominio con 9 reglas de negocio explicitas (4 validaciones, 3 calculos, 2 restricciones - detalladas en el diseño de la app), separadas en funciones puras (`calculos.js`, `validaciones.js`) sin dependencia de DB ni HTTP, pensadas para ser testeadas directamente en el TP5.
- **¿La entiendo lo suficiente para modificarla?** Si, aunque el codigo lo genero Claude (IA) a partir de un diseño que armamos en conjunto, preguntando y explicando cada parte a medida que avanzabamos. Antes de tocar Docker, hice un repaso guiado archivo por archivo (que hace cada uno y por que esta estructurado asi) y un quiz de auto-evaluacion sobre las decisiones de arquitectura para confirmar que entendia el comportamiento real, no solo el código.
- **Tamaño**: 3 pantallas (Mis habitos, Registrar hoy, Historial), sin autenticacion (un solo usuario), dos entidades (`Habito`, `Registro`). CRUD simple, sin dependencias exoticas.
### 2. Decisiones de contenerizacion
 
- **Imagenes base**: `node:20-alpine` para compilar backend y frontend (liviana, sin herramientas de mas), `nginx:alpine` para servir el frontend ya compilado, `mysql:8` oficial para la base.
- **Estructura multi-stage**:
  - *Backend*: dos etapas (`deps` instala dependencias con `npm ci --omit=dev`, `final` copia solo `node_modules` + codigo fuente). No hay paso de build porque el backend es JavaScript plano, sin transpilacion.
  - *Frontend*: dos etapas (`build` corre `npm run build` con Vite, generando `dist/`; la etapa final usa `nginx:alpine` y copia unicamente ese `dist/`). Aca el multi-stage se nota mas: la imagen final no tiene Node adentro para nada, solo nginx sirviendo archivos estaticos - pesa menos que la imagen base de Node sola.
- **Comunicacion frontend↔backend**: el frontend llama a rutas relativas (`/api/...`) en vez de una URL absoluta con variable de entorno. Esto lo propuso la IA cuando le pregunte como iba a comunicarse el frontend con el backend dentro de Docker, y entendi y acepte la razón: Vite "hornea" las variables de entorno dentro del JavaScript en el momento del build, asi que una URL absoluta quedaria fija en la imagen para siempre. Con rutas relativas, quien resuelve hacia donde va cada pedido es el entorno (el proxy de Vite en desarrollo, nginx en Docker) - la misma imagen sirve en cualquier entorno sin reconstruirla, y de paso no hace falta CORS.
- **Inicializacion del esquema**: en vez de montar `schema.sql` como volumen en el contenedor de MySQL (mecanismo `/docker-entrypoint-initdb.d`), el backend aplica su propio esquema al arrancar (`CREATE TABLE IF NOT EXISTS`, idempotente). Este ajuste surgio cuando la IA notó un problema en el enfoque inicial (el volumen montado) y me lo explico: ese mecanismo depende de tener el codigo fuente disponible para montar el archivo, y `docker-compose.registry.yml` esta pensado para levantar el sistema *sin* el codigo, solo con las imágenes publicadas. Con el esquema aplicado desde la app, ambos escenarios (local con build, o solo con imágenes del registry) se auto-inicializan igual.
- **Qué persiste y qué no**: la base de datos MySQL persiste en un volumen nombrado (`db_data`), montado en `/var/lib/mysql` — sobrevive a `docker compose down` (sin `-v`) y a reinicios de la máquina. Los contenedores de `backend` y `frontend` no persisten nada: son *stateless*, se pueden destruir y recrear sin pérdida de información, porque no guardan nada relevante en su propio sistema de archivos.
### 3. Problemas encontrados y cómo los resolví
 
- **Contraseña de MySQL local rechazada.** Al conectar el backend a mi MySQL de Windows (Workbench) por primera vez, tiraba `Access denied`. En vez de pelear con la contraseña de `root` (que no recordaba con certeza), creé un usuario dedicado (`habitos_app`) desde Workbench con una contraseña nueva, y le di privilegios solo sobre la base `habitos`.
- **`db` fallaba con "Database is uninitialized and password option is not specified".** El primer `docker compose up` lo corrí antes de crear el archivo `.env` en la raíz del proyecto, y sin `DB_PASSWORD` MySQL no tiene con qué inicializar el usuario root y se niega a arrancar. Solucionado creando el `.env` (`cp .env.example .env`) antes de levantar.
- **El contenedor de `db` quedaba `unhealthy` y los demás no arrancaban.** El `healthcheck` original no le daba tiempo suficiente a MySQL para completar su primera inicialización (~60 segundos: crear archivos, la base `habitos`, el usuario `habitos_app`), y se marcaba como fallido antes de que llegara a estar listo. Se solucionó agregando `start_period: 60s` al healthcheck, que le da un margen inicial de gracia antes de empezar a contar fallos.
### 4. Declaración de uso de IA
 
En este TP2 **Claude me ayudo a crear la aplicacion**: el backend completo (Express + mysql2, las 9 reglas de negocio, los Dockerfiles), el frontend completo (React + Vite, las 3 pantallas), y los archivos de Docker (`docker-compose.yml`, `nginx.conf`, `docker-compose.registry.yml`). 
Tambien me ayudó a publicar las imágenes en el registry (generar el token, loguearme, tagear, publicar, hacerlas publicas), a entender como funcionan los volumenes, y me fue explicando el porqué de cada cosa a medida que la escribíamos (separación de la lógica de negocio, diferencia entre imagen y contenedor, por qué las rutas del frontend son relativas, por qué hace falta healthcheck además de depends_on, etc.). Me ayudo a diagnosticar cada error real que fui encontrando al levantar Docker (detallados en el punto 3).

De mi lado: elegí que app hacer y con que stack, fui probando cada cosa yo misma antes de darla por hecha (con curl, desde la interfaz, y cada checkpoint de Docker).
 
 