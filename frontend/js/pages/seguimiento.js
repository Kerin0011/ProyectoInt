async function renderSeguimientoPage(container) {
    const hash = window.location.hash.slice(1);
    const pedidoId = hash.replace("/seguimiento/", "");

    if (!pedidoId) {
        container.innerHTML = `<div class="alert alert-warning">Pedido no especificado</div>`;
        return;
    }

    const pasos = [
        { key: "pendiente", label: "Pendiente" },
        { key: "confirmado", label: "Confirmado" },
        { key: "en_preparacion", label: "En Preparacion" },
        { key: "listo", label: "Listo" },
        { key: "entregado", label: "Entregado" }
    ];

    async function load() {
        try {
            const pedido = await fetch(`${API_BASE}/api/public/pedidos/${pedidoId}`).then(r => r.json());

            const estadoIdx = pasos.findIndex(p => p.key === pedido.estado);

            container.innerHTML = `
            <div class="container py-4" style="max-width:600px">
                <div class="text-center mb-4">
                    <i class="bi bi-clock-history display-1 text-primary"></i>
                    <h3>Pedido #${pedido.id}</h3>
                    <p class="text-muted">Mesa ${pedido.mesa_numero}</p>
                </div>

                ${pedido.estado === 'cancelado' ? `
                    <div class="alert alert-danger text-center">
                        <i class="bi bi-x-circle display-4"></i>
                        <h4>Pedido Cancelado</h4>
                    </div>` : `
                <div class="timeline mb-4">
                    ${pasos.map((paso, i) => `
                        <div class="timeline-step ${i < estadoIdx ? 'done' : ''} ${i === estadoIdx ? 'active' : ''}">
                            <div class="circle">${i < estadoIdx ? '<i class="bi bi-check"></i>' : (i + 1)}</div>
                            <small>${paso.label}</small>
                        </div>`).join("")}
                </div>`}

                <div class="card">
                    <div class="card-body">
                        <h5>Detalle del pedido</h5>
                        <table class="table table-sm">
                            <thead><tr><th>Plato</th><th>Cant</th><th>Subtotal</th></tr></thead>
                            <tbody>
                                ${pedido.detalles.map(d => `
                                    <tr>
                                        <td>${d.plato_nombre}
                                            ${d.personalizaciones.length > 0 ? `
                                                <br><small class="text-muted">
                                                    ${d.personalizaciones.map(p => p.accion + ": " + p.ingrediente_nombre).join(", ")}
                                                </small>` : ""}
                                        </td>
                                        <td>${d.cantidad}</td>
                                        <td>${formatPrice(d.subtotal)}</td>
                                    </tr>`).join("")}
                            </tbody>
                            <tfoot>
                                <tr class="fw-bold fs-5">
                                    <td colspan="2" class="text-end">Total:</td>
                                    <td>${formatPrice(pedido.total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                ${pedido.estado === 'entregado' ? `
                    <div class="text-center mt-4">
                        <i class="bi bi-emoji-smile display-1 text-success"></i>
                        <h4>Disfruta tu comida!</h4>
                    </div>` : ''}

                ${pedido.estado !== 'cancelado' && pedido.estado !== 'entregado' ? `
                    <p class="text-center text-muted mt-3 small">Actualizando automaticamente...</p>` : ''}
            </div>`;

            if (pedido.estado !== "cancelado" && pedido.estado !== "entregado") {
                setTimeout(() => renderSeguimientoPage(container), 5000);
            }
        } catch (err) {
            container.innerHTML = `<div class="alert alert-danger m-4">${err.message}</div>`;
        }
    }

    await load();
}

router.register("/seguimiento", renderSeguimientoPage);
