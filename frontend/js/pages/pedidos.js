async function renderPedidosPage(container) {
    let pedidos = [];

    async function load() {
        try {
            pedidos = await api.get("/api/pedidos");
            try { localStorage.setItem("cached_pedidos", JSON.stringify({ data: pedidos, ts: Date.now() })); } catch {}
        } catch (e) {
            try {
                const cached = localStorage.getItem("cached_pedidos");
                if (cached) pedidos = JSON.parse(cached).data;
            } catch {}
        }
    }

    function buildCard(p) {
        return `
        <div class="card order-card ${p.estado} mb-3" id="pedido-card-${p.id}">
            <div class="card-header d-flex justify-content-between align-items-center">
                <div class="pedido-card-left">
                    <strong>Pedido #${p.id}</strong> - Mesa ${p.mesa_numero}
                    <span class="ms-2" id="pedido-badge-${p.id}">${estadoBadge(p.estado)}</span>
                </div>
                <div class="pedido-card-actions" id="pedido-actions-${p.id}">
                    ${renderActions(p)}
                </div>
            </div>
            <div class="card-body">
                <table class="table table-sm mb-0">
                    <thead><tr><th>Plato</th><th>Cant</th><th>Precio</th><th>Subtotal</th></tr></thead>
                    <tbody>
                        ${p.detalles.map(d => `
                            <tr>
                                <td>${d.plato_nombre}
                                    ${d.personalizaciones.length > 0 ? `
                                        <br><small class="text-muted">
                                            ${d.personalizaciones.map(pe => pe.accion + ": " + pe.ingrediente_nombre).join(", ")}
                                        </small>` : ""}
                                </td>
                                <td>${d.cantidad}</td>
                                <td>${formatPrice(d.precio_unitario)}</td>
                                <td>${formatPrice(d.subtotal)}</td>
                            </tr>`).join("")}
                    </tbody>
                    <tfoot>
                        <tr class="fw-bold"><td colspan="3" class="text-end">Total:</td><td>${formatPrice(p.total)}</td></tr>
                    </tfoot>
                </table>
            </div>
        </div>`;
    }

    function render() {
        const isOffline = !navigator.onLine;
        container.innerHTML = `
        <h3 class="mb-4">${Icons.iconSpan('pedidos', 'me-2')}Todos los Pedidos ${isOffline ? '<span class="badge bg-warning text-dark ms-2" style="font-size:12px">Sin conexion</span>' : ''}</h3>

        <div class="mb-3">
            <select class="form-select w-auto d-inline-block" id="filtro-estado">
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="confirmado">Confirmados</option>
                <option value="en_preparacion">En Preparacion</option>
                <option value="listo">Listos</option>
                <option value="entregado">Entregados</option>
                <option value="cancelado">Cancelados</option>
            </select>
        </div>

        <div id="pedidos-lista">
            ${pedidos.length === 0
                ? '<p class="text-muted">No hay pedidos</p>'
                : pedidos.map(p => buildCard(p)).join("")
            }
        </div>`;

        document.getElementById("filtro-estado")?.addEventListener("change", async (e) => {
            const estado = e.target.value;
            const url = estado ? `/api/pedidos?estado=${estado}` : "/api/pedidos";
            pedidos = await api.get(url);
            render();
        });

        bindActions();
    }

    function bindActions() {
        document.querySelectorAll(".cambiar-estado-btn").forEach(btn => {
            btn.addEventListener("click", async function () {
                const id = this.dataset.id;
                const nuevo = this.dataset.nuevo;
                const pedido = pedidos.find(p => p.id == id);
                if (!pedido) return;
                const oldEstado = pedido.estado;

                this.disabled = true;
                this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

                try {
                    await api.patch(`/api/pedidos/${id}/estado`, { estado: nuevo });
                    pedido.estado = nuevo;
                    updateCardDOM(id, pedido);
                    showToast(`Pedido #${id} -> ${nuevo}`, "success");
                } catch (err) {
                    pedido.estado = oldEstado;
                    updateCardDOM(id, pedido);
                    showToast(err.message, "danger");
                }
            });
        });

        document.querySelectorAll(".cancelar-btn").forEach(btn => {
            btn.addEventListener("click", async function () {
                const id = this.dataset.id;
                const pedido = pedidos.find(p => p.id == id);
                if (!pedido) return;
                const oldEstado = pedido.estado;

                const ok = await showConfirm("Cancelar Pedido", "Seguro que queres cancelar este pedido?", "Cancelar", "danger");
                if (!ok) return;

                this.disabled = true;
                this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

                try {
                    await api.put(`/api/pedidos/${id}/cancelar`);
                    pedido.estado = "cancelado";
                    updateCardDOM(id, pedido);
                    showToast(`Pedido #${id} cancelado`, "warning");
                } catch (err) {
                    pedido.estado = oldEstado;
                    updateCardDOM(id, pedido);
                    showToast(err.message, "danger");
                }
            });
        });
    }

    function renderActions(p) {
        if (p.estado === "pendiente") {
            return `
                <button class="btn btn-sm btn-success cambiar-estado-btn me-1" data-id="${p.id}" data-nuevo="confirmado">
                    Confirmar
                </button>
                <button class="btn btn-sm btn-outline-danger cancelar-btn" data-id="${p.id}">
                    Cancelar
                </button>`;
        }
        if (p.estado === "confirmado") {
            return `<button class="btn btn-sm btn-warning cambiar-estado-btn" data-id="${p.id}" data-nuevo="en_preparacion">
                En Preparacion
            </button>`;
        }
        if (p.estado === "en_preparacion") {
            return `<button class="btn btn-sm btn-success cambiar-estado-btn" data-id="${p.id}" data-nuevo="listo">
                Listo
            </button>`;
        }
        if (p.estado === "listo") {
            return `<button class="btn btn-sm btn-primary cambiar-estado-btn" data-id="${p.id}" data-nuevo="entregado">
                Entregado
            </button>`;
        }
        return "";
    }

    function updateCardDOM(id, pedido) {
        const badge = document.getElementById(`pedido-badge-${id}`);
        const actions = document.getElementById(`pedido-actions-${id}`);
        const card = document.getElementById(`pedido-card-${id}`);

        if (badge) badge.innerHTML = estadoBadge(pedido.estado);
        if (actions) actions.innerHTML = renderActions(pedido);
        if (card) {
            card.className = `card order-card ${pedido.estado} mb-3`;
        }
        bindActions();
    }

    await load();
    render();
}

router.register("/pedidos", renderPedidosPage);
