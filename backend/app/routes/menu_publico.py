from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import (
    Mesa, Plato, Categoria, PlatoIngrediente, Ingrediente,
    Pedido, DetallePedido, Personalizacion, EstadoPedido, EstadoMesa
)
from app.schemas.schemas import (
    PedidoCreateRequest, PedidoResponse,
    DetallePedidoResponse, PersonalizacionResponse
)

router = APIRouter(prefix="/api/public", tags=["public"])


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


@router.get("/menu/{mesa_token}")
def menu_publico(mesa_token: str, db: Session = Depends(get_db)):
    mesa = db.query(Mesa).filter(Mesa.token_qr == mesa_token).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    categorias = db.query(Categoria).all()
    resultado = []
    for cat in categorias:
        platos = db.query(Plato).filter(
            Plato.categoria_id == cat.id,
            Plato.disponible == True
        ).all()

        platos_data = []
        for p in platos:
            ingredientes = []
            for pi in p.plato_ingredientes:
                ing = pi.ingrediente
                ingredientes.append({
                    "id": ing.id,
                    "nombre": ing.nombre,
                    "es_default": pi.es_default,
                    "es_extra": pi.es_extra,
                    "es_removible": pi.es_removible,
                    "precio_extra": float(ing.precio_extra) if pi.es_extra else 0,
                    "cantidad_default": pi.cantidad_default
                })

            platos_data.append({
                "id": p.id,
                "nombre": p.nombre,
                "descripcion": p.descripcion,
                "precio_base": float(p.precio_base),
                "imagen_url": p.imagen_url,
                "ingredientes": ingredientes
            })

        if platos_data:
            resultado.append({
                "id": cat.id,
                "nombre": cat.nombre,
                "platos": platos_data
            })

    return {
        "mesa": mesa.numero,
        "mesa_token": mesa.token_qr,
        "categorias": resultado
    }


@router.post("/pedidos", response_model=PedidoResponse, status_code=201)
def crear_pedido_publico(data: PedidoCreateRequest, db: Session = Depends(get_db)):
    mesa = db.query(Mesa).filter(Mesa.token_qr == data.mesa_token).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    pedido = Pedido(mesa_id=mesa.id, estado=EstadoPedido.pendiente)
    db.add(pedido)
    db.flush()

    total_pedido = 0.0

    for detalle_req in data.detalles:
        plato = db.query(Plato).filter(Plato.id == detalle_req.plato_id).first()
        if not plato:
            raise HTTPException(status_code=404, detail=f"Plato {detalle_req.plato_id} no encontrado")
        if not plato.disponible:
            raise HTTPException(status_code=400, detail=f"El plato '{plato.nombre}' no esta disponible")

        precio_unitario = float(plato.precio_base)

        detalle = DetallePedido(
            pedido_id=pedido.id,
            plato_id=plato.id,
            cantidad=detalle_req.cantidad,
            precio_unitario=precio_unitario,
            subtotal=0
        )
        db.add(detalle)
        db.flush()

        extra_cost = 0.0

        for pers_req in detalle_req.personalizaciones:
            ingrediente = db.query(Ingrediente).filter(Ingrediente.id == pers_req.ingrediente_id).first()
            if not ingrediente:
                raise HTTPException(status_code=404, detail=f"Ingrediente {pers_req.ingrediente_id} no encontrado")

            precio_adicional = 0.0
            if pers_req.accion == "agregar":
                precio_adicional = float(ingrediente.precio_extra) * pers_req.cantidad
            elif pers_req.accion == "quitar":
                precio_adicional = 0.0

            pers = Personalizacion(
                detalle_pedido_id=detalle.id,
                ingrediente_id=ingrediente.id,
                accion=pers_req.accion,
                cantidad=pers_req.cantidad,
                precio_adicional=precio_adicional
            )
            db.add(pers)
            extra_cost += precio_adicional

        subtotal = (precio_unitario + extra_cost) * detalle_req.cantidad
        detalle.subtotal = subtotal
        total_pedido += subtotal

    pedido.total = total_pedido

    if mesa.estado == EstadoMesa.libre:
        mesa.estado = EstadoMesa.ocupada

    db.commit()
    db.refresh(pedido)
    return _pedido_to_response(pedido)


@router.get("/pedidos/{pedido_id}", response_model=PedidoResponse)
def seguimiento_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return _pedido_to_response(pedido)
