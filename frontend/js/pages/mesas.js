async function renderMesasPage(container) {
    let mesas = [];
    try { mesas = await api.get("/api/mesas"); } catch (e) { mesas = []; }

    function render() {
        container.innerHTML = `
        <h3 class="mb-4">${Icons.iconSpan('mesas', 'me-2')}Gestion de Mesas</h3>

        <div class="mb-3">
            <button class="btn btn-primary" id="btn-agregar-mesa">
                ${Icons.icon('plus', 18)} Agregar Mesa
            </button>
        </div>

        <div class="row g-3" id="mesas-grid">
            ${mesas.map(m => `
                <div class="col-6 col-sm-4 col-md-3 col-lg-2">
                    <div class="card h-100" id="mesa-card-${m.id}">
                        <div class="card-body text-center d-flex flex-column">
                            <h5 class="mb-1">Mesa ${m.numero}</h5>
                            <span class="badge ${m.estado === 'libre' ? 'bg-success' : 'bg-danger'} mb-2" id="mesa-badge-${m.id}">${m.estado}</span>
                            <div class="qr-display mb-2">
                                <small class="text-muted">QR:</small>
                                <div class="bg-light p-2 rounded">
                                    <code style="font-size:9px;word-break:break-all">${window.location.origin}${window.location.pathname}#/menu/${m.token_qr}</code>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-outline-secondary toggle-mesa-btn mt-auto"
                                data-id="${m.id}" data-estado="${m.estado}" id="mesa-toggle-${m.id}">
                                ${m.estado === 'libre' ? 'Ocupar' : 'Liberar'}
                            </button>
                        </div>
                    </div>
                </div>`).join("")}
        </div>`;

        document.getElementById("btn-agregar-mesa")?.addEventListener("click", async () => {
            const { value: numero } = await Swal.fire({
                title: "Agregar Mesa",
                text: "Numero de mesa (ej: M6)",
                input: "text",
                inputPlaceholder: "M6",
                showCancelButton: true,
                confirmButtonText: "Agregar",
                cancelButtonText: "Cancelar",
                inputValidator: (value) => {
                    if (!value) return "Ingresa un numero de mesa";
                }
            });
            if (!numero) return;
            try {
                await api.post("/api/mesas", { numero });
                showToast("Mesa creada", "success");
                renderMesasPage(container);
            } catch (err) { showToast(err.message, "danger"); }
        });

        document.querySelectorAll(".toggle-mesa-btn").forEach(btn => {
            btn.addEventListener("click", async function () {
                const id = this.dataset.id;
                const estado = this.dataset.estado;
                const nuevo = estado === "libre" ? "ocupada" : "libre";
                const mesa = mesas.find(m => m.id == id);

                this.disabled = true;
                this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';

                try {
                    await api.patch(`/api/mesas/${id}/estado`, { estado: nuevo });
                    if (mesa) mesa.estado = nuevo;
                    updateMesaCard(id, nuevo);
                    showToast(`Mesa ${nuevo}`, "success");
                } catch (err) {
                    if (mesa) mesa.estado = estado;
                    updateMesaCard(id, estado);
                    showToast(err.message, "danger");
                }
            });
        });
    }

    function updateMesaCard(id, estado) {
        const badge = document.getElementById(`mesa-badge-${id}`);
        const toggle = document.getElementById(`mesa-toggle-${id}`);
        if (badge) {
            badge.className = `badge ${estado === 'libre' ? 'bg-success' : 'bg-danger'} mb-2`;
            badge.textContent = estado;
        }
        if (toggle) {
            toggle.disabled = false;
            toggle.innerHTML = estado === 'libre' ? 'Ocupar' : 'Liberar';
            toggle.dataset.estado = estado;
        }
    }

    render();
}

router.register("/mesas", renderMesasPage);
