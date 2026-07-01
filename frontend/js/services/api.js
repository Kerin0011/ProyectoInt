const api = {
    headers() {
        const token = localStorage.getItem("token");
        const h = { "Content-Type": "application/json" };
        if (token) h["Authorization"] = `Bearer ${token}`;
        return h;
    },

    async get(path) {
        const res = await fetch(API_BASE + path, { headers: this.headers() });
        if (res.status === 401) { localStorage.clear(); router.navigate("/login"); return null; }
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Error"); }
        if (res.status === 204) return null;
        return res.json();
    },

    async post(path, body) {
        const res = await fetch(API_BASE + path, {
            method: "POST", headers: this.headers(), body: JSON.stringify(body)
        });
        if (res.status === 401) { localStorage.clear(); router.navigate("/login"); return null; }
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Error"); }
        return res.json();
    },

    async put(path, body) {
        const res = await fetch(API_BASE + path, {
            method: "PUT", headers: this.headers(), body: JSON.stringify(body)
        });
        if (res.status === 401) { localStorage.clear(); router.navigate("/login"); return null; }
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Error"); }
        return res.json();
    },

    async patch(path, body) {
        const res = await fetch(API_BASE + path, {
            method: "PATCH", headers: this.headers(), body: JSON.stringify(body)
        });
        if (res.status === 401) { localStorage.clear(); router.navigate("/login"); return null; }
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Error"); }
        return res.json();
    },

    async del(path) {
        const res = await fetch(API_BASE + path, { method: "DELETE", headers: this.headers() });
        if (res.status === 401) { localStorage.clear(); router.navigate("/login"); return null; }
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Error"); }
        return null;
    }
};

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
