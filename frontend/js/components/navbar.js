const NavbarComponent = {
    render() {
        const rol = localStorage.getItem("rol");
        const nombre = localStorage.getItem("nombre");

        let adminLinks = "";
        if (rol === "admin") {
            adminLinks = `
                <li class="nav-item"><a class="nav-link" href="#/mesas">${Icons.iconSpan('mesas', 'me-1')}Mesas</a></li>
                <li class="nav-item"><a class="nav-link" href="#/platos">${Icons.iconSpan('platos', 'me-1')}Platos</a></li>
                <li class="nav-item"><a class="nav-link" href="#/ingredientes">${Icons.iconSpan('ingredientes', 'me-1')}Ingredientes</a></li>
            `;
        }

        return `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
            <div class="container-fluid">
                <a class="navbar-brand" href="#/dashboard">
                    ${Icons.iconSpan('shop', 'me-1')} Restaurant Order
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="mainNav">
                    <ul class="navbar-nav me-auto">
                        <li class="nav-item"><a class="nav-link" href="#/dashboard">${Icons.iconSpan('dashboard', 'me-1')}Dashboard</a></li>
                        <li class="nav-item"><a class="nav-link" href="#/pedidos">${Icons.iconSpan('pedidos', 'me-1')}Pedidos</a></li>
                        ${adminLinks}
                    </ul>
                    <span class="navbar-text me-3">${nombre} (${rol})</span>
                    <button class="btn btn-outline-light btn-sm" id="btn-logout">
                        ${Icons.icon('logout', 16)} Salir
                    </button>
                </div>
            </div>
        </nav>`;
    },

    init() {
        const btn = document.getElementById("btn-logout");
        if (btn) {
            btn.addEventListener("click", () => {
                localStorage.clear();
                router.navigate("/login");
            });
        }
    }
};
