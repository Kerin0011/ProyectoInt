import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import CORS_ORIGINS
from app.routes import auth, mesas, platos, ingredientes, pedidos, menu_publico, dashboard

app = FastAPI(title="Restaurant Order API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(mesas.router)
app.include_router(platos.router)
app.include_router(ingredientes.router)
app.include_router(pedidos.router)
app.include_router(menu_publico.router)
app.include_router(dashboard.router)

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend")
FRONTEND_DIR = os.path.realpath(FRONTEND_DIR)
if not os.path.exists(FRONTEND_DIR):
    FRONTEND_DIR = "/app/frontend"
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {"message": "API running", "frontend_dir": FRONTEND_DIR}
