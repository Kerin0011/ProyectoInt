const router = {
    routes: {},

    register(path, handler) {
        this.routes[path] = handler;
    },

    _findHandler(hash) {
        if (this.routes[hash]) return this.routes[hash];
        const keys = Object.keys(this.routes).sort((a, b) => b.length - a.length);
        for (const key of keys) {
            if (hash.startsWith(key + "/") || hash === key) {
                return this.routes[key];
            }
        }
        return null;
    },

    navigate(path) {
        window.location.hash = path;
    },

    async resolve() {
        if (window._currentInterval) {
            clearInterval(window._currentInterval);
            window._currentInterval = null;
        }

        const hash = window.location.hash.slice(1) || "/login";
        const token = localStorage.getItem("token");

        const publicRoutes = ["/login", "/menu", "/seguimiento"];
        if (!token && !publicRoutes.some(r => hash.startsWith(r))) {
            this.navigate("/login");
            return;
        }

        const container = document.getElementById("app-content");
        const handler = this._findHandler(hash) || this.routes["/login"];

        if (handler) {
            const navbarContainer = document.getElementById("navbar-container");
            if (hash === "/login" || hash.startsWith("/menu/") || hash.startsWith("/seguimiento/")) {
                navbarContainer.innerHTML = "";
            } else if (document.querySelector(".navbar") === null) {
                navbarContainer.innerHTML = NavbarComponent.render();
                NavbarComponent.init();
            }

            container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>';
            try {
                await handler(container);
            } catch (err) {
                container.innerHTML = `<div class="alert alert-danger m-4">Error: ${err.message}</div>`;
            }
        }
    },

    init() {
        window.addEventListener("hashchange", () => this.resolve());
        this.resolve();
    }
};
