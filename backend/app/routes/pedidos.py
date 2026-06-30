from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import (
    Pedido, DetallePedido, Personalizacion, Plato,
    PlatoIngrediente, Ingrediente, Mesa, Usuario,
    EstadoPedido
)
from app.schemas.schemas import (
    PedidoCreateRequest, PedidoResponse, EstadoUpdate,
    DetallePedidoResponse, PersonalizacionResponse
)
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/pedidos", tags=["pedidos"])


TRANSICIONES = {
    EstadoPedido.pendiente: [EstadoPedido.confirmado, EstadoPedido.cancelado],
    EstadoPedido.confirmado: [EstadoPedido.en_preparacion],
    EstadoPedido.en_preparacion: [EstadoPedido.listo],
    EstadoPedido.listo: [EstadoPedido.entregado],
    EstadoPedido.entregado: [],
    EstadoPedido.cancelado: [],
}


def _pedido_to_response(pedido: Pedido) -> PedidoResponse:
    return PedidoResponse(
        id=pedido.id,
        mesa_id=pedido.mesa_id,
        mesa_numero=pedido.mesa.numero if pedido.mesa else None,
        estado=pedido.estado.value,
        total=float(pedido.total),
        created_at=pedido.created_at,
        updated_at=pedido.updated_at,
        detalles=[
            DetallePedidoResponse(
                id=d.id,
                plato_id=d.plato_id,
                plato_nombre=d.plato.nombre if d.plato else None,
                cantidad=d.cantidad,
                precio_unitario=float(d.precio_unitario),
                subtotal=float(d.subtotal),
                personalizaciones=[
                    PersonalizacionResponse(
                        id=p.id,
                        ingrediente_id=p.ingrediente_id,
                        ingrediente_nombre=p.ingrediente.nombre if p.ingrediente else None,
                        accion=p.accion.value,
                        cantidad=p.cantidad,
                        precio_adicional=float(p.precio_adicional)
                    )
                    for p in d.personalizaciones
                ]
            )
            for d in pedido.detalles
        ]
    )


@router.get("", response_model=list[PedidoResponse])
def listar_pedidos(
    estado: str = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    query = db.query(Pedido)
    if estado:
        query = query.filter(Pedido.estado == estado)
    pedidos = query.order_by(Pedido.created_at.desc()).all()
    return [_pedido_to_response(p) for p in pedidos]


@router.get("/{pedido_id}", response_model=PedidoResponse)
def obtener_pedido(
    pedido_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return _pedido_to_response(pedido)


@router.patch("/{pedido_id}/estado", response_model=PedidoResponse)
def cambiar_estado(
    pedido_id: int,
    data: EstadoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    try:
        nuevo_estado = EstadoPedido(data.estado)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Estado invalido: {data.estado}")

    if nuevo_estado not in TRANSICIONES.get(pedido.estado, []):
        raise HTTPException(
            status_code=400,
            detail=f"No se puede cambiar de '{pedido.estado.value}' a '{nuevo_estado.value}'"
        )

    pedido.estado = nuevo_estado
    db.commit()
    db.refresh(pedido)
    return _pedido_to_response(pedido)


@router.put("/{pedido_id}/cancelar", response_model=PedidoResponse)
def cancelar_pedido(
    pedido_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if pedido.estado != EstadoPedido.pendiente:
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden cancelar pedidos en estado 'pendiente'"
        )

    pedido.estado = EstadoPedido.cancelado
    db.commit()
    db.refresh(pedido)
    return _pedido_to_response(pedido)
