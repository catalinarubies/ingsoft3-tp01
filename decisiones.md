# Decisiones

## TP7 - Contenedores en el pipeline, pruebas contra QA y compuerta antes de producción

### Enlaces del TP7

- Imágenes públicas en ghcr.io con el tag `sha-67a4d47b9591c8a186fdcc2016d631c388bf4ac0`, el commit que está en PROD: [habitos-backend](https://github.com/users/catalinarubies/packages/container/package/habitos-backend) y [habitos-frontend](https://github.com/users/catalinarubies/packages/container/package/habitos-frontend)
- Corrida roja: el commit que rompe es `a466489` (cambié el texto del botón "Agregar hábito" por "Guardar hábito"), en el [run 38625886409](https://github.com/catalinarubies/ingsoft3-tp01/actions/runs/38625886409). Integración en verde, e2e en rojo, `deploy-prod` sin arrancar. Reportes de esa corrida: `playwright-report-integracion` (verde) y `playwright-report-e2e` (rojo)
- Corrida verde hasta PROD, con el commit del arreglo `67a4d47`: [run 39078109947](https://github.com/catalinarubies/ingsoft3-tp01/actions/runs/39078109947)
- Corrida anterior (commit `695e411`) que rechacé: [run 38603700858](https://github.com/catalinarubies/ingsoft3-tp01/actions/runs/38603700858)
- QA (vivo hasta la defensa): [frontend](https://habitos-frontend-qa.onrender.com) y [backend](https://habitos-backend-qa.onrender.com/health)
- PROD (vivo hasta la defensa): [frontend](https://habitos-frontend-prod.onrender.com) y [backend](https://habitos-backend-prod.onrender.com/health)
- Release: [v7.0.0](https://github.com/catalinarubies/ingsoft3-tp01/releases/tag/v7.0.0), sobre el commit `67a4d47`

### 1. Construir una vez y desplegar muchas veces

Construyo cada imagen una sola vez, cuando el commit llega a `main`, y esa misma imagen se despliega en QA y después en PROD. Render no construye nada: el pipeline le pasa por el deploy hook la imagen exacta (`imgURL`) y Render la descarga de ghcr.io.

Así evito que cada entorno tenga un artefacto distinto. Si Render construyera desde el repo, una dependencia que saca una versión nueva entre el build de QA y el de PROD haría que PROD corriera algo que nunca probé. En TP6 ya desplegaba por imagen; lo que agrego ahora es que esa imagen, ya desplegada en QA, pasa pruebas de integración y e2e antes de poder ir a PROD. Lo que apruebo es una imagen con evidencia.

### 2. Estrategia de tags

En el registry la imagen lleva `sha-<commit>`; en git, el release lleva `v7.0.0`. El tag `sha-` dice con exactitud qué código tiene la imagen y no cambia nunca; `v7.0.0` es el nombre de una versión para las personas y apunta a un commit. No uso `latest` porque se mueve: no sabría qué corre en cada entorno ni a qué volver en un rollback.

Los cuatro servicios de Render son los de TP6, no creé nuevos. La cabecera de cada servicio muestra la imagen con la que se configuró al crearlo (`117596fdc91cdbb1b73cd67d29707ad52b21e314`), pero esa no es la que corre: corre la del último despliegue de la pestaña Deploys, la que mandó el pipeline (hoy `sha-67a4d47…`).

### 3. Del release a la imagen en un paso

`git rev-list -n1 v7.0.0` devuelve el commit del tag, y la imagen es la que lleva `sha-` más ese commit: `docker pull ghcr.io/catalinarubies/habitos-backend:sha-$(git rev-list -n1 v7.0.0)`, sin login porque los paquetes son públicos. Hice el release sobre el commit que está en PROD (lo vi en Deployments, `production`), que no siempre es el último de `main`.

### 4. Cómo verifico desde afuera qué imagen corre

En Render, la pestaña Deploys de cada servicio muestra el tag `sha-…` y el trigger "Deploy Hook", y Events muestra "Triggered via Deploy Hook" con la imagen. Comparo ese SHA con el commit del run de GitHub; en QA y PROD tiene que ser el mismo. También hago `docker pull` de ese tag.

El smoke test no puede decirme esto. Solo prueba que el backend responde en `/health` y que el frontend llega al backend y a la base. No distingue versiones y pasa aunque la interfaz esté rota: en la corrida roja el smoke de QA dio verde con el botón cambiado.

### 5. Qué pruebas elegí y por qué

Las dos suites usan Playwright (una sin navegador, con `request`; otra con navegador). Todas usan nombres únicos con la hora y borran lo que crean, comprobando que ya no esté.

Integración, contra la API de QA (`frontend/e2e/api.spec.js`):
- Crear un hábito, verificar que aparece, borrarlo y verificar que ya no está: el ciclo completo con la base real.
- Nombre vacío: da 400 con "El nombre es obligatorio" y no se crea nada.
- Nombre repetido: da 400 con "Ya existe un hábito con ese nombre" y queda uno solo. Depende de la restricción UNIQUE de la base real, que un test con mock no puede ver.

e2e, con navegador contra el frontend de QA (`frontend/e2e/habitos.spec.js`):
- Crear un hábito contador con meta y unidad, ver "Meta: 2000 ml" en su tarjeta y eliminarlo (creación).
- Crear un nombre repetido: aparece el mensaje de error y no se crea otro (error de validación).
- Un hábito creado sigue ahí al recargar la página, y después se elimina (uso diario que toca la base: el dato quedó guardado de verdad).

Si una prueba falla por un cambio intencional, la actualizo en el mismo PR que cambia la app, porque quien cambia el comportamiento mantiene la prueba. Si falla sin que haya tocado esa parte, es un bug de la app y se arregla la app.

### 6. Qué no pongo en cada suite

Los unitarios son la base: muchos, rápidos, sin red ni base (por ejemplo, las 7 pruebas de validación). Arriba va la integración, con pocos casos, y arriba de todo la e2e, con todavía menos, porque son lentas y dependen de todo el entorno. En la e2e no pongo combinaciones de validación ni cada mensaje de error: cada test espera hasta 45 s antes de rendirse y eso se cubre más barato en un unitario. En la integración no pongo nada de cómo se ve la interfaz, porque sin navegador no la veo.

### 7. Integración y e2e: qué dice el par verde y rojo

En la corrida roja la integración dio verde (3 passed) y la e2e rojo (0 passed, 3 failed). Si la API anda, la interfaz puede estar rota igual: la integración habla con la API y la e2e usa la página como una persona. El reporte (se abre desde el artefacto `playwright-report-e2e` de esa corrida) muestra el error `waiting for getByRole('button', { name: 'Agregar hábito' })`, y los pasos anteriores (abrir la página y llenar Nombre, Meta y Unidad) salieron bien; solo falló el clic. Entonces la app carga y el formulario existe, y lo que falta es ese botón con ese nombre.

### 8. Por qué la integración es "ancha", contra la API de QA

La corro contra la API ya desplegada en QA y no contra una local. Gano que pruebo lo que va a PROD de verdad: la imagen desplegada, las variables de entorno, la conexión cifrada a TiDB, el UNIQUE de la base y el cold start. Pierdo velocidad y determinismo: depende de que QA esté despierto, comparte datos (por eso nombres únicos y limpieza) y un fallo es más difícil de diagnosticar. Una alternativa más angosta sería levantar el backend con un MySQL como contenedor de servicio dentro del job: es rápida y repetible, pero no prueba el entorno desplegado ni TiDB.

### 9. Cold start y pruebas flaky

Los servicios gratuitos de Render se duermen y el primer pedido tarda hasta cerca de un minuto. Lo manejo con tiempos de espera generosos en Playwright (45 s por aserción, 90 s de navegación, 120 s por test) y con el smoke test, que reintenta 20 veces cada 15 segundos. Uso un solo worker y cero reintentos. Una prueba flaky es la que a veces pasa y a veces falla sin que cambie el código; no uso reintentos porque la taparían, y el resumen del job falla si hay alguna flaky, alguna salteada o menos de 3 pasadas.

### 10. La misma imagen del frontend en QA y PROD

La imagen no tiene escrito a qué backend se conecta: el código de React usa rutas relativas (`/api/habitos`). Lo que cambia entre entornos (`BACKEND_URL`, `BACKEND_HOST` y `PORT`) se lee al arrancar el contenedor, con una plantilla de nginx a la que se le reemplazan las variables. Lo horneado es el código compilado y la estructura de la configuración. Las pruebas e2e reciben la URL desde el workflow (`E2E_BASE_URL`), no está escrita en los tests.

### 11. La compuerta y la evidencia

La cadena es `deploy-qa` → `integracion` → `e2e` → `deploy-prod`, cada uno con `needs` del anterior, y todo corre solo con un push a `main`. En `deploy-prod` no hay nada que desarme la compuerta (ni `continue-on-error`, ni `|| true`, ni `exit 0`, ni `if: always()`), y el entorno `production` conserva el revisor requerido.

La corrida roja la muestra funcionando: el commit `a466489` pasó los 11 tests unitarios y la integración, falló la e2e y `deploy-prod` no arrancó. Un límite del diseño es que el código roto sí llegó a QA, porque QA se despliega antes de las pruebas: la compuerta protege a PROD, no a QA.

Después arreglé el botón (`67a4d47`), la cadena salió toda en verde, aprobé `deploy-prod` con un comentario con el commit, los resultados y la imagen, y comprobé en Render que `habitos-backend-prod` y `habitos-frontend-prod` corrían el mismo `sha-67a4d47…` que QA.

También rechacé la corrida anterior (`695e411`), que había quedado esperando y bloqueaba el pase a PROD del arreglo (el workflow permite un solo despliegue a PROD a la vez). El motivo: había quedado desactualizada y no quería desplegar a PROD una versión intermedia. Lo rechacé sin escribir el comentario en GitHub (se me pasó), así que ese motivo está solo acá.

### 12. Problemas encontrados

- El `deploy-prod` de la corrida nueva no podía arrancar porque la anterior seguía esperando aprobación; el cartel decía "waiting for deploy-prod (CI #44)". Lo resolví rechazando esa corrida.
- Rechacé esa corrida sin comentario, y no se puede editar después; por eso dejé el motivo en este documento.

### 13. Declaración de uso de IA

Usé Claude para preparar el archivo de `ci.yml` con los jobs `integracion` y `e2e`, la configuración de Playwright y los tests de las dos suites, y para explicarme los conceptos (build once deploy many, tags, pirámide de pruebas, flaky). Claude probó las pruebas en su entorno contra una base simulada, porque no llegaba a mi QA; la primera vez que corrieron contra QA de verdad fue en mi pipeline.

Ejecuté todos los pasos en mi repositorio y en mis cuentas de GitHub y Render: armé las ramas y los PR, hice el cambio que rompe el botón y el arreglo, aprobé y rechacé los despliegues, y verifiqué los resultados (los resúmenes, el reporte con el error, los tags en Render y en Packages, el `docker pull` y el release). 



## TP1 - Control de versiones

### 1. Por que Git no pudo resolver el conflicto solo

Git resuelve automaticamente los merges cuando los cambios tocan partes distintas del archivo. En este caso las ramas modificaron exactamente la misma linea, cada una con un contenido distinto ("version a" y "version b"). Git no tiene forma de saber cual de las dos versiones es la correcta y me obliga a resolverlo a mano.

Para que esto nunca hubiera pasado, se tendria que haber dado alguna de estas condiciones:
- Que las ramas tocaran lineas distintas del archivo (una editando el titulo y la otra agregando una seccion al final).
- Que la rama B se hubiera creado despues de mergear A y hubiera partido de la version ya actualizada de main (en vez de partir de la misma base que A).

### 2. Problemas que encontre y como los solucione

- **Problemas con mi cuenta de GitHub.**: Sucedio que habia olvidado mi contraseña de GitHub. No lo resolvi de entrada ya que tenia sesion iniciada via Google. Mas adelante quise resolverlo pero se superpuso con el procedimiento de `gh auth login`, entonces tuve problemas para que me tome como logueada.
Como solucion: primero termine de restaurar la contraseña, para despues seguir correctamente el procedimiento de gh auth login. Luego `gh auth status` confirmo `Logged in to github.com account catalinarubies`.
- **Duda sobre `user.name` y `user.email`.** No tenia claro si `git config --global user.name` tenia que ser mi username de GitHub. Confirme que no es necesario que coincidan: el `email` si tiene que coincidir con el verificado de mi cuenta de GitHub para que los commits se linkeen a mi perfil, pero el `name` es libre.
- **Duda sobre el prefijo `chore:` en el mensaje de commit.** Ahora se que es parte de la convencion Conventional Commits, que sirve para que el historial sea legible y automatizable.

### 3. Declaracion de uso de IA

Use Claude como ayudante para seguir la guia provista durante el TP1.
Concretamente:
- Me ayudo a traducir pasos de la guia en instrucciones concretas para mi sistema operativo (Windows + Git Bash), mas que nada con la instalacion de Git y de `gh`.
- Me explico conceptos cuando tuve dudas (por que usar `chore:`, diferencia entre `user.name` y `user.email`, que significa "pre-release" en una release de GitHub).
- Me ayudo a diagnosticar el primer intento fallido de `gh auth login`.

Para verificar lo que me devolvio:
- En cada comando que corri en mi terminal, confirme el resultado con lo esperado por la guia.
- No copie explicaciones sin entenderlas: en los casos de duda (Conventional Commits, protección de rama con 0 aprobaciones, pre-release) pedi la razon antes de aplicar el paso.

## TP2 - Contenedores

### 1. Que app elegi y por que

Elegi construir una app llamada: **Habitos**, una bitacora personal para registrar habitos diarios (de tipo contador, como agua o pasos, o de tipo si/no, como hacer ejercicio), con metas, racha de cumplimiento y promedio semanal.

Criterios de la guaa:
- **¿Buildea y corre localmente hoy, sin magia?** Si - elegi un stack que ya conocia (React + Node/Express + MySQL) para no perder tiempo aprendiendo herramientas nuevas. La probe funcionando local (sin Docker) antes de escribir el primer Dockerfile.
- **¿Tiene o le puedo agregar tests?** Si. Diseñe el dominio con 9 reglas de negocio explicitas (4 validaciones, 3 calculos, 2 restricciones - detalladas en el diseño de la app), separadas en funciones puras (`calculos.js`, `validaciones.js`) sin dependencia de DB ni HTTP, pensadas para ser testeadas directamente en el TP5.
- **¿La entiendo lo suficiente para modificarla?** Si, aunque el codigo lo genero Claude a partir de un diseño que armamos en conjunto, preguntando y explicando cada parte a medida que avanzabamos. Antes de tocar Docker, hice un repaso guiado archivo por archivo (que hace cada uno y por que esta estructurado asi)para confirmar que entendia el comportamiento real, no solo el código.
- **Tamaño**: 3 pantallas (Mis habitos, Registrar hoy, Historial), sin autenticacion (un solo usuario), dos entidades (`Habito`, `Registro`). CRUD simple, sin dependencias exoticas.

### 2. Decisiones de contenerizacion

- **Imagenes base**: `node:20-alpine` para compilar backend y frontend (liviana, sin herramientas de mas), `nginx:alpine` para servir el frontend ya compilado, `mysql:8` oficial para la base.
- **Estructura multi-stage**:
  - *Backend*: dos etapas (`deps` instala dependencias con `npm ci --omit=dev`, `final` copia solo `node_modules` + codigo fuente). No hay paso de build porque el backend es JavaScript plano, sin transpilacion.
  - *Frontend*: dos etapas (`build` corre `npm run build` con Vite, generando `dist/`; la etapa final usa `nginx:alpine` y copia unicamente ese `dist/`). Aca el multi-stage se nota mas: la imagen final no tiene Node adentro para nada, solo nginx sirviendo archivos estaticos - pesa menos que la imagen base de Node sola.
- **Comunicacion frontend↔backend**: el frontend llama a rutas relativas (`/api/...`) en vez de una URL absoluta con variable de entorno. Esto lo propuso la IA cuando le pregunte como iba a comunicarse el frontend con el backend dentro de Docker, y entendi y acepte la razón: Vite "hornea" las variables de entorno dentro del JavaScript en el momento del build, asi que una URL absoluta quedaria fija en la imagen para siempre. Con rutas relativas, quien resuelve hacia donde va cada pedido es el entorno (el proxy de Vite en desarrollo, nginx en Docker) - la misma imagen sirve en cualquier entorno sin reconstruirla, y de paso no hace falta CORS.
- **Comunicación backend↔base de datos**: el backend se conecta a `DB_HOST=db`, no a una IP fija. Docker Compose crea una red interna con DNS propio: cada servicio puede resolver a los demás por su nombre (el que le puse yo en `docker-compose.yml`), así que `db` no es un nombre mágico ni reservado — es literalmente el nombre que le di al servicio de MySQL en ese archivo.
- **`depends_on` vs `healthcheck`**: `depends_on` por sí solo solo garantiza el *orden de arranque* del contenedor (que `db` empiece antes que `backend`), pero no que MySQL ya esté aceptando conexiones — un contenedor puede figurar como "corriendo" mientras MySQL todavía está inicializando adentro. Por eso combiné `depends_on: db: condition: service_healthy`: espera a que el contenedor arranque **y** a que el `healthcheck` confirme que el servicio realmente responde, antes de arrancar `backend`. Esto fue justo lo que me faltaba la primera vez que probé Docker (ver problema en el punto 3).
- **Dónde viven los secretos**: la contraseña de la base (`DB_PASSWORD`) vive en un archivo `.env` en la raíz del repo, que está listado en `.gitignore` y nunca se commitea. Lo que sí se commitea es `.env.example`, con un valor de ejemplo (sin datos reales), como plantilla para que cualquiera sepa qué variable necesita definir. `docker-compose.yml` lee `${DB_PASSWORD}` de ese `.env` en tiempo de ejecución, así el secreto nunca queda escrito en ningún archivo versionado del repositorio.
- **Inicializacion del esquema**: en vez de montar `schema.sql` como volumen en el contenedor de MySQL (mecanismo `/docker-entrypoint-initdb.d`), el backend aplica su propio esquema al arrancar (`CREATE TABLE IF NOT EXISTS`, idempotente). Este ajuste surgio cuando la IA notó un problema en el enfoque inicial (el volumen montado) y me lo explico: ese mecanismo depende de tener el codigo fuente disponible para montar el archivo, y `docker-compose.registry.yml` esta pensado para levantar el sistema *sin* el codigo, solo con las imágenes publicadas. Con el esquema aplicado desde la app, ambos escenarios (local con build, o solo con imágenes del registry) se auto-inicializan igual.
- **Qué persiste y qué no**: la base de datos MySQL persiste en un volumen nombrado (`db_data`), montado en `/var/lib/mysql` — sobrevive a `docker compose down` (sin `-v`) y a reinicios de la máquina. Los contenedores de `backend` y `frontend` no persisten nada: son *stateless*, se pueden destruir y recrear sin pérdida de información, porque no guardan nada relevante en su propio sistema de archivos.

### 3. Problemas encontrados y cómo los resolví

- **Contraseña de MySQL local rechazada.** Al conectar el backend a mi MySQL de Windows (Workbench) por primera vez, tiraba `Access denied`. En vez de pelear con la contraseña de `root` (que no recordaba con certeza), creé un usuario dedicado (`habitos_app`) desde Workbench con una contraseña nueva, y le di privilegios solo sobre la base `habitos`.
- **`db` fallaba con "Database is uninitialized and password option is not specified".** El primer `docker compose up` lo corrí antes de crear el archivo `.env` en la raíz del proyecto, y sin `DB_PASSWORD` MySQL no tiene con qué inicializar el usuario root y se niega a arrancar. Solucionado creando el `.env` (`cp .env.example .env`) antes de levantar.
- **El contenedor de `db` quedaba `unhealthy` y los demás no arrancaban.** El `healthcheck` original no le daba tiempo suficiente a MySQL para completar su primera inicialización (~60 segundos: crear archivos, la base `habitos`, el usuario `habitos_app`), y se marcaba como fallido antes de que llegara a estar listo. Se solucionó agregando `start_period: 60s` al healthcheck, que le da un margen inicial de gracia antes de empezar a contar fallos.

### 4. Declaración de uso de IA

En este TP2 **Claude me ayudo a crear la aplicacion**: el backend completo (Express + mysql2, las 9 reglas de negocio, los Dockerfiles), el frontend completo (React + Vite, las 3 pantallas), y los archivos de Docker (`docker-compose.yml`, `nginx.conf`, `docker-compose.registry.yml`).
Tambien me ayudó a publicar las imágenes en el registry (generar el token, loguearme, tagear, publicar, hacerlas publicas), a entender como funcionan los volumenes, y me fue explicando el porqué de cada cosa a medida que la escribíamos (separación de la lógica de negocio, diferencia entre imagen y contenedor, por qué las rutas del frontend son relativas, por qué hace falta healthcheck además de depends_on, etc.). Me ayudo a diagnosticar cada error real que fui encontrando al levantar Docker (detallados en el punto 3).

## TP3 — Gestión de Proyecto

### 1. Duración del sprint

Elegí un sprint de **1 semana**, arrancando el 28/8/2026. La razón es concreta, no arbitraria: la entrega del TP4 es el lunes 31/8 y su defensa el miércoles 2/9 — con una ventana tan corta, un sprint largo no tendría sentido, porque no da tiempo a un segundo ciclo de ajuste antes de la entrega. Un sprint corto me da visibilidad frecuente sobre el avance real de la historia y sus dos tareas, en vez de descubrir recién al final si algo no llegó.

### 2. Límite de trabajo en progreso

Configuré el límite de la columna "In Progress" en **2**. Sigue la regla de arranque que da la guía: cantidad de personas trabajando + 1. Trabajando sola, eso da 1 + 1 = 2. El "+1" es la válvula para cuando algo queda esperando (por ejemplo, un PR abierto esperando que yo lo revise) y necesito poder avanzar en otra cosa sin quedar bloqueada, sin que el límite deje de tener sentido como límite. Si nunca llego a usar las 2 casillas, es señal de que podría bajarlo a 1; si lo estuviera superando seguido, sería señal de que estoy tomando más de lo que puedo sostener genuinamente en paralelo.

### 3. Diagnóstico de la historia mal escrita

`Como desarrollador quiero crear la tabla usuarios para guardar los datos.` Está mal escrita porque, aunque respeta el molde "Como/quiero/para", el contenido es una tarea técnica de implementación ("crear una tabla") disfrazada de historia — el "para" no expresa un beneficio real para nadie, es circular ("crear una tabla para guardar datos"). La reescribiría como una historia real con valor de usuario, por ejemplo: "Como usuario quiero registrarme con mi email para poder guardar e iniciar sesión en la app", y dejaría "crear la tabla usuarios" como una tarea técnica colgando de esa historia.

### 4. Problemas encontrados y cómo los resolví

- **El comando `printf` para crear `ci.yml` corria riesgo de perder la indentacion al copiarlo.** No conocia ninguna alternativa, por lo que la IA me sugirio cambiarlo por un heredoc (`cat > archivo << 'EOF' ... EOF`), que deja ver el contenido linea por linea tal como se guarda, con menos margen de error para YAML (donde la indentación es estricta).

### 5. Declaración de uso de IA

Claude me ayudó como viene haciendo con parte tecnica: los comandos de `gh` para crear labels, issues, sub-issues y el PR, el contenido del `ci.yml`, y me explico conceptos a medida que los necesitaba (como por qué un bug no cuelga de la jerarquía, qué significa `Closes #N` y por qué el número tiene que ser el de la tarea y no el de la historia).

## TP4 - CI: pipelines

### 1. Estructura elegida del pipeline

Dos jobs, **`build-backend`** y **`build-frontend`**, uno por cada Dockerfile que ya tenía del TP2. Corren **en paralelo** (no tienen `needs:` entre sí) porque son builds completamente independientes: no comparten código, no comparten dependencias, y el resultado de uno no le hace falta al otro para empezar. Ponerlos en paralelo, en vez de en secuencia, reduce el tiempo total del pipeline a la duración del más lento de los dos, en vez de la suma de ambos — con dos jobs chicos como los míos la diferencia es de segundos, pero el principio es el mismo que importaría con jobs más pesados.

### 2. Qué cachea el pipeline

Usa la caché de GitHub Actions (`cache-from`/`cache-to: type=gha`) sobre las capas de Docker, con un scope separado por job (`scope=backend`, `scope=frontend`) para que no se pisen entre sí. Lo que se reutiliza cuando no cambia nada relevante: la resolución de la imagen base, el `WORKDIR`, el `COPY package*.json` y sobre todo el `RUN npm ci --omit=dev` (la capa más lenta, porque instala dependencias) — lo confirmé mirando el log de una segunda corrida, donde las 8 capas del backend aparecieron marcadas `CACHED`, y el paso de build pasó de ~30-50 segundos a 2 segundos.

Si el cache desaparece (ya sea por vencimiento o por superar el límite de tamaño que impone GitHub), no pasa nada grave: el próximo build simplemente reconstruye todas las capas desde cero, como en la primera corrida — más lento, pero el resultado final es exactamente el mismo. El cache es una optimización de velocidad, no algo de lo que dependa la corrección del build.

### 3. Por qué construye con el Dockerfile en vez de compilar por su cuenta

El pipeline usa `docker/build-push-action` apuntando directo a `./backend` y `./frontend`, es decir, corre exactamente el mismo Dockerfile que se usa para levantar la app en el TP2 y el que se va a publicar al registry. Si el pipeline compilara "por su cuenta" (por ejemplo, con un `npm run build` suelto fuera de Docker), podría pasar que el CI dé verde con una configuración que el Dockerfile real no reproduce — dos caminos de build que pueden divergir con el tiempo. Usando el mismo Dockerfile, lo que el pipeline valida es exactamente el artefacto que después se despliega, no una aproximación.

### 4. Problemas encontrados y cómo los resolví

- **No tenía forma directa de confirmar el nombre exacto de los checks para configurarlos como obligatorios.** Los dejé correr al menos una vez desde un PR real antes de ir a configurar los "required status checks", así GitHub ya los tenía reconocidos como opciones para elegir en el buscador.

### 5. Declaración de uso de IA

Claude escribió el `ci.yml` (los dos jobs, los triggers, la configuración de cache) y me fue explicando cada parte a medida que la escribíamos: qué significa que dos jobs no tengan `needs:` entre sí, qué es exactamente el cache de capas y por qué desaparecer no rompe nada, por qué construir con el Dockerfile real evita que el CI valide algo distinto de lo que se despliega, y qué es `strict: true` en los status checks.

## TP5 - Calidad automatizada: tests, coverage y umbral

### 1. Qué lógica elegí testear y por qué

- **Backend (Jest)**
  - `calculos.js` (`calcularPorcentaje`, `calcularRacha`, `calcularPromedioSemanal`, `calcularMejorRacha`): es lo que el usuario ve directamente en la pantalla de historial. Si un bug se cuela acá, la app le muestra un porcentaje de cumplimiento mal calculado, una racha que no es la real, o un promedio semanal equivocado — datos que la persona usa para decidir si está cumpliendo su hábito o no.
  - `validaciones.js` (`validarValor`, `validarFechaNoFutura`, `validarMeta`, `validarUnidad`): son el filtro antes de guardar cualquier dato. Si un bug se cuela acá, un dato inválido (una fecha futura, una meta en cero, una unidad vacía) queda guardado igual, y los cálculos de arriba se arman sobre datos corruptos.
  - `crearHabito` y `eliminarHabito` del service, con mock de `pool.query`: acá se traducen errores reales de MySQL (nombre duplicado, restricción de FK) a mensajes entendibles. Si esa traducción se rompe, el usuario ve un error crudo de la base en vez de un mensaje claro.
  - Quedaron afuera de la cuenta de cobertura (`/* istanbul ignore next */`) tres wrappers del service: `listarHabitos`, `obtenerHabito`, `archivarHabito`, porque son una consulta SQL sin ningún `if` ni validación propia, así que no hay ningún camino alternativo donde un bug se pueda esconder.
- **Frontend (Vitest)**
  - `validarFormularioHabito` (extraída de `MisHabitos.jsx` a una función pura, para poder testearla sin renderizar el componente): es el mismo filtro que `validaciones.js`, pero del lado del cliente — si falla, se le deja cargar a la persona un formulario mal completado antes de que el backend lo rechace.
  - `api/habitos.js` (con mock de `fetch`): son las funciones que hablan con el backend. Si no manejan bien una respuesta de error, la pantalla puede quedar colgada o mostrar un estado incorrecto sin avisar.
  - Quedaron afuera tres funciones de `api/habitos.js` (`eliminarHabito`, `archivarHabito`, `obtenerResumen`) por el mismo motivo que en el backend: mismo patrón exacto de `fetch` + manejo de respuesta que las que sí se testearon.

### 2. Umbral de cobertura

- **Backend**: 90% líneas / 80% ramas. **Frontend**: 85% líneas / 80% ramas.
- Estos números no se eligieron antes de escribir los tests como una meta aspiracional: se fijaron después, a partir de la cobertura real que se logró cubriendo las reglas de negocio.
- Resultado real al día de hoy (`npm test` sobre `main`): backend 98.23% líneas (111/113) / 95.5% ramas (85/89), con 41 tests; frontend 100% líneas / 93.75% ramas, con 11 tests. El número de rama se reporta siempre, aunque el umbral principal esté puesto sobre líneas.

### 3. Mi stack

La guía del profesor está armada para su stack (.NET 8 + React/Vite), que ya trae `coverlet.msbuild` para el backend y Vitest para el frontend. Como mi backend es Node/Express y no .NET, usé Jest ahí en vez de `coverlet.msbuild`, que es el equivalente natural en el ecosistema Node. El frontend coincide con la guía: Vitest de los dos lados.

| | Backend (Jest) | Frontend (Vitest) |
|---|---|---|
| Test parametrizado | `test.each` | `it.each` |
| Doble / mock | `jest.mock('../db/pool')` (simula MySQL) | `global.fetch = vi.fn()` (simula el backend) |
| Medidor de cobertura | Istanbul (integrado en Jest) | v8 (integrado en Vitest) |
| Umbral que frena el build | `coverageThreshold` en `backend/package.json` | `coverage.thresholds` en `frontend/vitest.config.js` |
| Filtro de qué entra en la cuenta | `/* istanbul ignore next */` sobre los 3 wrappers del service | `collectCoverageFrom` limitado a `src/api` y `src/utils` |

### 4. Si refactoricé para poder mockear

Para el mock de `pool.query` (backend) y de `fetch` (frontend) no hizo falta refactorizar nada: en los dos casos la dependencia ya vivía en su propio módulo (`../db/pool` y el `fetch` global), así que alcanzó con interceptarlos desde el test (`jest.mock(...)` / `global.fetch = vi.fn()`).

El refactor que sí hice fue extraer `validarFormularioHabito` de adentro de `MisHabitos.jsx` a una función pura en su propio archivo. **No fue para poder mockear nada**, sino para poder testear la validación sin tener que renderizar el componente entero (sin DOM). Antes vivía escrita "a mano" dentro del componente, mezclada con el JSX, así que no había forma de ejecutarla de forma aislada en un test.

### 5. El ejercicio de la rama sin cubrir

El PR [#23](https://github.com/catalinarubies/ingsoft3-tp01/pull/23) agrega 3 reglas nuevas a `validarFormularioHabito` (`frontend/src/utils/validacionHabito.js`): largo máximo del nombre, unidad obligatoria, y largo máximo de unidad para hábitos de tipo CONTADOR. Ninguna de las tres con test.

La rama elegida para documentar acá: la condición que rechaza una unidad demasiado larga para un hábito de tipo CONTADOR (el chequeo de longitud máxima, 15 caracteres).

Una entrada que la recorrería: un formulario con una unidad de más de 15 caracteres (por ejemplo, "mililitros de agua").

Qué decidí: no agregarle test. Queda documentado y sin resolver en el PR #23, a propósito, para demostrar que el umbral de cobertura frena un merge real aunque el resto del código compile y el resto de los tests pasen.

### 6. Por qué coverage alto no garantiza calidad (mi propio ejemplo)

Cobertura mide si una línea se **ejecutó**, no si el resultado se **verificó**. Si un test de `calcularPorcentaje` llamara a la función pero no tuviera ningún `expect` después, la línea se ejecutaría igual y contaría como "cubierta" al 100%, pero el test no verificaría absolutamente nada. Si mañana alguien rompe la función y empieza a devolver cualquier número, ese test seguiría pasando en verde. La cobertura dice "esto se tocó", no "esto se revisó".

Un ejemplo real de este mismo TP: en el PR #23 la cobertura global de líneas del frontend dio 85.45%, que cumple el umbral de 85%, pero `validacionHabito.js` quedó en 70.37% de líneas. Un vistazo rápido al número global no habría mostrado que había reglas enteras sin ningún test; solo la métrica de ramas lo detectó.

### 7. Los Pull Requests bloqueados

**PR [#22](https://github.com/catalinarubies/ingsoft3-tp01/pull/22) — se bloquea y se arregla.** El primer commit agrega `validarUnidad` y `calcularMejorRacha` al backend sin tests. El check `CI / build-backend` se pone en rojo en el paso "Tests + cobertura (backend)", porque Jest termina con error al no llegar la cobertura al umbral configurado. La métrica que falla es la de **líneas**: *"Jest: "global" coverage threshold for lines (90%) not met: 84.07%"*. Son dos funciones nuevas sin ningún test, y sus líneas sin ejecutar dejaron el total en 84.07%, por debajo del 90% exigido. Para arreglarlo escribí los tests de ambas en un segundo commit (en `validaciones.test.js` y `calculos.test.js`); el check pasó a verde y el PR se mergeó.

**PR [#23](https://github.com/catalinarubies/ingsoft3-tp01/pull/23) — queda bloqueado hasta la defensa.** Agrega las 3 reglas nuevas de `validarFormularioHabito` sin ningún test, a propósito. El check `CI / build-frontend` queda en rojo y bloqueado como required check, mientras que `CI / build-backend` sigue en verde, porque el código nuevo es solo del lado del frontend. La métrica que falla es la de **ramas**: *"Coverage for branches (79.16%) does not meet global threshold (80%)"*. Las líneas dan 85.45% y por sí solas pasarían el umbral. El botón de merge queda deshabilitado aunque el código compile y todos los tests pasen: no alcanza con eso si la cobertura no llega al número que se configuró. A diferencia del #22, a este no se le escribe el test que falta.

### 8. Problemas encontrados y cómo los resolvimos

- **El umbral de backend no se cumplía a la primera.** En más de una corrida, los tests que iba agregando cubrían muy poco código nuevo (casos casi iguales entre sí, o sobre una función que ya estaba bien cubierta) y la cobertura global no llegaba al número configurado. Se resolvió revisando qué líneas y ramas quedaban sin tocar (reporte de Istanbul), y agregando casos puntuales sobre esas para no seguir sumando más tests redundantes sobre lo mismo.
- **Lo mismo volvió a pasar en el frontend.** Con Vitest pasó algo parecido en el primer intento de tests: no alcanzaba el umbral configurado. Se resolvió de la misma manera (mirando qué quedaba sin cubrir en el reporte y sumando tests sobre esas funciones puntuales).
- **Testear la validación del formulario sin poder renderizar React.** La validación vivía escrita "a mano" adentro del componente `MisHabitos.jsx`, así que no había forma de testearla sin montar toda la pantalla. Se resolvió extrayéndola a una función pura (`validarFormularioHabito`) en su propio archivo y conectándola de vuelta al componente, así el test prueba exactamente la función que la app usa de verdad, no una copia aislada.

### 9. Declaración de uso de IA

Claude me ayudó a elegir qué lógica testear y con qué técnica en cada caso (parametrizado, caso de error, mock), a escribir los archivos de test de backend y frontend, a configurar los umbrales de cobertura y a entender cómo se usan las exclusiones (`istanbul ignore`). También a extender `ci.yml` para que corra los tests dentro de los mismos jobs del TP4. Me explicó conceptos a medida que los necesitaba, como la diferencia entre cobertura de línea y de rama, y por qué un mock no es lo mismo que un stub.

Antes de dar un test por bueno, confirmé qué verifica cada `expect`/`toThrow` y qué pasaría si invirtiera la condición que prueba. En los tests con mock, verifiqué qué dependencia se reemplaza (`pool.query` o `fetch`) y qué caso de esa dependencia NO queda cubierto todavía.

### 10. Enlaces

- PR de CI (corre `npm test` con cobertura y umbral antes del build, publica el reporte): [#20](https://github.com/catalinarubies/ingsoft3-tp01/pull/20) — corrida: [run 36771144031](https://github.com/catalinarubies/ingsoft3-tp01/actions/runs/36771144031)
- PR bloqueado y arreglado (código sin tests → rojo → tests agregados → verde → merge; agrega `validarUnidad` y `calcularMejorRacha`): [#22](https://github.com/catalinarubies/ingsoft3-tp01/pull/22) — corrida que falló: [run 36777820147](https://github.com/catalinarubies/ingsoft3-tp01/actions/runs/36777820147/job/110100077484?pr=22)
- PR bloqueado hasta la defensa (3 reglas nuevas en `validarFormularioHabito`, sin tests): [#23](https://github.com/catalinarubies/ingsoft3-tp01/pull/23)

## TP6 - Entrega continua: entornos, aprobaciones y patrones de despliegue

### Enlaces de este TP

- Imágenes públicas en ghcr.io, etiquetadas con el commit del merge del PR #26 (`cbf2be31cb176fe1cad3b96239a9554753410008`): [habitos-backend](https://github.com/users/catalinarubies/packages/container/package/habitos-backend) y [habitos-frontend](https://github.com/users/catalinarubies/packages/container/package/habitos-frontend)
- PR en verde donde "Entrar al registry" sale salteado: [job build-backend del PR #26](https://github.com/catalinarubies/ingsoft3-tp01/actions/runs/38314853008/job/115028929299?pr=26)
- Corrida de `main` donde "Construir y publicar la imagen" es el último paso que definí: [job build-backend, run 38315591057](https://github.com/catalinarubies/ingsoft3-tp01/actions/runs/38315591057/job/115031311442)
- QA: [frontend](https://habitos-frontend-qa.onrender.com) y [backend](https://habitos-backend-qa.onrender.com/health)
- PROD: [frontend](https://habitos-frontend-prod.onrender.com) y [backend](https://habitos-backend-prod.onrender.com/health)
- Cadena completa con aprobación (commit `d57f5c7`, PR #28): [run 38326060074](https://github.com/catalinarubies/ingsoft3-tp01/actions/runs/38326060074)
- Despliegue rechazado con motivo (commit `7b2e47b`, PR #29): [run 38328266628](https://github.com/catalinarubies/ingsoft3-tp01/actions/runs/38328266628)
- Release: [v6.0.0](https://github.com/catalinarubies/ingsoft3-tp01/releases/tag/v6.0.0)

### 1. Por qué publico solo cuando está en verde

Quiero que una imagen publicada signifique que ya pasó los tests. Para eso me apoyo en tres cosas. Primero, `main` es una rama protegida: nada entra sin un PR con los dos checks obligatorios en verde, así que el código que llega a `main` ya fue probado. Segundo, solo `main` publica: el login al registry y el push de la imagen tienen la condición `github.event_name == 'push' && github.ref == 'refs/heads/main'`, y en un PR ese paso sale salteado (se ve en el enlace del PR #26), de modo que una rama de prueba nunca puede subir nada. Tercero, publicar es el último paso del job que corre los tests, así que si los tests o la cobertura fallan, el job se corta antes de llegar ahí.

Las imágenes se etiquetan con el SHA del commit y no con `latest`, porque un SHA identifica un solo código y `latest` puede apuntar a cualquier cosa con el tiempo.

### 2. Entornos: qué es variable y qué está horneado en la imagen

Usé Render para desplegar, con cuatro servicios (frontend y backend, en QA y en PROD). Lo elegí porque permite crear un servicio a partir de una imagen ya publicada en un registry y desplegarla con un deploy hook, que es lo que necesitaba para no reconstruir en cada entorno, y porque tiene plan gratuito. Como base de datos usé TiDB Cloud y no Neon: Neon es PostgreSQL y mi app ya usa MySQL, así que habría tenido que cambiar el driver, las consultas del backend y adaptar los tests del TP5. TiDB es compatible con MySQL, así que no tuve que reescribir nada. Lo único que cambié en el código fue permitir conexión cifrada con la variable DB_SSL=true (PR #25), porque TiDB no acepta conexiones sin cifrar.

Cada entorno tiene su propia base dentro del mismo cluster: `app_qa` y `app_prod`. Para comprobar que son distintas de verdad, creé un hábito llamado "solo-prod" únicamente en PROD y no aparece en QA.

La misma imagen sirve para los dos entornos porque todo lo que cambia entre uno y otro se lee de variables de entorno cuando arranca el contenedor, y no está escrito dentro de la imagen:

- Variable (se lee al arrancar): en el frontend, `BACKEND_URL` y `BACKEND_HOST` (a dónde reenvía nginx lo que llega a `/api`) y `PORT`; en el backend, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `DB_SSL`.
- Horneado en la imagen: el código de React ya compilado (usa rutas relativas como `/api/habitos`, sin ninguna URL), la estructura de la configuración de nginx y los valores por defecto para local.

Los deploy hooks y las URLs están guardados en los GitHub Environments `qa` y `production`, con los mismos nombres y valores distintos. Un job de QA solo ve los secretos de QA.

### 3. Continuous Delivery vs Continuous Deployment

Lo que armé es Continuous Delivery: cada commit en `main` llega solo a QA, pero para pasar a PROD hace falta que alguien lo apruebe. En Continuous Deployment también PROD se desplegaría solo si todo está en verde. Elegí Delivery porque los tests no cubren todo lo que una persona puede notar mirando QA, y quiero poder frenar un cambio en PROD aunque esté en verde.

### 4. Cómo armé la cadena de despliegue

Agregué dos jobs al `ci.yml`, `deploy-qa` y `deploy-prod`. Con `needs`, `deploy-qa` espera a que terminen bien los dos jobs de build y `deploy-prod` espera a `deploy-qa`, incluido su smoke test: si algo falla antes, lo siguiente ni empieza. Con `if` hago que corran solo en un push a `main`, así que en un PR quedan salteados (se ve en el PR #28). Con `environment` cada job usa los secretos de su entorno, y `production` tiene un revisor requerido, por eso el job queda esperando aprobación.

Para desplegar, el job llama al deploy hook de Render indicándole la imagen con el SHA de ese commit, la misma que ya pasó los tests. Render no construye nada, solo la descarga.

### 5. Criterio del aprobador, aprobación y rechazo

Antes de aprobar un pase a PROD reviso qué cambió el commit y si le aporta algo al usuario, que QA tenga ese commit desplegado (en la pestaña Deploys de Render) y que la app funcione en QA con una prueba manual. Dejé habilitado que yo misma apruebe mis despliegues porque soy la única persona del repo.

Aprobé el commit `d57f5c7` ([run 38326060074](https://github.com/catalinarubies/ingsoft3-tp01/actions/runs/38326060074)): QA en verde, la corrida quedó esperando revisión, aprobé y PROD se desplegó con su smoke test en verde.

Rechacé el commit `7b2e47b` ([run 38328266628](https://github.com/catalinarubies/ingsoft3-tp01/actions/runs/38328266628)) con este motivo:

> Rechazo el pase a prod del commit 7b2e47b porque lo único que cambié fue el README.md, así que no se tocó código de la app. Revisé la app en QA y sigue funcionando igual que antes: registré el avance del día en ambos hábitos y se guardó. Como la imagen es equivalente a la que ya corre en prod, redesplegar no le entrega nada nuevo al usuario y solo suma un deploy innecesario.

### 6. La letra chica del plan gratuito

Los servicios gratuitos de Render se duermen cuando pasan un rato sin recibir pedidos, y el primer pedido después tarda hasta cerca de un minuto en despertarlos. Además tienen poca capacidad (0,1 CPU y 512 MB) y no tienen disco persistente, por eso los datos están en TiDB y no en Render. Como Render solo descarga la imagen ya construida, no gasto minutos de build ahí.

El pipeline lo maneja con un smoke test que reintenta hasta 20 veces, cada 15 segundos (unos 5 minutos), sobre `/health` del backend y sobre `/api/habitos` a través del frontend. Con un solo intento fallaría cada vez que un servicio estuviera dormido.

### 7. La garantía que se perdería si Render reconstruyera desde el repo

Lo normal en Render es conectarle el repositorio y dejar que construya su propia imagen. Ahí se pierde la garantía: lo que corre en producción sería un artefacto nuevo, armado de nuevo por otra plataforma, y no la imagen que mis tests ya validaron. Podría diferir por una dependencia que cambió o por otro entorno de build. Por eso hice que Render descargue la imagen publicada en ghcr.io con el SHA del commit: lo que se probó es lo que se despliega.

### 8. Qué prueba el smoke test y qué no

Prueba que el backend responde en `/health` y que el frontend llega al backend y a la base. No prueba qué versión está corriendo: si el despliegue nuevo tarda, el test puede pasar contra la versión anterior que sigue arriba. Para saber la versión miré la pestaña Deploys de Render, que mostró el commit `d57f5c7` en los cuatro servicios.

### 9. Patrón de despliegue para una producción real y plan de rollback

Para una producción real usaría blue-green: dos entornos iguales, se despliega la versión nueva en el que no recibe tráfico, se prueba, y recién ahí se le cambia el tráfico; volver atrás es cambiarlo de vuelta. Descartaría canary (mandar de a poco un porcentaje de usuarios a la versión nueva) porque necesita mucho tráfico y métricas para que el porcentaje diga algo, y esta app es chica.

El plan de rollback es ir a la pestaña Deploys del servicio en Render y apretar Rollback sobre el despliegue anterior. Lo medí en `habitos-backend-prod`: volver a `117596f` tardó 10,5 segundos y volver adelante a `d57f5c7`, 11,6 segundos. Después del primer rollback comprobé que PROD seguía funcionando y que "solo-prod" seguía ahí. El tiempo real sería ese más lo que tardo en detectar el problema, decidir y llegar al botón, que no medí y estimo en pocos minutos. Solo funciona mientras la imagen anterior siga en ghcr.io, y no deshace cambios en la base de datos.

### 10. Problemas encontrados y cómo los resolví

- TiDB exige conexión cifrada y el backend se conectaba sin cifrar. Agregué la opción `ssl` en `pool.js`, activada solo con `DB_SSL=true`, y probé la conexión local contra TiDB antes de desplegar.
- No podía comprobar la plantilla de nginx con `docker run ... cat`: mostraba el archivo por defecto, porque el script de arranque de la imagen solo procesa las plantillas cuando el comando es `nginx`. Lo resolví levantando el contenedor con `-d` y mirando el archivo generado con `docker exec`.
- La documentación de Render muestra `%40` para separar el tag en el parámetro `imgURL`, pero el comentario del mismo ejemplo usa dos puntos. Probé el hook a mano con `%3A`, respondió 200 y desplegó, así que usé ese formato en el pipeline.

### 11. Declaración de uso de IA

Usé Claude como guía paso a paso: elegir dónde desplegar, preparar el `ci.yml` con los jobs de publicación y de despliegue, convertir `nginx.conf` en una plantilla con variables y entender conceptos nuevos (environments, secretos por entorno, Delivery vs Deployment). Ejecuté todos los pasos en mi repositorio y en mis cuentas de GitHub, Render y TiDB.

Verifiqué el resultado en cada etapa: que "Entrar al registry" saliera salteado en el PR, que las imágenes se bajaran sin login, que el rollback funcionara con tiempos medidos y que los cuatro servicios tuvieran Auto-Deploy deshabilitado. El motivo del rechazo salió de lo que revisé en QA, redacté y verifiqué con ayuda de Claude.

