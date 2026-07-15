let cart = [];
let mesaToken = "";
let menuData = null;
let activeCategory = "todas";
let searchQuery = "";

function menuOfflineHTML(container, mensaje) {
    container.innerHTML = `<div class="menu-app"><div class="empty-state" style="padding-top:80px">${Icons.icon('xCircle', 48)}<p>${mensaje}</p></div></div>`;
}

async function renderMenuPublicoPage(container) {
    const hash = window.location.hash.slice(1);
    mesaToken = hash.replace("/menu/", "");
    const cacheKey = "cached_menu_" + mesaToken;

    let loaded = null;

    try {
        const res = await fetch(`${API_BASE}/api/public/menu/${mesaToken}`);
        const data = await res.json().catch(() => null);

        if (res.ok && data && Array.isArray(data.categorias)) {
            loaded = data;
            // Only cache valid responses, never error payloads
            try { localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() })); } catch {}
        } else if (res.status === 404) {
            menuOfflineHTML(container, "Mesa no encontrada. Verifica el codigo QR.");
            return;
        }
        // Anything else (5xx, or the SW serving us an offline error) falls
        // through to the cache below.
    } catch (err) {
        // Genuinely offline: fall through to the cache below.
    }

    if (!loaded) {
        try {
            const cached = localStorage.getItem(cacheKey);
            const parsed = cached ? JSON.parse(cached).data : null;
            if (parsed && Array.isArray(parsed.categorias)) {
                loaded = parsed;
                showToast("Mostrando menu sin conexion", "warning");
            }
        } catch {}
    }

    if (!loaded) {
        menuOfflineHTML(container, "Sin conexion. Conectate a internet para ver el menu.");
        return;
    }

    menuData = loaded;
    buildCache();

    window.platosMenu = {};
    menuData.categorias.forEach(cat => {
        (cat.platos || []).forEach(p => {
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

    // The diner is a guest of the restaurant, not a user of Nexora
    document.title = RESTAURANT_NAME;

    container.innerHTML = `
    <div class="menu-app">
        <div class="header-bar">
            <div class="restaurant-info">
                <h1>${RESTAURANT_NAME}</h1>
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
        <div id="menu-cartbar"></div>
    </div>`;

    renderCategories();
    renderProducts();
    updateCartBar();
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

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Quantity of the un-customized variant, which is the one the card stepper drives
function plainCartQty(platoId) {
    const item = cart.find(i => i.plato_id === platoId && i.personalizaciones.length === 0 && !i.nota);
    return item ? item.cantidad : 0;
}

function cardImageHTML(p) {
    if (p.imagen_url) {
        return `<img src="${escapeHtml(p.imagen_url)}" alt="${escapeHtml(p.nombre)}" loading="lazy"
            onerror="this.style.display='none';this.parentElement.classList.add('sin-imagen')">
            <span class="img-placeholder-icon">${Icons.icon('utensils', 34)}</span>`;
    }
    return `<span class="img-placeholder-icon">${Icons.icon('utensils', 34)}</span>`;
}

function cardControlHTML(p) {
    const qty = plainCartQty(p.id);
    if (qty > 0) {
        return `<div class="qty-stepper" onclick="event.stopPropagation()">
            <button class="qty-step-btn" aria-label="Quitar uno de ${escapeHtml(p.nombre)}" onclick="window.quickStep(${p.id}, -1)">${Icons.icon('minus', 18)}</button>
            <span class="qty-step-count" aria-live="polite">${qty}</span>
            <button class="qty-step-btn" aria-label="Agregar uno de ${escapeHtml(p.nombre)}" onclick="window.quickStep(${p.id}, 1)">${Icons.icon('plus', 18)}</button>
        </div>`;
    }
    return `<button class="btn-add" aria-label="Agregar ${escapeHtml(p.nombre)}" onclick="event.stopPropagation(); window.quickAdd(${p.id})">${Icons.icon('plus', 20)}</button>`;
}

function productCardHTML(p) {
    const hasCustom = (p.ingredientes || []).some(i => i.es_extra || i.es_removible);
    return `
        <div class="product-card${p.imagen_url ? '' : ' sin-imagen'}" onclick="window.abrirPersonalizacion(${p.id})">
            <div class="card-img">
                ${cardImageHTML(p)}
                ${p.destacado ? `<span class="card-badge-destacado">${Icons.icon('star', 12)} Recomendado</span>` : ""}
            </div>
            <div class="card-body">
                <div class="card-title">${escapeHtml(p.nombre)}</div>
                <div class="card-desc">${escapeHtml(p.descripcion || "")}</div>
                <div class="card-footer">
                    <span class="card-price">${formatPrice(p.precio_base)}</span>
                    <div class="card-control" id="card-control-${p.id}">${cardControlHTML(p)}</div>
                </div>
                ${hasCustom ? `<div class="card-custom-hint">${Icons.icon('note', 12)} Personalizable</div>` : ""}
            </div>
        </div>`;
}

function renderProducts() {
    const productsContainer = document.getElementById("menu-products");
    if (!productsContainer) return;

    const filtered = allPlatosCache.filter(p => {
        const matchCat = activeCategory === "todas" || p.categoria_nombre === activeCategory;
        const matchSearch = !searchQuery || p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || (p.descripcion && p.descripcion.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchCat && matchSearch;
    });

    let html = "";

    // "Recomendados" only makes sense on the unfiltered, unsearched view
    if (activeCategory === "todas" && !searchQuery) {
        const destacados = allPlatosCache.filter(p => p.destacado);
        if (destacados.length) {
            html += `<div class="section-header featured-header">${Icons.icon('star', 18)} Recomendados</div>`;
            html += `<div class="featured-scroll">`;
            destacados.forEach(p => { html += productCardHTML(p); });
            html += `</div>`;
        }
    }

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

    groupedByCategory.forEach((platos, catName) => {
        html += `<div class="section-header">${catName}</div>`;
        html += `<div class="products-grid">`;
        platos.forEach(p => { html += productCardHTML(p); });
        html += `</div>`;
    });

    productsContainer.innerHTML = html;
}

function refreshCardControls() {
    allPlatosCache.forEach(p => {
        document.querySelectorAll(`#card-control-${p.id}`).forEach(el => {
            el.innerHTML = cardControlHTML(p);
        });
    });
}

function updateCartBar() {
    const barContainer = document.getElementById("menu-cartbar");
    if (!barContainer) return;
    const cartCount = cart.reduce((sum, item) => sum + item.cantidad, 0);
    const total = cart.reduce((sum, item) => sum + (item.precio_final * item.cantidad), 0);
    if (cartCount > 0) {
        barContainer.innerHTML = `
        <div class="cart-bar" role="button" tabindex="0" onclick="window.abrirCarrito()"
             onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.abrirCarrito()}">
            <div class="cart-bar-left">
                <span class="cart-bar-icon">${Icons.icon('cart', 22)}<span class="cart-bar-badge">${cartCount}</span></span>
                <span class="cart-bar-label">Ver pedido</span>
            </div>
            <span class="cart-bar-total">${formatPrice(total)}</span>
        </div>`;
        document.body.classList.add("has-cart-bar");
    } else {
        barContainer.innerHTML = "";
        document.body.classList.remove("has-cart-bar");
    }
}

// Incremental update: a full re-render would lose the scroll position
function refreshDisplay() {
    refreshCardControls();
    updateCartBar();
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

window.abrirPersonalizacion = function(platoId, keepState) {
    const plato = window.platosMenu[platoId];
    if (!plato) return;

    const nombre = plato.nombre;
    const precioBase = plato.precio_base;

    let c = keepState && window._currentCustomization ? window._currentCustomization : {
        platoId, nombre, precioBase,
        extraIngredientes: [],
        quitarIngredientes: [],
        precioExtra: 0,
        cantidad: 1,
        nota: "",
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
    const ingredientesHTML = buildIngredientsHTML(plato, c);
    container.innerHTML = `
    <div class="customization-overlay" onclick="if(event.target===this)window._cerrarModal()">
        <div class="customization-sheet" onclick="event.stopPropagation()">
            <div class="customization-header">
                <h5>${escapeHtml(nombre)}</h5>
                <button class="cart-modal-close" aria-label="Cerrar" onclick="window._cerrarModal()">&times;</button>
            </div>
            <div class="customization-body">
                <div class="customization-price" id="precio-actual">${formatPrice(currentPrice)}</div>
                ${plato.descripcion ? `<p class="customization-desc">${escapeHtml(plato.descripcion)}</p>` : ""}
                ${ingredientesHTML ? `<div id="custom-ingredients">${ingredientesHTML}</div>` : ""}
                <div class="nota-field">
                    <label for="plato-nota">${Icons.icon('note', 14)} Nota para la cocina <span class="nota-optional">(opcional)</span></label>
                    <textarea id="plato-nota" maxlength="255" rows="2" placeholder="Ej: sin sal, término medio, sin picante..." oninput="window._setNota(this.value)">${escapeHtml(c.nota || "")}</textarea>
                </div>
                <div class="qty-row">
                    <span class="qty-row-label">Cantidad</span>
                    <div class="qty-stepper qty-stepper-modal">
                        <button class="qty-step-btn" aria-label="Restar" onclick="window._stepCantidadModal(-1)">${Icons.icon('minus', 20)}</button>
                        <span class="qty-step-count" id="cantidad-plato">${c.cantidad}</span>
                        <button class="qty-step-btn" aria-label="Sumar" onclick="window._stepCantidadModal(1)">${Icons.icon('plus', 20)}</button>
                    </div>
                </div>
            </div>
            <div class="cart-modal-footer">
                <button class="btn-add-cart" id="btn-add-cart-final" onclick="window._confirmarPersonalizacion(${platoId})">
                    Agregar al carrito &mdash; <span id="btn-add-cart-total">${formatPrice(currentPrice * c.cantidad)}</span>
                </button>
            </div>
        </div>
    </div>`;
};

window._cerrarModal = function() {
    document.getElementById("menu-modal-container").innerHTML = "";
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

    const btnTotal = document.getElementById("btn-add-cart-total");
    if (btnTotal) btnTotal.textContent = formatPrice(currentPrice * c.cantidad);

    const qtyEl = document.getElementById("cantidad-plato");
    if (qtyEl) qtyEl.textContent = c.cantidad;

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

window._stepCantidadModal = function(delta) {
    const c = window._currentCustomization;
    if (!c) return;
    c.cantidad = Math.min(20, Math.max(1, c.cantidad + delta));
    const plato = window.platosMenu[c.platoId];
    if (plato) refreshCustomizationDOM(c, plato);
};

window._setNota = function(value) {
    const c = window._currentCustomization;
    if (!c) return;
    c.nota = value;
};

window._confirmarPersonalizacion = function(platoId) {
    const c = window._currentCustomization;
    if (!c) return;

    const plato = window.platosMenu[platoId];
    const nombre = plato ? plato.nombre : c.nombre;
    const precioBase = plato ? plato.precio_base : c.precioBase;
    const nota = (c.nota || "").trim();

    const personalizaciones = [
        ...c.extraIngredientes.map(i => ({ ingrediente_id: i.id, accion: "agregar", cantidad: 1 })),
        ...c.quitarIngredientes.map(i => ({ ingrediente_id: i.id, accion: "quitar", cantidad: 1 }))
    ];

    const existente = cart.find(item =>
        item.plato_id === platoId &&
        (item.nota || "") === nota &&
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
            nota: nota,
            precio_final: precioBase + c.precioExtra
        });
    }

    window._cerrarModal();
    showToast("Agregado al carrito", "success");
    refreshDisplay();
};

// Adds the un-customized variant straight from the card, skipping the modal
window.quickAdd = function(platoId) {
    const plato = window.platosMenu[platoId];
    if (!plato) return;
    const existente = cart.find(i => i.plato_id === platoId && i.personalizaciones.length === 0 && !i.nota);
    if (existente) {
        existente.cantidad++;
    } else {
        cart.push({
            plato_id: platoId,
            nombre: plato.nombre,
            precio_base: plato.precio_base,
            cantidad: 1,
            personalizaciones: [],
            nota: "",
            precio_final: plato.precio_base
        });
    }
    refreshDisplay();
};

window.quickStep = function(platoId, delta) {
    const idx = cart.findIndex(i => i.plato_id === platoId && i.personalizaciones.length === 0 && !i.nota);
    if (idx < 0) {
        if (delta > 0) window.quickAdd(platoId);
        return;
    }
    cart[idx].cantidad += delta;
    if (cart[idx].cantidad <= 0) cart.splice(idx, 1);
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
                                <div class="cart-item-name">${escapeHtml(item.nombre)}</div>
                                ${item.personalizaciones.length > 0 ? `
                                <div class="cart-item-custom">${item.personalizaciones.map(p => p.accion + " " + (window.platosMenu[item.plato_id]?.ingredientes?.find(i => i.id === p.ingrediente_id)?.nombre || "")).join(", ")}</div>` : ""}
                                ${item.nota ? `<div class="cart-item-note">${Icons.icon('note', 12)} ${escapeHtml(item.nota)}</div>` : ""}
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
        nota: item.nota || null,
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
