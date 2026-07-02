async function renderDashboardPage(container) {
    const data = await api.get("/api/dashboard");

    container.innerHTML = `
    <h3 class="mb-4">${Icons.iconSpan('dashboard', 'me-2')}Dashboard</h3>

    <div class="row mb-4">
        <div class="col">
            <div class="card text-bg-warning">
                <div class="card-body text-center">
                    <h5 class="card-title">${data.resumen.pendiente}</h5>
                    <small>Pendientes</small>
                </div>
            </div>
        </div>
        <div class="col">
            <div class="card text-bg-primary">
                <div class="card-body text-center">
                    <h5 class="card-title">${data.resumen.confirmado}</h5>
                    <small>Confirmados</small>
                </div>
            </div>
        </div>
        <div class="col">
            <div class="card text-white" style="background-color:#fd7e14">
                <div class="card-body text-center">
                    <h5 class="card-title">${data.resumen.en_preparacion}</h5>
                    <small>En Preparacion</small>
                </div>
            </div>
        </div>
        <div class="col">
            <div class="card text-bg-success">
                <div class="card-body text-center">
                    <h5 class="card-title">${data.resumen.listo}</h5>
                    <small>Listos</small>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-md-8">
            <h5>Pedidos Activos (${data.resumen.total_activos})</h5>
            <div id="pedidos-activos">
                ${data.pedidos.length === 0
                    ? '<p class="text-muted">No hay pedidos activos</p>'
                    : data.pedidos.map(p => `
                        <div class="card order-card ${p.estado} mb-2">
                            <div class="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Mesa ${p.mesa}</strong>
                                    <span class="ms-2">${estadoBadge(p.estado)}</span>
                                    <br><small class="text-muted">${p.platos_count} platos - ${formatPrice(p.total)}</small>
                                </div>
                                <button class="btn btn-sm btn-outline-primary cambiar-estado-btn"
                                    data-id="${p.id}" data-estado="${p.estado}">
                                    Avanzar ${Icons.icon('arrowRight', 14)}
                                </button>
                            </div>
                        </div>`).join("")
                }
            </div>
        </div>
        <div class="col-md-4">
            <h5>Estado de Mesas</h5>
            <div class="list-group">
                ${data.mesas.map(m => `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        Mesa ${m.numero}
                        <span class="badge ${m.estado === 'libre' ? 'bg-success' : 'bg-danger'}">${m.estado}</span>
                    </div>`).join("")}
            </div>
        </div>
    </div>

    ${data.solicitudes && data.solicitudes.length > 0 ? `
    <div class="row mt-4">
        <div class="col-12">
            <h5><i class="text-warning">&#x1F514;</i> Solicitudes Pendientes</h5>
            <div class="list-group">
                ${data.solicitudes.map(s => `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>Mesa ${s.mesa}</strong>
                            <span class="ms-2 badge ${s.tipo === 'mesero' ? 'bg-primary' : 'bg-info'}">${s.tipo === 'mesero' ? 'Llamar mesero' : 'Pedir cuenta'}</span>
                        </div>
                        <button class="btn btn-sm btn-outline-success atender-solicitud-btn" data-id="${s.id}">
                            Atendido
                        </button>
                    </div>`).join("")}
            </div>
        </div>
    </div>` : ""}
    `;

    document.querySelectorAll(".cambiar-estado-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            const estadoActual = btn.dataset.estado;
            const transiciones = {
                pendiente: "confirmado",
                confirmado: "en_preparacion",
                en_preparacion: "listo",
                listo: "entregado"
            };
            const nuevo = transiciones[estadoActual];
            if (!nuevo) return;

            try {
                await api.patch(`/api/pedidos/${id}/estado`, { estado: nuevo });
                showToast(`Pedido #${id} -> ${nuevo}`, "success");
                renderDashboardPage(container);
            } catch (err) {
                showToast(err.message, "danger");
            }
        });
    });

    document.querySelectorAll(".atender-solicitud-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            try {
                await api.patch(`/api/solicitudes/${btn.dataset.id}/atender`);
                showToast("Solicitud atendida", "success");
                renderDashboardPage(container);
            } catch (err) { showToast(err.message, "danger"); }
        });
    });

    if (window._currentInterval) {
        clearInterval(window._currentInterval);
        window._currentInterval = null;
    }
    window._currentInterval = setInterval(() => {
        if (window.location.hash !== "#/dashboard") return;
        renderDashboardPage(container);
    }, 15000);
}

router.register("/dashboard", renderDashboardPage);
