from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS
from app.models.database import engine
from app.models.models import Base
from app.routes import auth, mesas, platos, ingredientes, pedidos, menu_publico, dashboard

Base.metadata.create_all(bind=engine)

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
