from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import Ingrediente, Usuario
from app.schemas.schemas import IngredienteCreate, IngredienteResponse, DisponibilidadUpdate
from app.services.auth import get_current_user, require_role

router = APIRouter(prefix="/api/ingredientes", tags=["ingredientes"])


@router.get("", response_model=list[IngredienteResponse])
def listar_ingredientes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    ingredientes = db.query(Ingrediente).all()
    return [
        IngredienteResponse(
            id=i.id,
            nombre=i.nombre,
            stock=i.stock,
            disponible=i.disponible,
            precio_extra=float(i.precio_extra)
        )
        for i in ingredientes
    ]


@router.post("", response_model=IngredienteResponse, status_code=201)
def crear_ingrediente(
    data: IngredienteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    ing = Ingrediente(
        nombre=data.nombre,
        stock=data.stock,
        disponible=data.disponible,
        precio_extra=data.precio_extra
    )
    db.add(ing)
    db.commit()
    db.refresh(ing)

    return IngredienteResponse(
        id=ing.id,
        nombre=ing.nombre,
        stock=ing.stock,
        disponible=ing.disponible,
        precio_extra=float(ing.precio_extra)
    )


@router.put("/{ingrediente_id}", response_model=IngredienteResponse)
def editar_ingrediente(
    ingrediente_id: int,
    data: IngredienteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    ing = db.query(Ingrediente).filter(Ingrediente.id == ingrediente_id).first()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")

    ing.nombre = data.nombre
    ing.stock = data.stock
    ing.disponible = data.disponible
    ing.precio_extra = data.precio_extra
    db.commit()
    db.refresh(ing)

    return IngredienteResponse(
        id=ing.id,
        nombre=ing.nombre,
        stock=ing.stock,
        disponible=ing.disponible,
        precio_extra=float(ing.precio_extra)
    )


@router.patch("/{ingrediente_id}/disponibilidad", response_model=IngredienteResponse)
def toggle_disponibilidad(
    ingrediente_id: int,
    data: DisponibilidadUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    ing = db.query(Ingrediente).filter(Ingrediente.id == ingrediente_id).first()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")
    ing.disponible = data.disponible
    db.commit()
    db.refresh(ing)

    return IngredienteResponse(
        id=ing.id,
        nombre=ing.nombre,
        stock=ing.stock,
        disponible=ing.disponible,
        precio_extra=float(ing.precio_extra)
    )
