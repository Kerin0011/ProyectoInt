async function renderDashboardPage(container) {
    let data = null;

    try {
        data = await api.get("/api/dashboard");
        if (data) {
            try { localStorage.setItem("cached_dashboard", JSON.stringify({ data, ts: Date.now() })); } catch {}
        }
    } catch (e) {
        try {
            const cached = localStorage.getItem("cached_dashboard");
            if (cached) data = JSON.parse(cached).data;
        } catch {}
    }

    if (!data) {
        container.innerHTML = `<div class="text-center py-5 text-muted"><h5>Sin conexion</h5><p>Conectate a internet para ver el dashboard.</p></div>`;
        return;
    }

    const isOffline = !navigator.onLine;

    container.innerHTML = `
    <h3 class="mb-4">${Icons.iconSpan('dashboard', 'me-2')}Dashboard ${isOffline ? '<span class="badge bg-warning text-dark ms-2" style="font-size:12px">Sin conexion</span>' : ''}</h3>

    <div class="row mb-4 g-2" id="stats-row">
        <div class="col-6 col-md-3">
            <div class="card text-bg-warning h-100">
                <div class="card-body text-center">
                    <h5 class="card-title">${data.resumen.pendiente}</h5>
                    <small>Pendientes</small>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card text-bg-primary h-100">
                <div class="card-body text-center">
                    <h5 class="card-title">${data.resumen.confirmado}</h5>
                    <small>Confirmados</small>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card text-white h-100" style="background-color:#fd7e14">
                <div class="card-body text-center">
                    <h5 class="card-title">${data.resumen.en_preparacion}</h5>
                    <small>En Preparacion</small>
                </div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="card text-bg-success h-100">
                <div class="card-body text-center">
                    <h5 class="card-title">${data.resumen.listo}</h5>
                    <small>Listos</small>
                </div>
            </div>
        </div>
    </div>

    <div class="row">
        <div class="col-12 col-md-8 mb-4">
            <h5>Pedidos Activos (${data.resumen.total_activos})</h5>
            <div id="pedidos-activos">
                ${data.pedidos.length === 0
                    ? '<p class="text-muted">No hay pedidos activos</p>'
                    : data.pedidos.map(p => `
                        <div class="card order-card ${p.estado} mb-2" id="dash-pedido-${p.id}">
                            <div class="card-body d-flex justify-content-between align-items-center flex-wrap">
                                <div>
                                    <strong>Mesa ${p.mesa}</strong>
                                    <span class="ms-2" id="dash-badge-${p.id}">${estadoBadge(p.estado)}</span>
                                    <br><small class="text-muted">${p.platos_count} platos - ${formatPrice(p.total)}</small>
                                </div>
                                <button class="btn btn-sm btn-outline-primary cambiar-estado-btn mt-2 mt-md-0"
                                    data-id="${p.id}" data-estado="${p.estado}">
                                    Avanzar ${Icons.icon('arrowRight', 14)}
                                </button>
                            </div>
                        </div>`).join("")
                }
            </div>
        </div>
        <div class="col-12 col-md-4 mb-4">
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
    <div class="row mt-2">
        <div class="col-12">
            <h5><span style="font-size:18px">&#x1F514;</span> Solicitudes Pendientes</h5>
            <div class="list-group">
                ${data.solicitudes.map(s => `
                    <div class="list-group-item d-flex justify-content-between align-items-center flex-wrap" id="dash-sol-${s.id}">
                        <div>
                            <strong>Mesa ${s.mesa}</strong>
                            <span class="ms-2 badge ${s.tipo === 'mesero' ? 'bg-primary' : 'bg-info'}">${s.tipo === 'mesero' ? 'Llamar mesero' : 'Pedir cuenta'}</span>
                        </div>
                        <button class="btn btn-sm btn-outline-success atender-solicitud-btn mt-2 mt-md-0" data-id="${s.id}">
                            Atendido
                        </button>
                    </div>`).join("")}
            </div>
        </div>
    </div>` : ""}
    `;

    document.querySelectorAll(".cambiar-estado-btn").forEach(btn => {
        btn.addEventListener("click", async function () {
            const id = this.dataset.id;
            const estadoActual = this.dataset.estado;
            const transiciones = {
                pendiente: "confirmado",
                confirmado: "en_preparacion",
                en_preparacion: "listo",
                listo: "entregado"
            };
            const nuevo = transiciones[estadoActual];
            if (!nuevo) return;

            const pedido = data.pedidos.find(p => p.id == id);
            const oldEstado = estadoActual;

            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

            try {
                await api.patch(`/api/pedidos/${id}/estado`, { estado: nuevo });
                if (pedido) pedido.estado = nuevo;
                updateDashCard(id, nuevo);
                showToast(`Pedido #${id} -> ${nuevo}`, "success");
            } catch (err) {
                if (pedido) pedido.estado = oldEstado;
                updateDashCard(id, oldEstado);
                showToast(err.message, "danger");
            }
        });
    });

    document.querySelectorAll(".atender-solicitud-btn").forEach(btn => {
        btn.addEventListener("click", async function () {
            const id = this.dataset.id;
            this.disabled = true;
            this.textContent = "Atendiendo...";

            try {
                await api.patch(`/api/solicitudes/${id}/atender`);
                const el = document.getElementById(`dash-sol-${id}`);
                if (el) el.style.opacity = "0.4";
                showToast("Solicitud atendida", "success");
            } catch (err) {
                this.disabled = false;
                this.textContent = "Atendido";
                showToast(err.message, "danger");
            }
        });
    });

    function updateDashCard(id, estado) {
        const badge = document.getElementById(`dash-badge-${id}`);
        if (badge) badge.innerHTML = estadoBadge(estado);
        const card = document.getElementById(`dash-pedido-${id}`);
        if (card) {
            card.className = `card order-card ${estado} mb-2`;
        }
    }

    if (window._currentInterval) {
        clearInterval(window._currentInterval);
        window._currentInterval = null;
    }
    window._currentInterval = setInterval(() => {
        if (window.location.hash !== "#/dashboard") return;
        try { renderDashboardPage(container); } catch {}
    }, 15000);
}

router.register("/dashboard", renderDashboardPage);
