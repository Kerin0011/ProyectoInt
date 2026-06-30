async function renderIngredientesPage(container) {
    let ingredientes = [];

    async function load() {
        try { ingredientes = await api.get("/api/ingredientes"); } catch (e) { ingredientes = []; }
    }

    function render() {
        container.innerHTML = `
        <h3 class="mb-4"><i class="bi bi-basket"></i> Gestion de Ingredientes</h3>
        <button class="btn btn-primary mb-3" id="btn-agregar-ing">
            <i class="bi bi-plus-circle"></i> Agregar Ingrediente
        </button>
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-dark">
                    <tr><th>Nombre</th><th>Stock</th><th>Disponible</th><th>Precio Extra</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${ingredientes.map(ing => `
                        <tr>
                            <td>${ing.nombre}</td>
                            <td>${ing.stock}</td>
                            <td>
                                <div class="form-check form-switch">
                                    <input class="form-check-input toggle-ing-dispo" type="checkbox"
                                        data-id="${ing.id}" ${ing.disponible ? "checked" : ""}>
                                </div>
                            </td>
                            <td>${formatPrice(ing.precio_extra)}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-warning editar-ing-btn me-1" data-id="${ing.id}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                            </td>
                        </tr>`).join("")}
                </tbody>
            </table>
        </div>
        <div id="modal-container"></div>`;

        document.getElementById("btn-agregar-ing")?.addEventListener("click", () => abrirFormIng(null, container));
        document.querySelectorAll(".editar-ing-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const ing = ingredientes.find(i => i.id === parseInt(btn.dataset.id));
                abrirFormIng(ing, container);
            });
        });
        document.querySelectorAll(".toggle-ing-dispo").forEach(cb => {
            cb.addEventListener("change", async () => {
                try {
                    await api.patch(`/api/ingredientes/${cb.dataset.id}/disponibilidad`, { disponible: cb.checked });
                } catch (err) { showToast(err.message, "danger"); renderIngredientesPage(container); }
            });
        });
    }

    function abrirFormIng(ingrediente, container) {
        const esEditar = !!ingrediente;
        const modalContainer = document.getElementById("modal-container");
        modalContainer.innerHTML = `
        <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.5)">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${esEditar ? "Editar" : "Agregar"} Ingrediente</h5>
                        <button class="btn-close" onclick="document.getElementById('modal-container').innerHTML=''"></button>
                    </div>
                    <div class="modal-body">
                        <form id="form-ing">
                            <div class="mb-3">
                                <label class="form-label">Nombre</label>
                                <input class="form-control" id="fi-nombre" value="${ingrediente?.nombre || ""}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Stock</label>
                                <input class="form-control" type="number" id="fi-stock" value="${ingrediente?.stock || 0}" min="0">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Precio Extra</label>
                                <input class="form-control" type="number" id="fi-precio" value="${ingrediente?.precio_extra || 0}" min="0" step="100">
                            </div>
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" id="fi-disponible" ${ingrediente?.disponible !== false ? "checked" : ""}>
                                <label class="form-check-label">Disponible</label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancelar</button>
                        <button class="btn btn-primary" id="btn-guardar-ing">Guardar</button>
                    </div>
                </div>
            </div>
        </div>`;

        document.getElementById("btn-guardar-ing").addEventListener("click", async () => {
            const body = {
                nombre: document.getElementById("fi-nombre").value,
                stock: parseInt(document.getElementById("fi-stock").value) || 0,
                precio_extra: parseFloat(document.getElementById("fi-precio").value) || 0,
                disponible: document.getElementById("fi-disponible").checked
            };
            try {
                if (esEditar) {
                    await api.put(`/api/ingredientes/${ingrediente.id}`, body);
                } else {
                    await api.post("/api/ingredientes", body);
                }
                modalContainer.innerHTML = "";
                showToast(esEditar ? "Ingrediente actualizado" : "Ingrediente creado", "success");
                renderIngredientesPage(container);
            } catch (err) { showToast(err.message, "danger"); }
        });
    }

    await load();
    render();
}

router.register("/ingredientes", renderIngredientesPage);
