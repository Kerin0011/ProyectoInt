// Name of the restaurant using Nexora. This is the one value that changes per
// client, and it is what the diner sees on the public menu. "Nexora" is the
// product name and belongs in the staff panel, never on the diner's screen.
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
