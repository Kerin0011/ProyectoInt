let cart = [];
let mesaToken = "";
let menuData = null;
let activeCategory = "todas";
let searchQuery = "";

const FOOD_EMOJIS = ["🍔", "🍕", "🥗", "🍝", "🥩", "🍗", "🌮", "🥘", "🍜", "🍰", "🥤", "☕", "🧁", "🍩", "🥪", "🍟"];

function foodEmoji(index) {
    return FOOD_EMOJIS[index % FOOD_EMOJIS.length];
}

async function renderMenuPublicoPage(container) {
    const hash = window.location.hash.slice(1);
    mesaToken = hash.replace("/menu/", "");

    try {
        menuData = await fetch(`${API_BASE}/api/public/menu/${mesaToken}`).then(r => r.json());
    } catch (err) {
        container.innerHTML = `<div class="menu-app"><div class="empty-state" style="padding-top:80px">${Icons.icon('xCircle', 48)}<p>Mesa no encontrada o QR invalido</p></div></div>`;
        return;
    }

    render();
}

function render() {
    const container = document.getElementById("app-content");
    const allPlatos = [];
    const categorias = new Map();

    menuData.categorias.forEach(cat => {
        categorias.set(cat.nombre, []);
        cat.platos.forEach(p => {
            allPlatos.push({ ...p, categoria_nombre: cat.nombre });
            categorias.get(cat.nombre).push({ ...p, categoria_nombre: cat.nombre });
        });
    });

    const cartCount = cart.reduce((sum, item) => sum + item.cantidad, 0);

    const filtered = allPlatos.filter(p => {
        const matchCat = activeCategory === "todas" || p.categoria_nombre === activeCategory;
        const matchSearch = !searchQuery || p.nombre.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });

    const groupedByCategory = new Map();
    if (activeCategory === "todas") {
        filtered.forEach(p => {
            if (!groupedByCategory.has(p.categoria_nombre)) groupedByCategory.set(p.categoria_nombre, []);
            groupedByCategory.get(p.categoria_nombre).push(p);
        });
    } else {
        if (filtered.length) groupedByCategory.set(activeCategory, filtered);
    }

    let productsHTML = "";
    if (groupedByCategory.size === 0) {
        productsHTML = `<div class="empty-state">${Icons.icon('platos', 36)}<p>No se encontraron platos</p></div>`;
    } else {
        groupedByCategory.forEach((platos, catName) => {
            productsHTML += `<div class="section-header">${catName}</div>`;
            productsHTML += `<div class="products-grid">`;
            platos.forEach((p, idx) => {
                const globalIdx = allPlatos.indexOf(p);
                productsHTML += `
                    <div class="product-card" onclick="window.abrirPersonalizacion(${p.id}, '${p.nombre.replace(/'/g, "\\'")}', ${p.precio_base})">
                        <div class="card-img">${p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre}" onerror="this.parentElement.innerHTML='${foodEmoji(globalIdx)}'">` : foodEmoji(globalIdx)}</div>
                        <div class="card-body">
                            <div class="card-title">${p.nombre}</div>
                            <div class="card-desc">${p.descripcion || ""}</div>
                            <div class="card-footer">
                                <span class="card-price">${formatPrice(p.precio_base)}</span>
                                <button class="btn-add" onclick="event.stopPropagation(); window.abrirPersonalizacion(${p.id}, '${p.nombre.replace(/'/g, "\\'")}', ${p.precio_base})">+</button>
                            </div>
                        </div>
                    </div>`;
            });
            productsHTML += `</div>`;
        });
    }

    container.innerHTML = `
    <div class="menu-app">
        <div class="header-bar">
            <div class="restaurant-info">
                <h1>Restaurant Order</h1>
                <div class="table-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    Mesa ${menuData.mesa}
                </div>
            </div>
            <div class="quick-actions">
                <button class="quick-btn" onclick="window.llamarMesero()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    Llamar
                </button>
                <button class="quick-btn" onclick="window.pedirCuenta()">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    Cuenta
                </button>
            </div>
        </div>

        <div class="hero-banner">
            <div class="hero-icon">🍽️</div>
            <h2>Nuestro Menú</h2>
            <p>Selecciona tus platos favoritos</p>
        </div>

        <div class="search-bar-wrap">
            <div class="search-bar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="menu-search" placeholder="Buscar platos..." value="${searchQuery}" oninput="window.onSearch(this.value)">
            </div>
        </div>

        <div class="categories-scroll" id="categories-pills">
            <div class="category-pill ${activeCategory === 'todas' ? 'active' : ''}" onclick="window.onCategoryClick('todas')">Todas</div>
            ${[...categorias.keys()].map(cat => `
                <div class="category-pill ${activeCategory === cat ? 'active' : ''}" onclick="window.onCategoryClick('${cat}')">${cat}</div>
            `).join("")}
        </div>

        ${productsHTML}

        <div id="menu-modal-container"></div>

        ${cartCount > 0 ? `
        <button class="cart-fab" onclick="window.abrirCarrito()">
            ${Icons.icon('cart', 24)}
            <span class="cart-badge">${cartCount}</span>
        </button>` : ""}
    </div>`;

    window.platosMenu = {};
    menuData.categorias.forEach(cat => {
        cat.platos.forEach(p => {
            window.platosMenu[p.id] = p;
        });
    });
}

router.register("/menu", renderMenuPublicoPage);

window.onSearch = function(value) {
    searchQuery = value;
    render();
};

window.onCategoryClick = function(cat) {
    activeCategory = cat;
    render();
};

window.llamarMesero = function() {
    Swal.fire({
        title: "Llamando al mesero",
        text: "Un mesero vendra a tu mesa en breve.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
    });
};

window.pedirCuenta = function() {
    Swal.fire({
        title: "Solicitar la cuenta",
        text: "El mesero traera la cuenta a tu mesa.",
        icon: "info",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#d4742b"
    });
};

window.abrirPersonalizacion = function(platoId, nombre, precioBase) {
    const plato = window.platosMenu[platoId];
    if (!plato) return;

    let precioExtra = 0;
    let extraIngredientes = [];
    let quitarIngredientes = [];
    let cantidad = 1;

    function rebuildSheet() {
        const currentPrice = precioBase + precioExtra;
        const container = document.getElementById("menu-modal-container");
        container.innerHTML = `
        <div class="customization-overlay" onclick="if(event.target===this)document.getElementById('menu-modal-container').innerHTML=''">
            <div class="customization-sheet" onclick="event.stopPropagation()">
                <div class="customization-header">
                    <h5>${nombre}</h5>
                    <button class="cart-modal-close" onclick="document.getElementById('menu-modal-container').innerHTML=''">&times;</button>
                </div>
                <div class="customization-body">
                    <div class="customization-price" id="precio-actual">${formatPrice(currentPrice)}</div>
                    ${plato.ingredientes.map(ing => {
                        if (ing.es_default && !ing.es_removible) {
                            return `<div class="ingredient-row">
                                <span class="ing-name">${ing.nombre}</span>
                                <span class="ing-tag default">Incluido</span>
                            </div>`;
                        }
                        if (ing.es_removible) {
                            const isRemoved = quitarIngredientes.some(i => i.id === ing.id);
                            return `<div class="ingredient-row${isRemoved ? ' removed-row' : ''}">
                                <span class="ing-name" style="${isRemoved ? 'opacity:0.4;text-decoration:line-through' : ''}">${ing.nombre}</span>
                                <span class="ing-tag default">Incluido</span>
                                <button class="btn-ing remove ${isRemoved ? 'active' : ''}" onclick="window._toggleQuitar(${ing.id}, ${platoId}, '${nombre.replace(/'/g, "\\'")}', ${precioBase})">
                                    ${isRemoved ? 'Restaurar' : 'Quitar'}
                                </button>
                            </div>`;
                        }
                        if (ing.es_extra) {
                            const isAdded = extraIngredientes.some(i => i.id === ing.id);
                            return `<div class="ingredient-row">
                                <span class="ing-name">${ing.nombre}</span>
                                <span class="ing-tag extra">+${formatPrice(ing.precio_extra)}</span>
                                <button class="btn-ing add ${isAdded ? 'active' : ''}" onclick="window._toggleExtra(${ing.id}, ${ing.precio_extra}, ${platoId}, '${nombre.replace(/'/g, "\\'")}', ${precioBase})">
                                    ${isAdded ? 'Quitar' : 'Agregar'}
                                </button>
                            </div>`;
                        }
                        return "";
                    }).join("")}
                    <input type="number" class="qty-input" id="cantidad-plato" value="${cantidad}" min="1" max="20" onchange="window._setCantidad(this.value, ${platoId}, '${nombre.replace(/'/g, "\\'")}', ${precioBase})">
                </div>
                <div class="cart-modal-footer">
                    <button class="btn-add-cart" onclick="window._confirmarPersonalizacion(${platoId}, '${nombre.replace(/'/g, "\\'")}', ${precioBase})">
                        Agregar al carrito &mdash; ${formatPrice(currentPrice * cantidad)}
                    </button>
                </div>
            </div>
        </div>`;

        window._currentCustomization = {
            platoId, nombre, precioBase,
            extraIngredientes, quitarIngredientes,
            precioExtra, cantidad,
            getTotal: () => (precioBase + precioExtra) * cantidad
        };
    }

    rebuildSheet();
};

window._toggleExtra = function(ingId, precio, platoId, nombre, precioBase) {
    const c = window._currentCustomization;
    const idx = c.extraIngredientes.findIndex(i => i.id === ingId);
    if (idx >= 0) {
        c.extraIngredientes.splice(idx, 1);
        c.precioExtra -= precio;
    } else {
        c.extraIngredientes.push({ id: ingId, precio });
        c.precioExtra += precio;
    }
    window._currentCustomization = c;
    window.abrirPersonalizacion(platoId, nombre, precioBase);
};

window._toggleQuitar = function(ingId, platoId, nombre, precioBase) {
    const c = window._currentCustomization;
    const idx = c.quitarIngredientes.findIndex(i => i.id === ingId);
    if (idx >= 0) {
        c.quitarIngredientes.splice(idx, 1);
    } else {
        c.quitarIngredientes.push({ id: ingId });
    }
    window._currentCustomization = c;
    window.abrirPersonalizacion(platoId, nombre, precioBase);
};

window._setCantidad = function(value, platoId, nombre, precioBase) {
    const c = window._currentCustomization;
    if (c) c.cantidad = parseInt(value) || 1;
    window._currentCustomization = c;
    window.abrirPersonalizacion(platoId, nombre, precioBase);
};

window._confirmarPersonalizacion = function(platoId, nombre, precioBase) {
    const c = window._currentCustomization;
    if (!c) return;

    const personalizaciones = [
        ...c.extraIngredientes.map(i => ({ ingrediente_id: i.id, accion: "agregar", cantidad: 1 })),
        ...c.quitarIngredientes.map(i => ({ ingrediente_id: i.id, accion: "quitar", cantidad: 1 }))
    ];

    const existente = cart.find(item =>
        item.plato_id === platoId &&
        JSON.stringify(item.personalizaciones) === JSON.stringify(personalizaciones)
    );

    if (existente) {
        existente.cantidad += c.cantidad;
    } else {
        cart.push({
            plato_id: platoId,
            nombre: nombre,
            precio_base: precioBase,
            cantidad: c.cantidad,
            personalizaciones: personalizaciones,
            precio_final: precioBase + c.precioExtra
        });
    }

    document.getElementById("menu-modal-container").innerHTML = "";
    render();
};

window.abrirCarrito = function() {
    const container = document.getElementById("menu-modal-container");
    const total = cart.reduce((sum, item) => sum + (item.precio_final * item.cantidad), 0);

    function rebuildCart() {
        container.innerHTML = `
        <div class="cart-modal-overlay" onclick="if(event.target===this){document.getElementById('menu-modal-container').innerHTML='';render();}">
            <div class="cart-modal-sheet" onclick="event.stopPropagation()">
                <div class="cart-modal-header">
                    <h5>${Icons.icon('cart', 20)} Tu Pedido <span class="cart-count">${cart.reduce((s,i) => s+i.cantidad, 0)}</span></h5>
                    <button class="cart-modal-close" onclick="document.getElementById('menu-modal-container').innerHTML='';render()">&times;</button>
                </div>
                <div class="cart-modal-body">
                    ${cart.length === 0 ? '<div class="empty-state"><p>Carrito vacio</p></div>' : cart.map((item, idx) => `
                        <div class="cart-item">
                            <div class="cart-item-info">
                                <div class="cart-item-name">${item.nombre}</div>
                                ${item.personalizaciones.length > 0 ? `
                                <div class="cart-item-custom">${item.personalizaciones.map(p => p.accion + " " + (window.platosMenu[item.plato_id]?.ingredientes?.find(i => i.id === p.ingrediente_id)?.nombre || "")).join(", ")}</div>` : ""}
                                <div class="cart-item-actions">
                                    <button class="cart-item-btn" onclick="window._cartDecrease(${idx})">−</button>
                                    <span class="cart-item-qty">${item.cantidad}</span>
                                    <button class="cart-item-btn" onclick="window._cartIncrease(${idx})">+</button>
                                    <button class="cart-item-btn cart-item-remove" onclick="window._cartRemove(${idx})">${Icons.icon('trash', 14)}</button>
                                </div>
                            </div>
                            <div class="cart-item-price">${formatPrice(item.precio_final * item.cantidad)}</div>
                        </div>
                    `).join("")}
                </div>
                ${cart.length > 0 ? `
                <div class="cart-modal-footer">
                    <div class="cart-total-row">
                        <span>Total</span>
                        <span class="cart-total-price">${formatPrice(total)}</span>
                    </div>
                    <button class="btn-confirm-order" onclick="window._confirmarPedido()">
                        ${Icons.icon('check', 20)} Confirmar Pedido
                    </button>
                </div>` : ""}
            </div>
        </div>`;
    }

    rebuildCart();
};

window._cartIncrease = function(idx) {
    cart[idx].cantidad++;
    window.abrirCarrito();
};

window._cartDecrease = function(idx) {
    if (cart[idx].cantidad > 1) {
        cart[idx].cantidad--;
    } else {
        cart.splice(idx, 1);
    }
    window.abrirCarrito();
};

window._cartRemove = function(idx) {
    cart.splice(idx, 1);
    if (cart.length === 0) {
        document.getElementById("menu-modal-container").innerHTML = "";
        render();
    } else {
        window.abrirCarrito();
    }
};

window._confirmarPedido = async function() {
    const result = await Swal.fire({
        title: "Confirmar Pedido",
        text: "Tu pedido sera enviado a la cocina.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Confirmar",
        cancelButtonText: "Seguir comprando",
        confirmButtonColor: "#d4742b",
        reverseButtons: true
    });

    if (!result.isConfirmed) return;

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
        document.getElementById("menu-modal-container").innerHTML = "";
        showToast("Pedido enviado con exito!", "success");
        router.navigate(`/seguimiento/${data.id}/${mesaToken}`);
    } catch (err) {
        showToast(err.message, "danger");
    }
};
