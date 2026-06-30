const API_BASE = (function () {
    const params = new URLSearchParams(window.location.search);
    if (params.get("api")) return params.get("api");
    if (localStorage.getItem("api_url")) return localStorage.getItem("api_url");
    return "http://localhost:8000";
})();

function setApiUrl(url) {
    localStorage.setItem("api_url", url);
    window.location.search = "";
    window.location.reload();
}
