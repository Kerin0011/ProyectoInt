// FastAPI reports error detail two ways: a string for the errors we raise
// ourselves (HTTPException), and a list of objects when Pydantic rejects the
// body (422). Without this, a 422 would show "[object Object]" in the toast.
function mensajeDeError(detail) {
    if (!detail) return "Ocurrio un error";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail.map(d => d.msg || "").filter(Boolean).join(". ") || "Datos invalidos";
    }
    return "Ocurrio un error";
}

const api = {
    headers() {
        const token = localStorage.getItem("token");
        const h = { "Content-Type": "application/json" };
        if (token) h["Authorization"] = `Bearer ${token}`;
        return h;
    },

    async request(path, options = {}) {
        const res = await fetch(API_BASE + path, { headers: this.headers(), ...options });
        if (res.status === 401) { handle401(); return null; }
        if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            throw new Error(mensajeDeError(e.detail));
        }
        if (res.status === 204) return null;
        return res.json();
    },

    get(path) {
        return this.request(path);
    },

    post(path, body) {
        return this.request(path, { method: "POST", body: JSON.stringify(body) });
    },

    put(path, body) {
        return this.request(path, { method: "PUT", body: JSON.stringify(body) });
    },

    patch(path, body) {
        return this.request(path, { method: "PATCH", body: JSON.stringify(body) });
    },

    async del(path) {
        await this.request(path, { method: "DELETE" });
        return null;
    }
};

function handle401() {
    if (window.location.hash === "#/login") return;
    localStorage.clear();
    router.navigate("/login");
}

function showToast(message, type = "dark") {
    const toastEl = document.getElementById("toast-notification");
    const msgEl = document.getElementById("toast-message");
    msgEl.textContent = message;
    toastEl.className = `toast align-items-center text-bg-${type} border-0`;
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl);
    toast.show();
}

function formatPrice(price) {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP" }).format(price);
}

function estadoBadge(estado) {
    const map = {
        pendiente: "warning",
        confirmado: "primary",
        en_preparacion: "orange",
        listo: "success",
        entregado: "secondary",
        cancelado: "danger"
    };
    const label = {
        pendiente: "Pendiente",
        confirmado: "Confirmado",
        en_preparacion: "En preparacion",
        listo: "Listo",
        entregado: "Entregado",
        cancelado: "Cancelado"
    };
    const color = map[estado] || "secondary";
    const text = label[estado] || estado;
    const extraStyle = color === "orange" ? ' style="background-color:#fd7e14;color:white"' : "";
    return `<span class="badge bg-${color}"${extraStyle}>${text}</span>`;
}

function showConfirm(title, message, confirmText, confirmClass) {
    return Swal.fire({
        title: title,
        text: message,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: confirmText || "Confirmar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: confirmClass === "danger" ? "#dc3545" : "#0d6efd",
        reverseButtons: true,
        allowOutsideClick: false
    }).then((result) => result.isConfirmed);
}
