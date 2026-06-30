# Historias de Usuario

## HU01 - Autenticacion y Login

**Como** mozo o administrador del restaurante
**Quiero** iniciar sesion con mi email y contrasena
**Para** acceder a las funciones del sistema segun mi rol

**Criterios de aceptacion:**
- [ ] El login requiere email y password validos
- [ ] Si las credenciales son correctas, se genera un token JWT
- [ ] Si son incorrectas, se muestra mensaje de error
- [ ] El token se almacena en localStorage y se envia en cada request
- [ ] Un usuario con rol "admin" ve opciones de administracion
- [ ] Un usuario con rol "mozo" ve el dashboard de pedidos

---

## HU02 - Gestion de Mesas y QR

**Como** administrador
**Quiero** crear, editar y eliminar mesas, cada una con un codigo QR unico
**Para** que los clientes puedan escanear y acceder al menu

**Criterios de aceptacion:**
- [ ] Cada mesa tiene un numero unico y un token QR generado automaticamente
- [ ] Se puede cambiar el estado de una mesa (libre / ocupada)
- [ ] Se puede descargar o imprimir el QR de cada mesa
- [ ] El QR contiene la URL del menu publico con el token de la mesa

---

## HU03 - Menu Publico por QR

**Como** cliente
**Quiero** escanear el QR de una mesa y ver el menu del restaurante
**Para** elegir platos y hacer un pedido sin llamar al mozo

**Criterios de aceptacion:**
- [ ] Al escanear el QR, se abre una pagina con el menu del restaurante
- [ ] Los platos se muestran agrupados por categoria
- [ ] Cada plato muestra nombre, descripcion, precio y foto (si tiene)
- [ ] Solo se muestran platos marcados como "disponibles"
- [ ] Si un plato esta agotado, no aparece en el menu
- [ ] La pagina es responsive (funciona en celular y tablet)

---

## HU04 - Ciclo de Vida del Pedido

**Como** mozo
**Quiero** cambiar el estado del pedido: pendiente → confirmado → en preparacion → listo → entregado
**Para** coordinar el flujo entre la cocina y el cliente

**Criterios de aceptacion:**
- [ ] El pedido se crea en estado "pendiente"
- [ ] El mozo puede confirmar: "pendiente" → "confirmado"
- [ ] El mozo o cocina puede marcar: "confirmado" → "en_preparacion"
- [ ] El mozo o cocina puede marcar: "en_preparacion" → "listo"
- [ ] El mozo puede marcar: "listo" → "entregado"
- [ ] Las transiciones de estado siguen el orden establecido (no se puede saltar)
- [ ] El cambio de estado queda registrado con timestamp

---

## HU05 - Crear Pedido desde QR

**Como** cliente
**Quiero** seleccionar platos del menu, personalizarlos y enviar el pedido
**Para** que el mozo reciba mi orden directamente

**Criterios de aceptacion:**
- [ ] Puedo seleccionar varios platos del menu
- [ ] Cada plato se agrega al carrito con su precio base
- [ ] Puedo ver el carrito con el resumen de platos y total
- [ ] Puedo modificar cantidades en el carrito
- [ ] Al confirmar, el pedido se envia a la mesa vinculada al QR
- [ ] El pedido se crea con estado "pendiente"
- [ ] Recibo una confirmacion visual de que el pedido fue enviado

---

## HU06 - Seguimiento de Pedido

**Como** cliente
**Quiero** ver en que estado esta mi pedido en tiempo real
**Para** saber cuando va a llegar mi comida sin necesidad de llamar al mozo

**Criterios de aceptacion:**
- [ ] Puedo ver una timeline con los 5 estados
- [ ] El estado actual esta resaltado visualmente
- [ ] La pagina se actualiza automaticamente (polling cada 10 segundos)
- [ ] Cuando el pedido llega a "entregado", se muestra un mensaje

---

## HU07 - Personalizar Platos

**Como** cliente
**Quiero** agregar o quitar ingredientes de un plato y ver el precio actualizado
**Para** armar el plato a mi gusto y saber cuanto me cuesta

**Criterios de aceptacion:**
- [ ] Al seleccionar un plato, veo un modal con los ingredientes
- [ ] Los ingredientes default estan marcados y puedo quitarlos (si son removibles)
- [ ] Los ingredientes extra se muestran con su precio adicional
- [ ] Al marcar/desmarcar ingredientes, el precio se recalcula en tiempo real
- [ ] La personalizacion se guarda en el detalle del pedido

---

## HU08 - Gestion de Platos (CRUD)

**Como** administrador
**Quiero** crear, editar, eliminar y listar platos del menu
**Para** mantener el menu actualizado

**Criterios de aceptacion:**
- [ ] Puedo ver una tabla con todos los platos
- [ ] Puedo crear un nuevo plato con: nombre, descripcion, precio, categoria, imagen
- [ ] Puedo asociar ingredientes al plato (default, extra, removible)
- [ ] Puedo editar cualquier campo de un plato existente
- [ ] Puedo eliminar un plato (soft delete o solo si no tiene pedidos activos)
- [ ] Los cambios se reflejan inmediatamente en el menu publico

---

## HU09 - Disponibilidad de Platos

**Como** administrador
**Quiero** marcar un plato como disponible o agotado
**Para** que los clientes no puedan pedir algo que no hay

**Criterios de aceptacion:**
- [ ] Desde la tabla de platos, puedo activar/desactivar con un toggle
- [ ] Un plato desactivado no aparece en el menu publico (QR)
- [ ] Un plato desactivado se muestra grisado u oculto en el panel admin
- [ ] Puedo desactivar un plato aunque tenga pedidos previos (no afecta pedidos ya creados)

---

## HU10 - Gestion de Ingredientes

**Como** administrador
**Quiero** administrar el catalogo de ingredientes con su stock y disponibilidad
**Para** controlar que platos se pueden ofrecer

**Criterios de aceptacion:**
- [ ] Puedo ver una lista de todos los ingredientes
- [ ] Puedo crear un nuevo ingrediente con: nombre, stock, precio_extra, disponible
- [ ] Puedo editar cualquier campo de un ingrediente
- [ ] Puedo marcar un ingrediente como agotado
- [ ] El stock de cada ingrediente es visible

---

## HU11 - Dashboard de Pedidos Activos

**Como** mozo
**Quiero** ver todos los pedidos activos agrupados por estado
**Para** gestionar las ordenes de forma eficiente

**Criterios de aceptacion:**
- [ ] El dashboard muestra columnas por estado (pendiente, confirmado, en_preparacion, listo)
- [ ] Cada pedido se muestra como una card con: mesa, hora, platos, total
- [ ] Puedo cambiar el estado de un pedido desde la card
- [ ] El dashboard se actualiza cuando cambia el estado de un pedido
- [ ] Puedo filtrar pedidos por mesa

---

## HU12 - Cancelar Pedido

**Como** mozo o cliente
**Quiero** cancelar un pedido que aun no ha sido confirmado
**Para** evitar que se prepare comida que ya no se necesita

**Criterios de aceptacion:**
- [ ] Solo se puede cancelar un pedido en estado "pendiente"
- [ ] Si el pedido ya fue confirmado, la opcion de cancelar no esta disponible
- [ ] Al cancelar, el pedido pasa a estado "cancelado"
- [ ] El cliente ve que su pedido fue cancelado
- [ ] Los pedidos cancelados se muestran en gris en el dashboard

---

## Resumen de Prioridades

| ID | Historia | Prioridad | Sprint |
|----|----------|-----------|--------|
| HU01 | Login/Auth | Alta | 2 |
| HU02 | Gestion de Mesas y QR | Alta | 2 |
| HU03 | Menu Publico por QR | Alta | 3 |
| HU04 | Ciclo de Vida del Pedido | Alta | 3 |
| HU05 | Crear Pedido desde QR | Alta | 3 |
| HU06 | Seguimiento de Pedido | Alta | 4 |
| HU07 | Personalizar Platos | Alta | 3 |
| HU08 | Gestion de Platos | Alta | 2 |
| HU09 | Disponibilidad de Platos | Media | 4 |
| HU10 | Gestion de Ingredientes | Media | 2 |
| HU11 | Dashboard de Pedidos | Media | 4 |
| HU12 | Cancelar Pedido | Media | 3 |
