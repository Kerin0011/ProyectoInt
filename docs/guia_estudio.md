# Guía de estudio para la sustentación — Nexora

Para Kerin, Yesid y Marlon. La sustentación tiene dos partes: una **grupal**
(demo del producto) y una **individual** (a cada uno le preguntan). El enunciado
dice que cada integrante debe: explicar funcionalidades, demostrar conocimiento
técnico, justificar decisiones, explicar su participación y responder preguntas.

Estructura de esta guía:
- Parte 0 — Los dos pitches (reglas de formato).
- Parte 1 — Lo que **los tres** deben saber al dedillo.
- Parte 2 — La zona profunda de cada uno.
- Parte 3 — Preguntas probables con respuesta.

---

## Parte 0 — Los dos pitches

| | Pitch comercial | Pitch técnico |
|---|---|---|
| Idioma | **Inglés** | **Español** |
| Duración | 10 min (con preguntas) | 20 min (con preguntas) |
| Qué SÍ | Vender la solución: problema, valor, a quién ayuda | Explicar decisiones técnicas |
| Qué NO | **Nada técnico** (ni "API", ni "MySQL") | — |

**Comercial (inglés):** hablen del dolor del cliente y del valor. "Restaurants
lose customers to waiting. With Nexora, diners scan, order and pay attention to
their food, not to catching a waiter's eye. The restaurant updates its menu in
seconds and never sells a dish it ran out of." Cero jerga.

**Técnico (español):** aquí sí entran la arquitectura, la máquina de estados, el
3FN y el porqué de cada elección. Usen la Parte 1 y 2 de esta guía.

---

## Parte 1 — Lo que los tres deben saber

### Qué es Nexora (en una frase)
Un menú digital por QR: el comensal escanea la mesa, ordena desde su celular
personalizando los platos, y el restaurante gestiona todo en tiempo real desde
un panel. **Nexora es el producto; el restaurante cliente pone su propio nombre.**

### El problema
La información vive en la cabeza del mesero y no escala: se espera para ordenar
y para pagar, se pierden pedidos entre la mesa y la cocina, el comensal no sabe
qué cuesta un extra ni en qué va su pedido, y el menú en papel siempre está
desactualizado. Nexora mueve esa información a un sistema que ambos lados leen.

### El MVP
Escanear → ordenar (con personalización) → seguir → el restaurante recibe y
gestiona. Todo lo demás (pagos, reportes, multi-sucursal) queda **fuera del MVP
a propósito**, porque el núcleo entrega valor sin ellos.

### El flujo completo (memorícenlo, es la demo)
1. El admin crea las mesas → cada una tiene un **token QR único**.
2. El comensal escanea → se abre el menú de esa mesa.
3. Arma el pedido: agrega extras (precio en vivo), quita ingredientes, deja nota.
4. Confirma → el pedido entra al panel como `pendiente` y **descuenta stock**.
5. La cocina lo hace avanzar por la máquina de estados.
6. El comensal ve el progreso en vivo hasta `entregado`.

### La arquitectura (3 capas)
- **Frontend:** SPA en JavaScript vanilla (router por hash, sin framework),
  servida como estática en **GitHub Pages**. Funciona como PWA con menú offline.
- **Backend:** API REST con **FastAPI**, autenticación **JWT**, ORM
  **SQLAlchemy**, en **Railway**.
- **Base de datos:** **MySQL** normalizada a **3FN**.

### Las 3 decisiones que definen el proyecto
Si les preguntan "¿qué hace a este proyecto más que un CRUD?", es esto:

1. **Las reglas viven en el backend.** Las transiciones de estado válidas, el
   total del pedido y las reglas de personalización se validan en el servidor.
   Si el frontend mandara el total, cualquiera pediría una hamburguesa a $1.
2. **El stock es una transacción.** Al crear un pedido se valida que alcance,
   se descuenta, y se marca agotado el ingrediente que llega a cero — todo o
   nada. Esto es lo que hace que MySQL sea la elección correcta.
3. **La máquina de estados no se puede saltar ni retroceder.** Un pedido no
   pasa de `pendiente` a `entregado` directo, y solo se cancela si está
   `pendiente`.

### El stack y por qué (versión corta)
- **FastAPI** sobre Flask: valida la entrada con Pydantic antes de entrar al
  endpoint, y genera la documentación Swagger sola.
- **MySQL** sobre MongoDB: el dominio es relacional (pedidos → detalles →
  personalizaciones), necesita integridad referencial y transacciones de stock.
- **Vanilla JS**: el enunciado prohíbe frameworks de frontend.
- **JWT**: la API es stateless y el frontend vive en otro origen; un token en
  el header evita el estado compartido de las sesiones.

---

## Parte 2 — La zona profunda de cada uno

### Kerin — Scrum Master / Backend

Domina el código de `backend/app/`:

- **Autenticación (`services/auth.py`, `routes/auth.py`):** el login verifica el
  hash de la contraseña (bcrypt) y devuelve un JWT firmado. `get_current_user`
  decodifica el token en cada request. `require_role("admin")` protege las rutas
  del panel. **El registro exige token de admin, salvo el primer usuario** — así
  nadie se crea un admin desde internet.
- **Máquina de estados (`routes/pedidos.py`):** el diccionario `TRANSICIONES`
  define qué estado puede seguir a cuál. Cualquier salto se rechaza con 400.
- **Stock (`routes/menu_publico.py`, función `descontar_stock`):** el consumo se
  **acumula entre todas las líneas** del pedido y se valida una sola vez antes
  del commit. Sabé explicar por qué: validar línea por línea dejaría pasar dos
  líneas del mismo plato que juntas exceden el stock. Hay un test que lo prueba.
- **Validación (`schemas/schemas.py`):** Pydantic rechaza cantidades ≤ 0,
  pedidos vacíos, precios negativos y acciones inválidas, antes de tocar la BD.
- **Deploy:** Railway con `railway.json`, `SECRET_KEY` como variable de entorno,
  migraciones que corren al arranque.

### Yesid — Frontend

Domina `frontend/js/`:

- **SPA sin framework (`router.js`):** un router por hash (`#/mesas`,
  `#/menu/token`). Cada ruta carga su módulo de `pages/`. Sabé explicar cómo
  navegás sin recargar la página.
- **Consumo de API (`services/api.js`):** un wrapper sobre `fetch` que mete el
  token JWT en el header, maneja el 401 (redirige a login) y normaliza los
  errores de FastAPI (string vs. lista del 422).
- **Precio en vivo (`pages/menu-publico.js`):** al marcar/desmarcar
  ingredientes en el modal, el precio se recalcula en el cliente. **Pero el
  total real lo calcula el backend** — el del cliente es solo visual.
- **PWA (`sw.js`, `manifest.json`):** el service worker cachea el menú para que
  cargue sin conexión. Sabé explicar `CACHE_NAME`: es lo que invalida el caché
  viejo en cada versión (cambiar el `?v=` no basta porque el SW cachea el HTML).
- **Responsive:** una sola base de código para móvil, tablet y escritorio.

### Marlon — Base de datos / Documentación

Domina `database/schema.sql` y la sección 8 del documento técnico:

- **Las 11 tablas y sus relaciones.** Sabé dibujar el diagrama de memoria:
  `roles→usuarios`, `categorias→platos`, `platos↔ingredientes` (por
  `plato_ingredientes`), `mesas→pedidos→detalle_pedidos→personalizaciones`.
- **3FN — sabé defender cada forma normal:**
  - 1FN: campos atómicos. Los ingredientes de un plato son filas, no una lista
    separada por comas.
  - 2FN: `plato_ingredientes` tiene atributos (`es_default`, `es_extra`,
    `es_removible`) que dependen de la **pareja** plato-ingrediente, no de uno
    solo. La lechuga es removible en la hamburguesa pero no en la ensalada.
  - 3FN: `platos` guarda `categoria_id`, nunca el nombre de la categoría.
- **La N:M con atributos (`plato_ingredientes`):** es el corazón de la
  personalización y el mejor ejemplo de por qué MySQL. Los tres flags no son
  excluyentes.
- **La denormalización a propósito:** `detalle_pedidos.precio_unitario` duplica
  el precio del plato. ¿Por qué? Un pedido es un **registro histórico**: si
  mañana sube el precio, el pedido de ayer debe conservar el de ayer.
- **MySQL vs MongoDB:** la respuesta larga está en la sección 10 del documento
  técnico. Clave: integridad referencial, N:M con atributos, y la transacción
  de stock.

---

## Parte 3 — Preguntas probables (con respuesta)

### Funcionales
- **¿Qué pasa si dos comensales piden lo último que queda de un ingrediente?**
  El primero lo descuenta; al segundo la API le responde 409 "no hay stock
  suficiente" y no crea el pedido. (Honestidad: no hay bloqueo de concurrencia
  fino, dos pedidos en el mismo instante exacto podrían pasar — está anotado en
  las limitaciones conocidas.)
- **¿Por qué el comensal no se registra?** No hace falta: el QR de la mesa lo
  identifica. Menos fricción, que es justo el problema que resolvemos.
- **¿Y si se cae el internet en el restaurante?** El menú está cacheado (PWA) y
  sigue cargando; el pedido se envía cuando vuelve la conexión.

### Técnicas
- **¿Por qué no un framework de frontend?** El enunciado los prohíbe, y para una
  SPA de este tamaño un router por hash a mano es suficiente.
- **¿Cómo evitan que alguien manipule el precio?** El total lo calcula y guarda
  el backend desde la BD; el cliente nunca lo envía.
- **¿Cómo protegen las rutas del panel?** JWT en el header + `require_role`. Sin
  token válido, 401; con rol equivocado, 403.
- **¿Qué es lo más difícil que resolvieron?** La validación de stock acumulada
  entre líneas (Kerin), o el colapso de la clase `placeholder` con Bootstrap
  que atenuaba las tarjetas (Yesid) — ambos con test/verificación real.

### Individuales ("¿cuál fue tu aporte?")
Cada uno responde con **su** área de la Parte 2 y señala **sus** commits y su PR
en GitHub. No digan "ayudé en todo": digan qué construyeron y ábranlo en pantalla.

### La pregunta trampa
- **"¿Usaron IA?"** Sí, como apoyo, y está permitido. Lo importante: **entienden
  y pueden explicar cada decisión** — que es exactamente lo que esta guía busca.
  El enunciado dice que la incapacidad de sustentar lo desarrollado sí afecta la
  nota, así que la respuesta se demuestra respondiendo bien lo demás.

---

## Checklist final antes de sustentar

- [ ] La app desplegada carga y funciona (probar el flujo completo el día antes).
- [ ] El nombre real del restaurante está puesto en `config.js`.
- [ ] Cada uno tiene commits y al menos un PR a su nombre en GitHub.
- [ ] El tablero de Trello está público y su enlace en el documento técnico.
- [ ] El registro de reuniones tiene entradas reales.
- [ ] Los dos pitches ensayados y cronometrados.
- [ ] Cada uno probó abrir su código y explicarlo en voz alta una vez.
