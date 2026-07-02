async function renderLoginPage(container) {
    container.innerHTML = `
    <div id="login-page">
        <div class="card shadow">
            <div class="card-body p-4">
                <div class="text-center mb-4">
                    <span class="text-primary" style="display:inline-flex">${Icons.icon('shop', 56)}</span>
                    <h3 class="mt-2">Restaurant Order</h3>
                    <p class="text-muted">Inicia sesion para continuar</p>
                </div>
                <form id="login-form">
                    <div class="mb-3">
                        <label for="login-email" class="form-label">Email</label>
                        <input type="email" class="form-control" id="login-email" required
                            placeholder="mozo@restaurante.com" value="admin@restaurante.com">
                    </div>
                    <div class="mb-3">
                        <label for="login-password" class="form-label">Contrasena</label>
                        <input type="password" class="form-control" id="login-password" required>
                    </div>
                    <div id="login-error" class="alert alert-danger d-none"></div>
                    <button type="submit" class="btn btn-primary w-100">
                        ${Icons.icon('login', 18)} Ingresar
                    </button>
                </form>
            </div>
        </div>
    </div>`;

    document.getElementById("login-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        const errorDiv = document.getElementById("login-error");

        try {
            const res = await fetch(API_BASE + "/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Error " + res.status);
            }
            const data = await res.json();
            if (!data || !data.access_token) {
                throw new Error("Respuesta inválida del servidor");
            }
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("nombre", data.nombre);
            localStorage.setItem("rol", data.rol);
            router.navigate("/dashboard");
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.classList.remove("d-none");
        }
    });
}

router.register("/login", renderLoginPage);
