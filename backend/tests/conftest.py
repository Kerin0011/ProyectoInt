"""Test setup.

Tests run against an in-memory SQLite database rather than MySQL, so they need
no running server, never touch real data, and always start from a known state.
"""
import os

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "test-only-key")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.models.database import get_db
from app.models.models import (
    Base, Rol, Categoria, Ingrediente, Plato, PlatoIngrediente, Mesa
)

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _seed(db):
    """Minimum data to exercise the ordering flow.

    The burger carries one ingredient of each kind: extra cheese (extra only),
    beef (base, not removable, deliberately short on stock) and lettuce (base
    and removable).
    """
    db.add_all([Rol(id=1, nombre="admin"), Rol(id=2, nombre="mozo")])
    db.add(Categoria(id=1, nombre="Platos Fuertes"))
    db.add_all([
        Ingrediente(id=1, nombre="Queso extra", stock=10, precio_extra=2000),
        Ingrediente(id=2, nombre="Carne de res", stock=3, precio_extra=0),
        Ingrediente(id=3, nombre="Lechuga", stock=50, precio_extra=0),
    ])
    db.add(Plato(id=1, nombre="Hamburguesa", precio_base=15000, categoria_id=1, disponible=True))
    db.add_all([
        PlatoIngrediente(plato_id=1, ingrediente_id=1, es_default=False, es_extra=True, es_removible=False),
        PlatoIngrediente(plato_id=1, ingrediente_id=2, es_default=True, es_extra=False, es_removible=False),
        PlatoIngrediente(plato_id=1, ingrediente_id=3, es_default=True, es_extra=False, es_removible=True),
    ])
    db.add(Mesa(id=1, numero="M1", token_qr="table-token-1"))
    db.commit()


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSession()
    _seed(session)
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db):
    def _test_get_db():
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = _test_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def admin(client):
    """Auth headers for an already logged-in admin."""
    client.post("/api/auth/register", json={
        "nombre": "Admin", "email": "admin@nexora.com",
        "password": "123456", "rol_id": 1,
    })
    token = client.post("/api/auth/login", json={
        "email": "admin@nexora.com", "password": "123456",
    }).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def stock(db):
    """Re-read an ingredient and return (stock, available)."""
    def _stock(ingredient_id):
        db.expire_all()
        ing = db.query(Ingrediente).filter(Ingrediente.id == ingredient_id).first()
        return ing.stock, ing.disponible
    return _stock
