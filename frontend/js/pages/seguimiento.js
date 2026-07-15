async function renderSeguimientoPage(container) {
    const hash = window.location.hash.slice(1);
    const parts = hash.replace("/seguimiento/", "").split("/");
    const pedidoId = parts[0];
    const mesaToken = parts[1] || "";

    if (!pedidoId) {
        container.innerHTML = `<div class="tracking-app"><div class="empty-state" style="padding-top:80px">Pedido no especificado</div></div>`;
        return;
    }

    const pasos = [
        { key: "pendiente", label: "Recibido" },
        { key: "confirmado", label: "Confirmado" },
        { key: "en_preparacion", label: "Preparando" },
        { key: "listo", label: "Listo" },
        { key: "entregado", label: "Entregado" }
    ];

    async function load() {
        try {
            const pedido = await fetch(`${API_BASE}/api/public/pedidos/${pedidoId}`).then(r => r.json());
            const estadoIdx = pasos.findIndex(p => p.key === pedido.estado);

            container.innerHTML = `
            <div class="tracking-app">
                <div class="tracking-header">
                    <div class="table-number">Mesa ${pedido.mesa_numero}</div>
                    <h2>Pedido #${pedido.id}</h2>
                </div>

                ${pedido.estado === 'cancelado' ? `
                    <div style="text-align:center;padding:20px 0">
                        <span style="display:inline-block;color:#c62828">${Icons.icon('xCircle', 56)}</span>
                        <h4 style="margin-top:12px;color:#c62828">Pedido Cancelado</h4>
                        ${mesaToken ? `
                        <button class="tracking-action-btn" onclick="window.location.hash='#/menu/${mesaToken}'">
                            ${Icons.icon('plus', 18)} Volver al menu
                        </button>` : ''}
                    </div>` : `
                    <div class="tracking-timeline">
                        ${pasos.map((paso, i) => `
                            <div class="tracking-step ${i < estadoIdx ? 'done' : ''} ${i === estadoIdx ? 'active' : ''}">
                                <div class="step-dot">${i < estadoIdx ? Icons.icon('check', 14) : (i + 1)}</div>
                                <div class="step-label">${paso.label}</div>
                            </div>`).join("")}
                    </div>`}

                ${pedido.estado !== 'cancelado' ? `
                <div class="tracking-order-detail">
                    <h5>Detalle del pedido</h5>
                    ${pedido.detalles.map(d => `
                        <div class="tracking-item-row">
                            <div>
                                <strong>${d.plato_nombre}</strong> x${d.cantidad}
                                ${d.personalizaciones.length > 0 ? `
                                <br><small style="color:#8c7569;font-size:12px">
                                    ${d.personalizaciones.map(p => p.accion + ": " + p.ingrediente_nombre).join(", ")}
                                </small>` : ""}
                                ${d.nota ? `<br><small style="color:#c25d1f;font-size:12px">${Icons.icon('note', 11)} ${d.nota}</small>` : ""}
                            </div>
                            <strong>${formatPrice(d.subtotal)}</strong>
                        </div>`).join("")}
                    <div class="tracking-total">
                        <span>Total</span>
                        <span class="total-amount">${formatPrice(pedido.total)}</span>
                    </div>
                </div>` : ""}

                ${pedido.estado === 'entregado' ? `
                    <div style="text-align:center;padding:20px 0">
                        <span style="display:inline-block" class="tracking-status-badge delivered">
                            ${Icons.icon('check', 18)} Pedido Entregado
                        </span>
                        <p style="color:#8c7569;margin-top:8px">Disfruta tu comida!</p>
                        ${mesaToken ? `
                        <button class="tracking-action-btn" onclick="window.location.hash='#/menu/${mesaToken}'">
                            ${Icons.icon('plus', 18)} Pedir algo mas
                        </button>` : ''}
                    </div>` : ''}

                ${pedido.estado === 'cancelado' ? '' : (pedido.estado !== 'entregado' ? `
                    <p style="text-align:center;color:#8c7569;font-size:13px;margin-top:20px">Actualizando automaticamente...</p>` : '')}
            </div>`;

            if (pedido.estado !== "cancelado" && pedido.estado !== "entregado") {
                // Stored on _currentInterval so the router can clear it on
                // navigation; otherwise the polling would overwrite the next page.
                window._currentInterval = setTimeout(() => {
                    if (window.location.hash.startsWith("#/seguimiento/")) {
                        renderSeguimientoPage(container);
                    }
                }, 5000);
            }
        } catch (err) {
            container.innerHTML = `<div class="tracking-app"><div class="empty-state" style="padding-top:80px">${err.message}</div></div>`;
        }
    }

    await load();
}

router.register("/seguimiento", renderSeguimientoPage);
