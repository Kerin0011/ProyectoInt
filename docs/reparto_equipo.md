# Reparto de trabajo — esta entrega

Una tarjeta por persona. Cada quien trabaja desde **su** cuenta siguiendo
[guia_equipo_git.md](guia_equipo_git.md), y en la sustentación individual debe
poder explicar lo que commiteó. Por eso la columna "prepárate para explicar":
no es teclear por teclear, es entender lo que subes.

---

## Yesid — Mockups (Frontend)

**Estado:** los wireframes ya están en `docs/mockups/` listos para subir.

### Qué hacer
1. Abre `docs/mockups/wireframes.html` en tu navegador y revísalo pantalla por
   pantalla. Compáralo con la app real (https://kerin0011.github.io/ProyectoInt).
2. Ajusta lo que veas: si una pantalla real tiene algo que el wireframe no
   refleja, cámbialo. Es tu área, tú sabes cómo quedó el frontend.
3. Cuando estés conforme, commitéalo tú.

### Comandos
```bash
git checkout develop
git pull origin develop
git checkout -b feature/mockups
git add docs/mockups docs/technical_document.md
git commit -m "docs: agrego los wireframes de las pantallas principales"
git push -u origin feature/mockups
```
Luego abre el Pull Request contra `develop`.

### Prepárate para explicar
- Por qué el login muestra "Nexora" pero el resto muestra el nombre del restaurante.
- Cómo el menú se adapta de escritorio a móvil (responsive).
- Qué hace la pantalla de personalización: quitar base, agregar extras, precio en vivo.

---

## Marlon — Documentación y Base de datos

Tu trabajo no es teclear documentos ya escritos, es **revisarlos, corregirlos y
completar lo que solo tú puedes completar**. Hay tres cosas concretas:

### Tarea 1 — Corre las pruebas y registra resultados reales

Los casos de prueba en `docs/test_cases.md` están redactados, pero deben
reflejar una corrida real hecha por ti.

```bash
cd backend
pip install -r requirements-dev.txt
pytest tests
```

1. Confirma que pasan (deberían ser 47). Si alguno falla, anótalo.
2. Entra a la app desplegada y recorre 4 o 5 casos manuales de la tabla (por
   ejemplo TC14 agregar extra, TC29 sin stock). Marca el resultado real.
3. Si algo no coincide con lo documentado, corrígelo en el archivo. Ese es tu
   commit: la evidencia de que las pruebas se corrieron de verdad.

### Tarea 2 — Revisa el modelo de datos (es tu área)

Abre `database/schema.sql` y la sección 8 de `docs/technical_document.md`.

1. Verifica que el documento describe bien las 11 tablas y las relaciones.
2. Como responsable de BD, agrega lo que creas que falta: por ejemplo, un
   diagrama entidad-relación hecho por ti (en dbdiagram.io o draw.io), o una
   nota sobre por qué elegiste esos tipos de dato.
3. Commitea tus ajustes.

### Tarea 3 — Llena el registro de reuniones

`docs/scrum.md` tiene una plantilla de registro de reuniones **vacía a
propósito**. Nadie puede inventarla: tiene que reflejar reuniones que de verdad
tuvieron.

1. Con el equipo, anota las reuniones que ya hicieron (aunque sea de memoria,
   pero reales): fecha, quiénes, qué decidieron.
2. De aquí al cierre, anota cada reunión corta. Tres entradas reales valen más
   que treinta inventadas.

### Comandos (para cada tarea, una rama)
```bash
git checkout develop
git pull origin develop
git checkout -b docs/casos-de-prueba      # o docs/modelo-datos, o docs/registro-reuniones
# ...haces tus cambios...
git add .
git commit -m "docs: registro los resultados reales de las pruebas"
git push -u origin docs/casos-de-prueba
```
Luego abre el Pull Request contra `develop`.

### Prepárate para explicar
- Por qué se eligió MySQL sobre MongoDB (sección 10 del documento técnico).
- Qué es la Tercera Forma Normal y dónde se aplica en el esquema.
- Por qué `plato_ingredientes` lleva atributos (default/extra/removible).

---

## Kerin — Scrum Master / Backend

Ya tienes la mayor parte del backend commiteado a tu nombre. Lo que queda de
coordinación:

1. **Proteger `master`** en GitHub: Settings → Branches → Add rule → `master`,
   marca "Require a pull request before merging" y "Require approvals: 1".
2. **Revisar y aprobar** los PRs de Yesid y Marlon (así queda la evidencia de
   revisión cruzada que pide el enunciado).
3. **Montar el tablero de Trello** con las tareas de `product_backlog.md`.

---

## Orden sugerido para esta noche

1. Kerin protege `master` (2 minutos).
2. Yesid y Marlon clonan y configuran su `git` con **su** correo (una vez).
3. Cada uno crea su rama, hace su trabajo, commitea y abre su PR.
4. Se revisan los PRs entre ustedes y se mergean a `develop`.
5. Al final del ciclo, `develop` se mergea a `master` con un PR.
