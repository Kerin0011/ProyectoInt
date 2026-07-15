from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import Plato, PlatoIngrediente, Usuario
from app.schemas.schemas import PlatoCreate, PlatoResponse, DisponibilidadUpdate
from app.services.auth import get_current_user, require_role
from app.services.serializers import plato_to_response

router = APIRouter(prefix="/api/platos", tags=["platos"])


@router.get("", response_model=list[PlatoResponse])
def listar_platos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    platos = db.query(Plato).all()
    return [plato_to_response(p) for p in platos]


@router.get("/{plato_id}", response_model=PlatoResponse)
def obtener_plato(
    plato_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    p = db.query(Plato).filter(Plato.id == plato_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plato no encontrado")
    return plato_to_response(p)


@router.post("", response_model=PlatoResponse, status_code=201)
def crear_plato(
    data: PlatoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    plato = Plato(
        nombre=data.nombre,
        descripcion=data.descripcion,
        precio_base=data.precio_base,
        categoria_id=data.categoria_id,
        disponible=data.disponible,
        destacado=data.destacado,
        imagen_url=data.imagen_url
    )
    db.add(plato)
    db.flush()

    for ing_data in data.ingredientes:
        pi = PlatoIngrediente(
            plato_id=plato.id,
            ingrediente_id=ing_data.ingrediente_id,
            es_default=ing_data.es_default,
            es_extra=ing_data.es_extra,
            es_removible=ing_data.es_removible,
            cantidad_default=ing_data.cantidad_default
        )
        db.add(pi)

    db.commit()
    db.refresh(plato)
    return plato_to_response(plato)


@router.put("/{plato_id}", response_model=PlatoResponse)
def editar_plato(
    plato_id: int,
    data: PlatoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    p = db.query(Plato).filter(Plato.id == plato_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plato no encontrado")

    p.nombre = data.nombre
    p.descripcion = data.descripcion
    p.precio_base = data.precio_base
    p.categoria_id = data.categoria_id
    p.disponible = data.disponible
    p.destacado = data.destacado
    p.imagen_url = data.imagen_url

    db.query(PlatoIngrediente).filter(PlatoIngrediente.plato_id == plato_id).delete()
    for ing_data in data.ingredientes:
        pi = PlatoIngrediente(
            plato_id=p.id,
            ingrediente_id=ing_data.ingrediente_id,
            es_default=ing_data.es_default,
            es_extra=ing_data.es_extra,
            es_removible=ing_data.es_removible,
            cantidad_default=ing_data.cantidad_default
        )
        db.add(pi)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    db.refresh(p)
    return plato_to_response(p)


@router.delete("/{plato_id}", status_code=204)
def eliminar_plato(
    plato_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    p = db.query(Plato).filter(Plato.id == plato_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plato no encontrado")
    db.query(PlatoIngrediente).filter(PlatoIngrediente.plato_id == plato_id).delete()
    db.delete(p)
    db.commit()


@router.patch("/{plato_id}/disponibilidad", response_model=PlatoResponse)
def toggle_disponibilidad(
    plato_id: int,
    data: DisponibilidadUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    p = db.query(Plato).filter(Plato.id == plato_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plato no encontrado")
    p.disponible = data.disponible
    db.commit()
    db.refresh(p)
    return plato_to_response(p)
