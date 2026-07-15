from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import (
    Mesa, Plato, Categoria, PlatoIngrediente, Ingrediente,
    Pedido, DetallePedido, Personalizacion, EstadoPedido, EstadoMesa,
    Solicitud
)
from app.schemas.schemas import PedidoCreateRequest, PedidoResponse, SolicitudRequest
from app.services.serializers import pedido_to_response

router = APIRouter(prefix="/api/public", tags=["public"])


def descontar_stock(db: Session, consumo: dict[int, int]) -> None:
    """Check there is stock for the whole order, then deduct it.

    Called once per order with the consumption already accumulated. An
    ingredient that reaches zero is marked unavailable so it stops being
    offered on the public menu.
    """
    for ingrediente_id, unidades in consumo.items():
        ingrediente = db.query(Ingrediente).filter(Ingrediente.id == ingrediente_id).first()
        if not ingrediente:
            raise HTTPException(status_code=404, detail=f"Ingrediente {ingrediente_id} no encontrado")
        if ingrediente.stock < unidades:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"No hay stock suficiente de '{ingrediente.nombre}': "
                    f"quedan {ingrediente.stock} y el pedido necesita {unidades}"
                )
            )

    for ingrediente_id, unidades in consumo.items():
        ingrediente = db.query(Ingrediente).filter(Ingrediente.id == ingrediente_id).first()
        ingrediente.stock -= unidades
        if ingrediente.stock == 0:
            ingrediente.disponible = False


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
                # Never offer as an extra something the admin marked unavailable
                if pi.es_extra and not ing.disponible:
                    continue
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
                "destacado": bool(p.destacado),
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
    # Units of each ingredient the whole order consumes. Accumulated across all
    # lines and validated once before the commit: checking line by line would
    # let two lines of the same dish each pass on their own and drive stock
    # negative.
    consumo: dict[int, int] = defaultdict(int)

    for detalle_req in data.detalles:
        plato = db.query(Plato).filter(Plato.id == detalle_req.plato_id).first()
        if not plato:
            raise HTTPException(status_code=404, detail=f"Plato {detalle_req.plato_id} no encontrado")
        if not plato.disponible:
            raise HTTPException(status_code=400, detail=f"El plato '{plato.nombre}' no esta disponible")

        precio_unitario = float(plato.precio_base)

        nota = (detalle_req.nota or "").strip()[:255] or None

        detalle = DetallePedido(
            pedido_id=pedido.id,
            plato_id=plato.id,
            cantidad=detalle_req.cantidad,
            precio_unitario=precio_unitario,
            subtotal=0,
            nota=nota
        )
        db.add(detalle)
        db.flush()

        extra_cost = 0.0
        # Only what is flagged as extra can be added, and only what is flagged
        # as removable can be taken out.
        composicion = {pi.ingrediente_id: pi for pi in plato.plato_ingredientes}
        quitados = set()

        for pers_req in detalle_req.personalizaciones:
            ingrediente = db.query(Ingrediente).filter(Ingrediente.id == pers_req.ingrediente_id).first()
            if not ingrediente:
                raise HTTPException(status_code=404, detail=f"Ingrediente {pers_req.ingrediente_id} no encontrado")

            pi = composicion.get(ingrediente.id)
            if not pi:
                raise HTTPException(
                    status_code=400,
                    detail=f"'{ingrediente.nombre}' no forma parte de '{plato.nombre}'"
                )

            precio_adicional = 0.0
            if pers_req.accion == "agregar":
                if not pi.es_extra:
                    raise HTTPException(
                        status_code=400,
                        detail=f"'{ingrediente.nombre}' no se puede agregar a '{plato.nombre}'"
                    )
                if not ingrediente.disponible:
                    raise HTTPException(
                        status_code=400,
                        detail=f"El ingrediente '{ingrediente.nombre}' no esta disponible"
                    )
                precio_adicional = float(ingrediente.precio_extra) * pers_req.cantidad
                consumo[ingrediente.id] += pers_req.cantidad * detalle_req.cantidad
            else:
                if not pi.es_removible:
                    raise HTTPException(
                        status_code=400,
                        detail=f"'{ingrediente.nombre}' no se puede quitar de '{plato.nombre}'"
                    )
                quitados.add(ingrediente.id)

            pers = Personalizacion(
                detalle_pedido_id=detalle.id,
                ingrediente_id=ingrediente.id,
                accion=pers_req.accion,
                cantidad=pers_req.cantidad,
                precio_adicional=precio_adicional
            )
            db.add(pers)
            extra_cost += precio_adicional

        # Base ingredients leave the inventory too, except the ones the diner
        # asked to remove.
        for pi in plato.plato_ingredientes:
            if pi.es_default and pi.ingrediente_id not in quitados:
                consumo[pi.ingrediente_id] += pi.cantidad_default * detalle_req.cantidad

        subtotal = (precio_unitario + extra_cost) * detalle_req.cantidad
        detalle.subtotal = subtotal
        total_pedido += subtotal

    descontar_stock(db, consumo)

    pedido.total = total_pedido

    if mesa.estado == EstadoMesa.libre:
        mesa.estado = EstadoMesa.ocupada

    db.commit()
    db.refresh(pedido)
    return pedido_to_response(pedido)


@router.get("/pedidos/{pedido_id}", response_model=PedidoResponse)
def seguimiento_pedido(pedido_id: int, db: Session = Depends(get_db)):
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return pedido_to_response(pedido)


@router.post("/solicitar/{mesa_token}")
def solicitar(
    mesa_token: str,
    data: SolicitudRequest,
    db: Session = Depends(get_db)
):
    mesa = db.query(Mesa).filter(Mesa.token_qr == mesa_token).first()
    if not mesa:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    solicitud = Solicitud(mesa_id=mesa.id, tipo=data.tipo)
    db.add(solicitud)
    db.commit()

    return {"message": f"Solicitud de {data.tipo} registrada", "id": solicitud.id}
