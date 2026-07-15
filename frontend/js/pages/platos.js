async function renderPlatosPage(container) {
    let platos = [];
    let categorias = [];
    let ingredientes = [];

    async function load() {
        try {
            [platos, ingredientes] = await Promise.all([
                api.get("/api/platos"),
                api.get("/api/ingredientes")
            ]);
        } catch (e) {
            platos = [];
            ingredientes = [];
        }
    }

    function render() {
        container.innerHTML = `
        <h3 class="mb-4">${Icons.iconSpan('platos', 'me-2')}Gestion de Platos</h3>
        <button class="btn btn-primary mb-3" id="btn-agregar-plato">
            ${Icons.icon('plus', 18)} Agregar Plato
        </button>
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-dark">
                    <tr><th>Nombre</th><th>Categoria</th><th>Precio</th><th>Disponible</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${platos.map(p => `
                        <tr>
                            <td>${p.nombre}${p.destacado ? ` <span class="badge-destacado" title="Recomendado">${Icons.icon('star', 13)}</span>` : ""}</td>
                            <td>${p.categoria_nombre || "N/A"}</td>
                            <td>${formatPrice(p.precio_base)}</td>
                            <td>
                                <div class="form-check form-switch">
                                    <input class="form-check-input toggle-disponible" type="checkbox"
                                        data-id="${p.id}" ${p.disponible ? "checked" : ""}>
                                </div>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-outline-warning editar-btn me-1" data-id="${p.id}">
                                    ${Icons.icon('edit', 15)}
                                </button>
                                <button class="btn btn-sm btn-outline-danger eliminar-btn" data-id="${p.id}">
                                    ${Icons.icon('trash', 15)}
                                </button>
                            </td>
                        </tr>`).join("")}
                </tbody>
            </table>
        </div>
        <div id="modal-container"></div>`;

        document.getElementById("btn-agregar-plato")?.addEventListener("click", () => abrirFormPlato(null, container));
        document.querySelectorAll(".editar-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const plato = platos.find(p => p.id === parseInt(btn.dataset.id));
                abrirFormPlato(plato, container);
            });
        });
        document.querySelectorAll(".eliminar-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const ok = await showConfirm("Eliminar Plato", "Seguro que queres eliminar este plato? Esta accion no se puede deshacer.", "Eliminar", "danger");
                if (!ok) return;
                try {
                    await api.del(`/api/platos/${btn.dataset.id}`);
                    showToast("Plato eliminado", "success");
                    renderPlatosPage(container);
                } catch (err) { showToast(err.message, "danger"); }
            });
        });
        document.querySelectorAll(".toggle-disponible").forEach(cb => {
            cb.addEventListener("change", async () => {
                try {
                    await api.patch(`/api/platos/${cb.dataset.id}/disponibilidad`, { disponible: cb.checked });
                    showToast("Disponibilidad actualizada", "success");
                } catch (err) { showToast(err.message, "danger"); renderPlatosPage(container); }
            });
        });
    }

    function abrirFormPlato(plato, container) {
        const esEditar = !!plato;
        const modalContainer = document.getElementById("modal-container");
        modalContainer.innerHTML = `
        <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.5)">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${esEditar ? "Editar" : "Agregar"} Plato</h5>
                        <button class="btn-close" onclick="document.getElementById('modal-container').innerHTML=''"></button>
                    </div>
                    <div class="modal-body">
                        <form id="form-plato">
                            <div class="mb-3">
                                <label class="form-label">Nombre</label>
                                <input class="form-control" id="fp-nombre" value="${plato?.nombre || ""}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Descripcion</label>
                                <textarea class="form-control" id="fp-descripcion">${plato?.descripcion || ""}</textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Precio Base</label>
                                <input class="form-control" type="number" id="fp-precio" value="${plato?.precio_base || 0}" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Categoria</label>
                                <select class="form-select" id="fp-categoria">
                                    <option value="1" ${(!plato || plato.categoria_id === 1) ? "selected" : ""}>Entradas</option>
                                    <option value="2" ${plato?.categoria_id === 2 ? "selected" : ""}>Platos Fuertes</option>
                                    <option value="3" ${plato?.categoria_id === 3 ? "selected" : ""}>Bebidas</option>
                                    <option value="4" ${plato?.categoria_id === 4 ? "selected" : ""}>Postres</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">URL de la Imagen</label>
                            <input class="form-control" type="url" id="fp-imagen" value="${plato?.imagen_url || ""}" placeholder="https://ejemplo.com/foto.jpg">
                        </div>
                        <div class="form-check form-switch mb-3">
                            <input class="form-check-input" type="checkbox" id="fp-destacado" ${plato?.destacado ? "checked" : ""}>
                            <label class="form-check-label" for="fp-destacado">Recomendado (aparece en "Destacados" del menú)</label>
                        </div>
                            <div class="mb-3">
                                <label class="form-label">Ingredientes</label>
                                <div id="ingredientes-config">
                                    ${ingredientes.map(ing => {
                                        const pi = plato?.ingredientes?.find(i => i.ingrediente_id === ing.id);
                                        const isChecked = !!pi;
                                        const tipo = pi ? (pi.es_extra ? "extra" : "default") : "default";
                                        const removable = pi ? pi.es_removible : false;
                                        return `<div class="ing-config-row" id="ing-conf-${ing.id}">
                                            <label class="ing-config-check">
                                                <input class="form-check-input ing-check" type="checkbox"
                                                    id="ing-${ing.id}" value="${ing.id}"
                                                    ${isChecked ? "checked" : ""}
                                                    onchange="window._toggleIngRow(${ing.id})">
                                                <span>${ing.nombre}</span>
                                            </label>
                                            <select class="form-select ing-tipo-select" id="ing-tipo-${ing.id}"
                                                ${isChecked ? "" : "disabled"}>
                                                <option value="default" ${tipo === "default" ? "selected" : ""}>Incluido</option>
                                                <option value="extra" ${tipo === "extra" ? "selected" : ""}>Extra (+${formatPrice(ing.precio_extra)})</option>
                                            </select>
                                            <label class="ing-config-removable" id="ing-rem-label-${ing.id}"
                                                style="${tipo === "extra" ? "opacity:0.4;pointer-events:none" : ""}">
                                                <input class="form-check-input ing-removable-check" type="checkbox"
                                                    id="ing-rem-${ing.id}"
                                                    ${removable ? "checked" : ""}
                                                    ${tipo === "extra" ? "disabled" : ""}>
                                                <span>Se puede quitar</span>
                                            </label>
                                        </div>`;
                                    }).join("")}
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="document.getElementById('modal-container').innerHTML=''">Cancelar</button>
                        <button class="btn btn-primary" id="btn-guardar-plato">Guardar</button>
                    </div>
                </div>
            </div>
        </div>`;

        document.querySelectorAll(".ing-tipo-select").forEach(sel => {
            sel.addEventListener("change", function () {
                const ingId = this.id.replace("ing-tipo-", "");
                const removableLabel = document.getElementById(`ing-rem-label-${ingId}`);
                const removableCheck = document.getElementById(`ing-rem-${ingId}`);
                if (this.value === "extra") {
                    if (removableLabel) removableLabel.style.opacity = "0.4";
                    if (removableCheck) { removableCheck.disabled = true; removableCheck.checked = false; }
                } else {
                    if (removableLabel) removableLabel.style.opacity = "";
                    if (removableCheck) removableCheck.disabled = false;
                }
            });
        });

        document.getElementById("btn-guardar-plato").addEventListener("click", async () => {
            const nombre = document.getElementById("fp-nombre").value;
            const descripcion = document.getElementById("fp-descripcion").value || null;
            const precio_base = parseFloat(document.getElementById("fp-precio").value);
            const categoria_id = parseInt(document.getElementById("fp-categoria").value);
            const imagen_url = document.getElementById("fp-imagen").value || null;
            const destacado = document.getElementById("fp-destacado").checked;

            const selectedIngs = [];
            document.querySelectorAll(".ing-check:checked").forEach(cb => {
                const ingId = cb.value;
                const tipoSelect = document.getElementById(`ing-tipo-${ingId}`);
                const tipo = tipoSelect ? tipoSelect.value : "default";
                const removableCheck = document.getElementById(`ing-rem-${ingId}`);
                const esRemovible = removableCheck ? removableCheck.checked : false;

                selectedIngs.push({
                    ingrediente_id: parseInt(ingId),
                    es_default: tipo === "default",
                    es_extra: tipo === "extra",
                    es_removible: tipo === "default" ? esRemovible : false
                });
            });

            const body = {
                nombre,
                descripcion,
                precio_base,
                categoria_id,
                imagen_url,
                destacado,
                disponible: plato?.disponible ?? true,
                ingredientes: selectedIngs
            };

            try {
                if (esEditar) {
                    await api.put(`/api/platos/${plato.id}`, body);
                } else {
                    await api.post("/api/platos", body);
                }
                modalContainer.innerHTML = "";
                showToast(esEditar ? "Plato actualizado" : "Plato creado", "success");
                renderPlatosPage(container);
            } catch (err) {
                console.error("Guardar plato error:", err);
                showToast(err.message, "danger");
            }
        });
    }

    await load();
    render();
}

router.register("/platos", renderPlatosPage);

window._toggleIngRow = function(ingId) {
    const cb = document.getElementById(`ing-${ingId}`);
    const tipoSelect = document.getElementById(`ing-tipo-${ingId}`);
    const removableLabel = document.getElementById(`ing-rem-label-${ingId}`);
    const removableCheck = document.getElementById(`ing-rem-${ingId}`);
    const isChecked = cb && cb.checked;

    if (tipoSelect) tipoSelect.disabled = !isChecked;
    if (isChecked) {
        if (removableLabel) removableLabel.style.opacity = "";
        if (removableCheck) removableCheck.disabled = false;
    } else {
        if (removableLabel) removableLabel.style.opacity = "0.4";
        if (removableCheck) { removableCheck.disabled = true; removableCheck.checked = false; }
    }
};
