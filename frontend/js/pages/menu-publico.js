let cart = [];
let mesaToken = "";

async function renderMenuPublicoPage(container) {
    const hash = window.location.hash.slice(1);
    mesaToken = hash.replace("/menu/", "");

    let menu;
    try {
        menu = await fetch(`${API_BASE}/api/public/menu/${mesaToken}`).then(r => r.json());
    } catch (err) {
        container.innerHTML = `<div class="alert alert-danger m-4">Mesa no encontrada o QR invalido</div>`;
        return;
    }

    function render() {
        const cartCount = cart.reduce((sum, item) => sum + item.cantidad, 0);

        container.innerHTML = `
        <nav class="navbar navbar-dark bg-dark mb-3 rounded">
            <div class="container-fluid">
                <span class="navbar-brand"><i class="bi bi-shop"></i> Mesa ${menu.mesa}</span>
                <span class="text-light">Selecciona tus platos</span>
            </div>
        </nav>

        ${menu.categorias.map(cat => `
            <div class="category-section">
                <h4 class="category-title">${cat.nombre}</h4>
                <div class="row">
                    ${cat.platos.map(p => `
                        <div class="col-md-4 col-sm-6 mb-3">
                            <div class="card dish-card h-100" onclick="window.abrirPersonalizacion(${p.id}, '${p.nombre.replace(/'/g, "\\'")}', ${p.precio_base})">
                                <div class="card-body">
                                    <h6 class="card-title">${p.nombre}</h6>
                                    <p class="card-text small text-muted">${p.descripcion || ""}</p>
                                    <p class="card-text fw-bold text-primary">${formatPrice(p.precio_base)}</p>
                                </div>
                            </div>
                        </div>`).join("")}
                </div>
            </div>`).join("")}

        ${cartCount > 0 ? `
        <button class="btn btn-primary cart-fab" onclick="window.abrirCarrito()">
            <i class="bi bi-cart3"></i>
            <span class="badge bg-danger cart-badge">${cartCount}</span>
        </button>` : ""}

        <div id="modal-container"></div>`;

        window.platosMenu = {};
        menu.categorias.forEach(cat => {
            cat.platos.forEach(p => {
                window.platosMenu[p.id] = p;
            });
        });
    }

    render();
}

router.register("/menu", renderMenuPublicoPage);

window.abrirPersonalizacion = function(platoId, nombre, precioBase) {
    const plato = window.platosMenu[platoId];
    if (!plato) return;

    const container = document.getElementById("modal-container");
    container.innerHTML = `
    <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${nombre}</h5>
                    <button type="button" class="btn-close" onclick="document.getElementById('modal-container').innerHTML=''"></button>
                </div>
                <div class="modal-body">
                    <p class="fw-bold">Precio base: <span id="precio-actual">${formatPrice(precioBase)}</span></p>
                    <p class="text-muted small">Personaliza los ingredientes:</p>
                    <div id="ingredientes-lista">
                        ${plato.ingredientes.map(ing => {
                            if (ing.es_default && !ing.es_removible) {
                                return `<div class="ingredient-option">
                                    <span>${ing.nombre} <small class="text-muted">(incluido)</small></span>
                                    <span class="text-muted">--</span>
                                </div>`;
                            }
                            if (ing.es_removible) {
                                return `<div class="ingredient-option" id="ing-row-${ing.id}">
                                    <span>${ing.nombre} <small class="text-muted">(incluido)</small></span>
                                    <button class="btn btn-sm btn-outline-danger quitar-ing-btn" data-id="${ing.id}" data-precio="0">
                                        Quitar
                                    </button>
                                </div>`;
                            }
                            if (ing.es_extra) {
                                return `<div class="ingredient-option">
                                    <span>${ing.nombre} <small class="text-success">+${formatPrice(ing.precio_extra)}</small></span>
                                    <button class="btn btn-sm btn-outline-success agregar-ing-btn" data-id="${ing.id}" data-precio="${ing.precio_extra}">
                                        Agregar
                                    </button>
                                </div>`;
                            }
                            return "";
                        }).join("")}
                    </div>
                    <div class="mt-3">
                        <label class="form-label">Cantidad</label>
                        <input type="number" class="form-control" id="cantidad-plato" value="1" min="1" max="20">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancelar</button>
                    <button class="btn btn-primary" id="btn-agregar-carrito">Agregar al carrito</button>
                </div>
            </div>
        </div>
    </div>`;

    let precioExtra = 0;
    let extraIngredientes = [];
    let quitarIngredientes = [];

    document.querySelectorAll(".agregar-ing-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            const precio = parseFloat(btn.dataset.precio);
            if (btn.classList.contains("active-ing")) {
                btn.classList.remove("active-ing", "btn-success");
                btn.classList.add("btn-outline-success");
                btn.textContent = "Agregar";
                precioExtra -= precio;
                extraIngredientes = extraIngredientes.filter(i => i.id !== id);
            } else {
                btn.classList.add("active-ing", "btn-success");
                btn.classList.remove("btn-outline-success");
                btn.textContent = "Quitar";
                precioExtra += precio;
                extraIngredientes.push({ id, precio });
            }
            document.getElementById("precio-actual").textContent = formatPrice(precioBase + precioExtra);
        });
    });

    document.querySelectorAll(".quitar-ing-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            const row = document.getElementById(`ing-row-${id}`);
            if (btn.classList.contains("active-rem")) {
                btn.classList.remove("active-rem", "btn-success");
                btn.classList.add("btn-outline-danger");
                btn.textContent = "Quitar";
                row.classList.remove("removed");
                quitarIngredientes = quitarIngredientes.filter(i => i.id !== id);
            } else {
                btn.classList.add("active-rem", "btn-success");
                btn.classList.remove("btn-outline-danger");
                btn.textContent = "Restaurar";
                row.classList.add("removed");
                quitarIngredientes.push({ id });
            }
        });
    });

    document.getElementById("btn-agregar-carrito").addEventListener("click", () => {
        const cantidad = parseInt(document.getElementById("cantidad-plato").value) || 1;
        const personalizaciones = [
            ...extraIngredientes.map(i => ({ ingrediente_id: i.id, accion: "agregar", cantidad: 1 })),
            ...quitarIngredientes.map(i => ({ ingrediente_id: i.id, accion: "quitar", cantidad: 1 }))
        ];

        const existente = cart.find(item =>
            item.plato_id === platoId &&
            JSON.stringify(item.personalizaciones) === JSON.stringify(personalizaciones)
        );

        if (existente) {
            existente.cantidad += cantidad;
        } else {
            cart.push({
                plato_id: platoId,
                nombre: nombre,
                precio_base: precioBase,
                cantidad: cantidad,
                personalizaciones: personalizaciones,
                precio_final: precioBase + precioExtra
            });
        }

        container.innerHTML = "";
        renderMenuPublicoPage(document.getElementById("app-content"));
    });
};

window.abrirCarrito = function() {
    const container = document.getElementById("modal-container");
    const total = cart.reduce((sum, item) => sum + (item.precio_final * item.cantidad), 0);

    container.innerHTML = `
    <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.5)">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-dark text-white">
                    <h5 class="modal-title"><i class="bi bi-cart3"></i> Tu Pedido</h5>
                    <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('modal-container').innerHTML=''"></button>
                </div>
                <div class="modal-body">
                    ${cart.length === 0 ? '<p class="text-muted">Carrito vacio</p>' : `
                    <div class="list-group mb-3">
                        ${cart.map((item, idx) => `
                            <div class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${item.nombre}</strong> x${item.cantidad}
                                    <br><small class="text-muted">
                                        ${item.personalizaciones.map(p => p.accion + " " + (window.platosMenu[item.plato_id]?.ingredientes.find(i => i.id === p.ingrediente_id)?.nombre || "")).join(", ") || "Sin cambios"}
                                    </small>
                                </div>
                                <div class="text-end">
                                    <span class="fw-bold">${formatPrice(item.precio_final * item.cantidad)}</span>
                                    <br><button class="btn btn-sm btn-outline-danger eliminar-item-btn" data-idx="${idx}">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>`).join("")}
                    </div>
                    <div class="d-flex justify-content-between fw-bold fs-5">
                        <span>Total:</span>
                        <span class="text-primary">${formatPrice(total)}</span>
                    </div>`}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Seguir comprando</button>
                    <button class="btn btn-success" id="btn-confirmar-pedido" ${cart.length === 0 ? "disabled" : ""}>
                        <i class="bi bi-check-circle"></i> Confirmar Pedido
                    </button>
                </div>
            </div>
        </div>
    </div>`;

    document.querySelectorAll(".eliminar-item-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx);
            cart.splice(idx, 1);
            document.getElementById("modal-container").innerHTML = "";
            window.abrirCarrito();
        });
    });

    document.getElementById("btn-confirmar-pedido")?.addEventListener("click", async () => {
        try {
            const detalles = cart.map(item => ({
                plato_id: item.plato_id,
                cantidad: item.cantidad,
                personalizaciones: item.personalizaciones
            }));
            const data = await fetch(`${API_BASE}/api/public/pedidos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mesa_token: mesaToken, detalles })
            }).then(r => r.json());

            cart = [];
            container.innerHTML = "";
            showToast("Pedido enviado con exito!", "success");
            router.navigate(`/seguimiento/${data.id}`);
        } catch (err) {
            showToast(err.message, "danger");
        }
    });
};
