import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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


@app.get("/")
def root():
    return {"message": "Restaurant Order API v1.0.0"}


@app.get("/health")
def health():
    import os
    from app.models.models import Categoria
    from app.models.database import SessionLocal
    info = {
        "db_url": os.getenv("DATABASE_URL", "not set")[:60],
        "db_private": (os.getenv("DATABASE_PRIVATE_URL") or "not set")[:60],
    }
    try:
        db = SessionLocal()
        count = db.query(Categoria).count()
        db.close()
        info["db"] = "ok"
        info["categorias"] = count
    except Exception as e:
        info["db"] = "error"
        info["detail"] = str(e)[:200]
    return info
