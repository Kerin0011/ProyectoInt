async function renderPedidosPage(container) {
    let pedidos = [];

    async function load() {
        try { pedidos = await api.get("/api/pedidos"); } catch (e) { pedidos = []; }
    }

    function render() {
        container.innerHTML = `
        <h3 class="mb-4">${Icons.iconSpan('pedidos', 'me-2')}Todos los Pedidos</h3>

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
                : pedidos.map(p => `
                    <div class="card order-card ${p.estado} mb-3">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <div>
                                <strong>Pedido #${p.id}</strong> - Mesa ${p.mesa_numero}
                                <span class="ms-2">${estadoBadge(p.estado)}</span>
                            </div>
                            <div>
                                ${p.estado === 'pendiente' ? `
                                    <button class="btn btn-sm btn-success cambiar-estado-btn me-1" data-id="${p.id}" data-nuevo="confirmado">
                                        Confirmar
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger cancelar-btn" data-id="${p.id}">
                                        Cancelar
                                    </button>` : ''}
                                ${p.estado === 'confirmado' ? `
                                    <button class="btn btn-sm btn-warning cambiar-estado-btn" data-id="${p.id}" data-nuevo="en_preparacion">
                                        En Preparacion
                                    </button>` : ''}
                                ${p.estado === 'en_preparacion' ? `
                                    <button class="btn btn-sm btn-success cambiar-estado-btn" data-id="${p.id}" data-nuevo="listo">
                                        Listo
                                    </button>` : ''}
                                ${p.estado === 'listo' ? `
                                    <button class="btn btn-sm btn-primary cambiar-estado-btn" data-id="${p.id}" data-nuevo="entregado">
                                        Entregado
                                    </button>` : ''}
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
                                                        ${d.personalizaciones.map(p => p.accion + ": " + p.ingrediente_nombre).join(", ")}
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
                    </div>`).join("")
            }
        </div>`;

        document.getElementById("filtro-estado")?.addEventListener("change", async (e) => {
            const estado = e.target.value;
            const url = estado ? `/api/pedidos?estado=${estado}` : "/api/pedidos";
            pedidos = await api.get(url);
            render();
        });

        document.querySelectorAll(".cambiar-estado-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.id;
                const nuevo = btn.dataset.nuevo;
                try {
                    await api.patch(`/api/pedidos/${id}/estado`, { estado: nuevo });
                    showToast(`Pedido #${id} -> ${nuevo}`, "success");
                    renderPedidosPage(container);
                } catch (err) { showToast(err.message, "danger"); }
            });
        });

        document.querySelectorAll(".cancelar-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const id = btn.dataset.id;
                const ok = await showConfirm("Cancelar Pedido", "Seguro que queres cancelar este pedido?", "Cancelar", "danger");
                if (!ok) return;
                try {
                    await api.put(`/api/pedidos/${id}/cancelar`);
                    showToast(`Pedido #${id} cancelado`, "warning");
                    renderPedidosPage(container);
                } catch (err) { showToast(err.message, "danger"); }
            });
        });
    }

    await load();
    render();
}

router.register("/pedidos", renderPedidosPage);
