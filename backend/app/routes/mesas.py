import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import Mesa, Usuario, Pedido, DetallePedido, Solicitud
from app.schemas.schemas import MesaCreate, MesaResponse, EstadoMesaUpdate
from app.services.auth import get_current_user, require_role

router = APIRouter(prefix="/api/mesas", tags=["mesas"])


@router.get("", response_model=list[MesaResponse])
def listar_mesas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    mesas = db.query(Mesa).all()
    return [
        MesaResponse(
            id=m.id,
            numero=m.numero,
            token_qr=m.token_qr,
            estado=m.estado.value
        )
        for m in mesas
    ]


@router.post("", response_model=MesaResponse, status_code=status.HTTP_201_CREATED)
def crear_mesa(
    data: MesaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    existente = db.query(Mesa).filter(Mesa.numero == data.numero).first()
    if existente:
        raise HTTPException(status_code=400, detail="Numero de mesa ya existe")

    mesa = Mesa(
        numero=data.numero,
        token_qr=str(uuid.uuid4())
    )
    db.add(mesa)
    db.commit()
    db.refresh(mesa)

    return MesaResponse(
        id=mesa.id,
        numero=mesa.numero,
        token_qr=mesa.token_qr,
        estado=mesa.estado.value
    )


@router.patch("/{mesa_id}/estado", response_model=MesaResponse)
def cambiar_estado_mesa(
    mesa_id: int,
    data: EstadoMesaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    mesa = db.query(Mesa).filter(Mesa.id == mesa_id).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    mesa.estado = data.estado
    db.commit()
    db.refresh(mesa)

    return MesaResponse(
        id=mesa.id,
        numero=mesa.numero,
        token_qr=mesa.token_qr,
        estado=mesa.estado.value
    )


@router.delete("/{mesa_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_mesa(
    mesa_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    mesa = db.query(Mesa).filter(Mesa.id == mesa_id).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    db.query(Solicitud).filter(Solicitud.mesa_id == mesa_id).delete()
    for pedido in db.query(Pedido).filter(Pedido.mesa_id == mesa_id).all():
        db.query(DetallePedido).filter(DetallePedido.pedido_id == pedido.id).delete()
    db.query(Pedido).filter(Pedido.mesa_id == mesa_id).delete()
    db.delete(mesa)
    db.commit()
    return None

@router.patch("/{mesa_id}/regenerar-qr", response_model=MesaResponse)
def regenerar_qr(
    mesa_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("admin"))
):
    mesa = db.query(Mesa).filter(Mesa.id == mesa_id).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    mesa.token_qr = str(uuid.uuid4())
    db.commit()
    db.refresh(mesa)

    return MesaResponse(
        id=mesa.id,
        numero=mesa.numero,
        token_qr=mesa.token_qr,
        estado=mesa.estado.value
    )
