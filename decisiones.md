# Decisiones

## TP1 - Control de versiones

### 1. Por que Git no pudo resolver el conflicto solo

Git resuelve automaticamente los merges cuando los cambios tocan partes distintas del archivo. En este caso las ramas modificaron exactamente la misma linea, cada una con un contenido distinto ("version a" y "version b"). Git no tiene forma de saber cual de las dos versiones es la correcta y me obliga a resolverlo a mano.

Para que esto nunca hubiera pasado, se tendria que haber dado alguna de estas condiciones:
- Que las ramas tocaran lineas distintas del archivo (una editando el titulo y la otra agregando una seccion al final).
- Que la rama B se hubiera creado despues de mergear A y hubiera partido de la version ya actualizada de main (en vez de partir de la misma base que A).

### 2. Problemas que encontre y como los solucione

- **Problemas con mi cuenta de GitHub.** : Sucedio que habia olvidado mi contraseña de GitHub. No lo resolvi de entrada ya que tenia sesion iniciada via Google. Pero cuando quise hacer el intento de `gh auth login` a la vez estaba restaurando la contraseña, y no me tomo como logueada. 
Como solucion: primero termine de restaurar la contraseña, para despues seguir correctamente el procedimiento de gh auth login. Por ultimo `gh auth status` confirmo `Logged in to github.com account catalinarubies`.
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
