async function renderLoginPage(container) {
    container.innerHTML = `
    <div id="login-page">
        <div class="card shadow">
            <div class="card-body p-4">
                <div class="text-center mb-4">
                    <i class="bi bi-shop display-3 text-primary"></i>
                    <h3 class="mt-2">Restaurant Order</h3>
                    <p class="text-muted">Inicia sesion para continuar</p>
                </div>
                <form id="login-form">
                    <div class="mb-3">
                        <label for="login-email" class="form-label">Email</label>
                        <input type="email" class="form-control" id="login-email" required
                            placeholder="mozo@restaurante.com">
                    </div>
                    <div class="mb-3">
                        <label for="login-password" class="form-label">Contrasena</label>
                        <input type="password" class="form-control" id="login-password" required>
                    </div>
                    <div id="login-error" class="alert alert-danger d-none"></div>
                    <button type="submit" class="btn btn-primary w-100">
                        <i class="bi bi-box-arrow-in-right"></i> Ingresar
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
            const data = await api.post("/api/auth/login", { email, password });
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
