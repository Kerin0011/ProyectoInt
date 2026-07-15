// Name of the restaurant this deployment is sold to. It titles the staff panel
// and the public menu, and it is the one value that changes per client.
//
// "Nexora" is the product name and only shows on the way in: the login screen,
// the browser tab and the installable app. Once inside, the panel belongs to
// the restaurant, not to us.
const RESTAURANT_NAME = "Mi Restaurante";

const API_BASE = (function () {
    const params = new URLSearchParams(window.location.search);
    if (params.get("api")) return params.get("api");
    if (localStorage.getItem("api_url")) return localStorage.getItem("api_url");
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        return "http://localhost:8000";
    }
    return "https://proyectoint-production-cf9f.up.railway.app";
})();

function setApiUrl(url) {
    localStorage.setItem("api_url", url);
    window.location.search = "";
    window.location.reload();
}
