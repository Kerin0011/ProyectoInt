from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS
from app.models.database import run_migrations
from app.routes import auth, mesas, platos, ingredientes, pedidos, menu_publico, dashboard, solicitudes

app = FastAPI(title="Nexora API", version="1.0.0")


@app.on_event("startup")
def _startup():
    run_migrations()

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
app.include_router(solicitudes.router)


@app.get("/")
def root():
    return {"message": "Nexora API v1.0.0"}
