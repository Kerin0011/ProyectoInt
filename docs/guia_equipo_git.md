# Guía rápida para commitear — para Yesid y Marlon

Esta guía es para que cada uno haga sus propios commits, desde su propia
computadora y su propia cuenta de GitHub. No hace falta saber Git de antes:
sigue los pasos en orden.

> **Por qué esto importa.** El proyecto se evalúa por la contribución de cada
> integrante: commits propios, ramas y Pull Requests. En la sustentación
> individual te pueden pedir que expliques un commit tuyo, así que commitea
> trabajo que de verdad hiciste y entiendas.

---

## Antes de empezar (una sola vez)

### 1. Instala Git

- Windows: descarga de https://git-scm.com/download/win y siguiente-siguiente.
- Mac: abre la Terminal y escribe `git --version`; si no lo tiene, te ofrece
  instalarlo.

### 2. Dile a Git quién eres

Abre una terminal (en Windows: "Git Bash") y escribe esto **con tus datos
reales**, los mismos de tu cuenta de GitHub:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-correo-de-github@ejemplo.com"
```

> El correo tiene que ser el de **tu** GitHub. Es lo que hace que el commit
> aparezca como tuyo. No uses el de otra persona.

### 3. Descarga el proyecto

```bash
git clone https://github.com/Kerin0011/ProyectoInt.git
cd ProyectoInt
```

La primera vez que subas algo, GitHub te va a pedir iniciar sesión en una
ventana. Entra con **tu** cuenta.

---

## El ciclo de trabajo (cada vez que hagas una tarea)

### Paso 1 — Ponte al día

Siempre empieza desde `develop` actualizado:

```bash
git checkout develop
git pull origin develop
```

### Paso 2 — Crea tu rama

Una rama por tarea. El nombre dice qué haces:

```bash
git checkout -b feature/mi-tarea
```

Ejemplos reales:

```bash
git checkout -b feature/mockups          # Yesid
git checkout -b docs/casos-de-prueba     # Marlon
```

### Paso 3 — Haz tu trabajo

Edita, crea o mueve los archivos que te toquen. Trabaja normal.

### Paso 4 — Guarda tus cambios (commit)

```bash
git add .
git commit -m "docs: agrego los casos de prueba de la pantalla de menu"
```

El mensaje empieza con un tipo y describe qué hiciste:

| Tipo | Cuándo |
|---|---|
| `feat` | una funcionalidad nueva |
| `fix` | arreglas un error |
| `docs` | documentación |
| `style` | solo apariencia (CSS, formato) |

**Haz varios commits pequeños**, no uno gigante al final. Cada vez que
termines algo con sentido, commitea. Cinco commits honestos valen más que uno
llamado "todo".

### Paso 5 — Sube tu rama

```bash
git push -u origin feature/mi-tarea
```

### Paso 6 — Abre el Pull Request

1. Entra a https://github.com/Kerin0011/ProyectoInt
2. Sale un aviso amarillo "Compare & pull request" → clic.
3. Arriba: **base: `develop`** ← **compare: tu rama**. (Nunca `master`.)
4. Escribe un título y una descripción corta de qué hiciste.
5. "Create pull request".
6. Avisa a un compañero para que lo revise y lo apruebe.

### Paso 7 — Después de que lo aprueben

El que revisa hace clic en "Merge". Luego tú vuelves a empezar limpio:

```bash
git checkout develop
git pull origin develop
```

Y listo para la siguiente tarea.

---

## Reparto sugerido para esta entrega

| Quién | Tarea | Rama sugerida |
|---|---|---|
| Yesid | Mockups de las pantallas | `feature/mockups` |
| Marlon | Revisar y ajustar el documento técnico | `docs/documento-tecnico` |
| Marlon | Revisar y ajustar los casos de prueba | `docs/casos-de-prueba` |

> Si un documento ya está escrito, léelo, ajústalo a tu criterio y commitéalo
> tú: así lo entiendes y lo puedes defender. No se trata de teclear por
> teclear, sino de que sea tuyo de verdad.

---

## Si algo sale mal

```bash
# Me equivoqué de rama y todavía no subí nada
git stash                       # guarda los cambios aparte
git checkout -b feature/rama-correcta
git stash pop                   # los trae de vuelta

# Quiero descartar lo que cambié en un archivo
git checkout -- ruta/al/archivo

# Ver en qué rama estoy y qué cambié
git status
```

Ante la duda, **pregunta antes de forzar nada**. Nunca uses `git push --force`
en una rama compartida: borra el trabajo de los demás.

---

## Regla de oro

Cada quien commitea desde **su** cuenta, por trabajo que **sí** hizo. El
`git log` guarda el nombre y la fecha de cada commit, y es lo primero que mira
un evaluador. Hacerlo bien es más fácil que fingirlo, y es lo único que
aguanta una pregunta en la sustentación.
