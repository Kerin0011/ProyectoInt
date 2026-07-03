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
        try {
            localStorage.setItem("cached_menu_" + mesaToken, JSON.stringify({ data: menuData, ts: Date.now() }));
        } catch {}
    } catch (err) {
        try {
            const cached = localStorage.getItem("cached_menu_" + mesaToken);
            if (cached) {
                menuData = JSON.parse(cached).data;
                showToast("Mostrando menu sin conexion", "warning");
            } else {
                container.innerHTML = `<div class="menu-app"><div class="empty-state" style="padding-top:80px">${Icons.icon('xCircle', 48)}<p>Sin conexion. Conectate a internet para ver el menu.</p></div></div>`;
                return;
            }
        } catch {
            container.innerHTML = `<div class="menu-app"><div class="empty-state" style="padding-top:80px">${Icons.icon('xCircle', 48)}<p>Sin conexion. Conectate a internet para ver el menu.</p></div></div>`;
            return;
        }
    }

    buildCache();

    window.platosMenu = {};
    menuData.categorias.forEach(cat => {
        cat.platos.forEach(p => {
            window.platosMenu[p.id] = p;
        });
    });

    renderShell();
}

let allPlatosCache = [];
let categoriasKeys = [];

function buildCache() {
    allPlatosCache = [];
    categoriasKeys = [];
    const catSet = new Set();
    (menuData.categorias || []).forEach(cat => {
        catSet.add(cat.nombre);
        (cat.platos || []).forEach(p => {
            allPlatosCache.push({ ...p, categoria_nombre: cat.nombre });
        });
    });
    categoriasKeys = [...catSet];
}

function renderShell() {
    const container = document.getElementById("app-content");
    const cartCount = cart.reduce((sum, item) => sum + item.cantidad, 0);

    container.innerHTML = `
    <div class="menu-app">
        <div class="header-bar">
            <div class="restaurant-info">
                <h1>Restaurant Order</h1>
                <div class="table-badge">
                    ${Icons.icon('globe', 14)} Mesa ${menuData.mesa}
                </div>
            </div>
            <div class="quick-actions">
                <button class="quick-btn" onclick="window.llamarMesero()">
                    ${Icons.icon('phone', 14)} Llamar
                </button>
                <button class="quick-btn" onclick="window.pedirCuenta()">
                    ${Icons.icon('card', 14)} Cuenta
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
                ${Icons.icon('search', 20)}
                <input type="text" id="menu-search" placeholder="Buscar platos..." value="${searchQuery}" oninput="window.onSearchInput(this.value)">
                <button class="search-clear${searchQuery ? ' visible' : ''}" id="search-clear-btn" onclick="window.clearSearch()">${Icons.icon('xCircle', 18)}</button>
            </div>
        </div>

        <div class="categories-scroll" id="categories-pills"></div>
        <div id="menu-products"></div>
        <div id="menu-modal-container"></div>
        <div id="menu-fab"></div>
    </div>`;

    renderCategories();
    renderProducts();
    updateFab();
}

function renderCategories() {
    const pillsContainer = document.getElementById("categories-pills");
    if (!pillsContainer) return;
    pillsContainer.innerHTML = `
        <div class="category-pill ${activeCategory === 'todas' ? 'active' : ''}" onclick="window.onCategoryClick('todas')">Todas</div>
        ${categoriasKeys.map(cat => `
            <div class="category-pill ${activeCategory === cat ? 'active' : ''}" onclick="window.onCategoryClick('${cat}')">${cat}</div>
        `).join("")}
    `;
}

function renderProducts() {
    const productsContainer = document.getElementById("menu-products");
    if (!productsContainer) return;

    const filtered = allPlatosCache.filter(p => {
        const matchCat = activeCategory === "todas" || p.categoria_nombre === activeCategory;
        const matchSearch = !searchQuery || p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));
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

    if (groupedByCategory.size === 0) {
        productsContainer.innerHTML = `<div class="empty-state">${Icons.icon('platos', 36)}<p>No se encontraron platos</p></div>`;
        return;
    }

    let html = "";
    groupedByCategory.forEach((platos, catName) => {
        html += `<div class="section-header">${catName}</div>`;
        html += `<div class="products-grid">`;
        platos.forEach((p, idx) => {
            const globalIdx = allPlatosCache.indexOf(p);
            html += `
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
        html += `</div>`;
    });

    productsContainer.innerHTML = html;
}

function updateFab() {
    const fabContainer = document.getElementById("menu-fab");
    if (!fabContainer) return;
    const cartCount = cart.reduce((sum, item) => sum + item.cantidad, 0);
    if (cartCount > 0) {
        fabContainer.innerHTML = `
        <button class="cart-fab" onclick="window.abrirCarrito()">
            ${Icons.icon('cart', 24)}
            <span class="cart-badge">${cartCount}</span>
        </button>`;
    } else {
        fabContainer.innerHTML = "";
    }
}

function refreshDisplay() {
    renderProducts();
    updateFab();
}

router.register("/menu", renderMenuPublicoPage);

let searchDebounce = null;
window.onSearchInput = function(value) {
    searchQuery = value;
    const clearBtn = document.getElementById("search-clear-btn");
    if (clearBtn) clearBtn.className = "search-clear" + (value ? " visible" : "");
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
        renderProducts();
    }, 150);
};

window.clearSearch = function() {
    searchQuery = "";
    const input = document.getElementById("menu-search");
    if (input) { input.value = ""; input.focus(); }
    const clearBtn = document.getElementById("search-clear-btn");
    if (clearBtn) clearBtn.className = "search-clear";
    renderProducts();
};

window.onCategoryClick = function(cat) {
    activeCategory = cat;
    renderCategories();
    renderProducts();
};

window.llamarMesero = function() {
    fetch(`${API_BASE}/api/public/solicitar/${mesaToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "mesero" })
    }).then(() => {
        Swal.fire({
            title: "Mesero notificado",
            text: "Un mesero vendra a tu mesa en breve.",
            icon: "success",
            timer: 2500,
            showConfirmButton: false
        });
    }).catch(() => {
        Swal.fire({
            title: "Mesero notificado",
            text: "Un mesero vendra a tu mesa en breve.",
            icon: "success",
            timer: 2500,
            showConfirmButton: false
        });
    });
};

window.pedirCuenta = function() {
    fetch(`${API_BASE}/api/public/solicitar/${mesaToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "cuenta" })
    }).then(() => {
        Swal.fire({
            title: "Cuenta solicitada",
            text: "El mesero traera la cuenta a tu mesa.",
            icon: "info",
            confirmButtonText: "Entendido",
            confirmButtonColor: "#d4742b"
        });
    }).catch(() => {
        Swal.fire({
            title: "Cuenta solicitada",
            text: "El mesero traera la cuenta a tu mesa.",
            icon: "info",
            confirmButtonText: "Entendido",
            confirmButtonColor: "#d4742b"
        });
    });
};

window.abrirPersonalizacion = function(platoId, nombre, precioBase, keepState) {
    const plato = window.platosMenu[platoId];
    if (!plato) return;

    let c = keepState && window._currentCustomization ? window._currentCustomization : {
        platoId, nombre, precioBase,
        extraIngredientes: [],
        quitarIngredientes: [],
        precioExtra: 0,
        cantidad: 1,
        getTotal() { return (this.precioBase + this.precioExtra) * this.cantidad; }
    };

    const container = document.getElementById("menu-modal-container");
    const isReopen = keepState && container.querySelector(".customization-overlay");

    if (isReopen) {
        window._currentCustomization = c;
        refreshCustomizationDOM(c, plato);
        return;
    }

    window._currentCustomization = c;

    const currentPrice = precioBase + c.precioExtra;
    container.innerHTML = `
    <div class="customization-overlay" onclick="if(event.target===this)document.getElementById('menu-modal-container').innerHTML=''">
        <div class="customization-sheet" onclick="event.stopPropagation()">
            <div class="customization-header">
                <h5>${nombre}</h5>
                <button class="cart-modal-close" onclick="document.getElementById('menu-modal-container').innerHTML=''">&times;</button>
            </div>
            <div class="customization-body">
                <div class="customization-price" id="precio-actual">${formatPrice(currentPrice)}</div>
                <div id="custom-ingredients">
                    ${buildIngredientsHTML(plato, c)}
                </div>
                <input type="number" class="qty-input" id="cantidad-plato" value="${c.cantidad}" min="1" max="20" onchange="window._setCantidad(this.value, ${platoId}, '${nombre.replace(/'/g, "\\'")}', ${precioBase})">
            </div>
            <div class="cart-modal-footer">
                <button class="btn-add-cart" id="btn-add-cart-final" onclick="window._confirmarPersonalizacion(${platoId}, '${nombre.replace(/'/g, "\\'")}', ${precioBase})">
                    Agregar al carrito &mdash; ${formatPrice(currentPrice * c.cantidad)}
                </button>
            </div>
        </div>
    </div>`;
};

function buildIngredientsHTML(plato, c) {
    return (plato.ingredientes || []).map(ing => {
        if (ing.es_default && !ing.es_removible) {
            return `<div class="ingredient-row">
                <span class="ing-name">${ing.nombre}</span>
                <span class="ing-tag default">Incluido</span>
            </div>`;
        }
        if (ing.es_removible) {
            const isRemoved = c.quitarIngredientes.some(i => i.id === ing.id);
            return `<div class="ingredient-row${isRemoved ? ' removed-row' : ''}" id="ing-row-${ing.id}">
                <span class="ing-name" style="${isRemoved ? 'opacity:0.4;text-decoration:line-through' : ''}">${ing.nombre}</span>
                <span class="ing-tag default">Incluido</span>
                <button class="btn-ing remove ${isRemoved ? 'active' : ''}" id="btn-ing-${ing.id}" onclick="window._toggleQuitar(${ing.id})">
                    ${isRemoved ? 'Restaurar' : 'Quitar'}
                </button>
            </div>`;
        }
        if (ing.es_extra) {
            const isAdded = c.extraIngredientes.some(i => i.id === ing.id);
            return `<div class="ingredient-row" id="ing-row-${ing.id}">
                <span class="ing-name">${ing.nombre}</span>
                <span class="ing-tag extra">+${formatPrice(ing.precio_extra)}</span>
                <button class="btn-ing add ${isAdded ? 'active' : ''}" id="btn-ing-${ing.id}" onclick="window._toggleExtra(${ing.id}, ${ing.precio_extra})">
                    ${isAdded ? 'Quitar' : 'Agregar'}
                </button>
            </div>`;
        }
        return "";
    }).join("");
}

function refreshCustomizationDOM(c, plato) {
    const currentPrice = c.precioBase + c.precioExtra;

    const precioEl = document.getElementById("precio-actual");
    if (precioEl) precioEl.textContent = formatPrice(currentPrice);

    const btnFinal = document.getElementById("btn-add-cart-final");
    if (btnFinal) btnFinal.innerHTML = `Agregar al carrito &mdash; ${formatPrice(currentPrice * c.cantidad)}`;

    (plato.ingredientes || []).forEach(ing => {
        const row = document.getElementById(`ing-row-${ing.id}`);
        const btn = document.getElementById(`btn-ing-${ing.id}`);
        if (!row || !btn) return;

        if (ing.es_removible) {
            const isRemoved = c.quitarIngredientes.some(i => i.id === ing.id);
            row.className = `ingredient-row${isRemoved ? ' removed-row' : ''}`;
            const nameEl = row.querySelector(".ing-name");
            if (nameEl) {
                nameEl.style.opacity = isRemoved ? "0.4" : "";
                nameEl.style.textDecoration = isRemoved ? "line-through" : "";
            }
            btn.className = `btn-ing remove ${isRemoved ? 'active' : ''}`;
            btn.textContent = isRemoved ? "Restaurar" : "Quitar";
        }
        if (ing.es_extra) {
            const isAdded = c.extraIngredientes.some(i => i.id === ing.id);
            btn.className = `btn-ing add ${isAdded ? 'active' : ''}`;
            btn.textContent = isAdded ? "Quitar" : "Agregar";
        }
    });
}

window._toggleExtra = function(ingId, precio) {
    const c = window._currentCustomization;
    if (!c) return;
    const idx = c.extraIngredientes.findIndex(i => i.id === ingId);
    if (idx >= 0) {
        c.extraIngredientes.splice(idx, 1);
        c.precioExtra -= precio;
    } else {
        c.extraIngredientes.push({ id: ingId, precio });
        c.precioExtra += precio;
    }
    const plato = window.platosMenu[c.platoId];
    if (plato) refreshCustomizationDOM(c, plato);
};

window._toggleQuitar = function(ingId) {
    const c = window._currentCustomization;
    if (!c) return;
    const idx = c.quitarIngredientes.findIndex(i => i.id === ingId);
    if (idx >= 0) {
        c.quitarIngredientes.splice(idx, 1);
    } else {
        c.quitarIngredientes.push({ id: ingId });
    }
    const plato = window.platosMenu[c.platoId];
    if (plato) refreshCustomizationDOM(c, plato);
};

window._setCantidad = function(value) {
    const c = window._currentCustomization;
    if (!c) return;
    c.cantidad = parseInt(value) || 1;
    const plato = window.platosMenu[c.platoId];
    if (plato) refreshCustomizationDOM(c, plato);
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
    refreshDisplay();
};

window.abrirCarrito = function() {
    const container = document.getElementById("menu-modal-container");
    const total = cart.reduce((sum, item) => sum + (item.precio_final * item.cantidad), 0);

    function rebuildCart() {
        container.innerHTML = `
        <div class="cart-modal-overlay" onclick="if(event.target===this){document.getElementById('menu-modal-container').innerHTML='';window.refreshDisplay();}">
            <div class="cart-modal-sheet" onclick="event.stopPropagation()">
                <div class="cart-modal-header">
                    <h5>${Icons.icon('cart', 20)} Tu Pedido <span class="cart-count">${cart.reduce((s,i) => s+i.cantidad, 0)}</span></h5>
                    <button class="cart-modal-close" onclick="document.getElementById('menu-modal-container').innerHTML='';window.refreshDisplay()">&times;</button>
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
        refreshDisplay();
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

    const detalles = cart.map(item => ({
        plato_id: item.plato_id,
        cantidad: item.cantidad,
        personalizaciones: item.personalizaciones
    }));

    try {
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
        if (!navigator.onLine) {
            queueOrder({ mesa_token: mesaToken, detalles: detalles });
            cart = [];
            document.getElementById("menu-modal-container").innerHTML = "";
            showToast("Sin conexion. Tu pedido se enviara cuando vuelva internet.", "warning");
            refreshDisplay();
        } else {
            showToast(err.message, "danger");
        }
    }
};

function queueOrder(order) {
    try {
        const queue = JSON.parse(localStorage.getItem("order_queue") || "[]");
        queue.push(order);
        localStorage.setItem("order_queue", JSON.stringify(queue));
    } catch {}
}

function syncQueuedOrders() {
    try {
        const queue = JSON.parse(localStorage.getItem("order_queue") || "[]");
        if (queue.length === 0) return;
        queue.forEach(order => {
            fetch(`${API_BASE}/api/public/pedidos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(order)
            }).catch(() => {});
        });
        localStorage.removeItem("order_queue");
    } catch {}
}

window.addEventListener("online", syncQueuedOrders);
