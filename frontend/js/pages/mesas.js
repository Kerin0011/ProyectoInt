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

        <div class="row" id="mesas-grid">
            ${mesas.map(m => `
                <div class="col-md-3 mb-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5>Mesa ${m.numero}</h5>
                            <span class="badge ${m.estado === 'libre' ? 'bg-success' : 'bg-danger'} mb-2">${m.estado}</span>
                            <div class="qr-display mb-2">
                                <small class="text-muted">QR:</small>
                                <div class="bg-light p-2 rounded">
                                    <code style="font-size:10px">${window.location.origin}${window.location.pathname}#/menu/${m.token_qr}</code>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-outline-secondary toggle-mesa-btn"
                                data-id="${m.id}" data-estado="${m.estado}">
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
            btn.addEventListener("click", async () => {
                const id = btn.dataset.id;
                const estado = btn.dataset.estado;
                const nuevo = estado === "libre" ? "ocupada" : "libre";
                try {
                    await api.patch(`/api/mesas/${id}/estado`, { estado: nuevo });
                    showToast(`Mesa ${nuevo}`, "success");
                    renderMesasPage(container);
                } catch (err) { showToast(err.message, "danger"); }
            });
        });
    }

    render();
}

router.register("/mesas", renderMesasPage);
