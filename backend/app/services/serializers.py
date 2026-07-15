"""Shared serializers: turn ORM objects into response schemas.

Kept here so the routers don't duplicate the mapping logic.
"""
from app.models.models import Pedido, Plato
from app.schemas.schemas import (
    PedidoResponse, DetallePedidoResponse, PersonalizacionResponse,
    PlatoResponse, PlatoIngredienteSchema,
)


def pedido_to_response(pedido: Pedido) -> PedidoResponse:
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
                nota=d.nota,
                personalizaciones=[
                    PersonalizacionResponse(
                        id=p.id,
                        ingrediente_id=p.ingrediente_id,
                        ingrediente_nombre=p.ingrediente.nombre if p.ingrediente else None,
                        accion=p.accion.value,
                        cantidad=p.cantidad,
                        precio_adicional=float(p.precio_adicional),
                    )
                    for p in d.personalizaciones
                ],
            )
            for d in pedido.detalles
        ],
    )


def plato_to_response(p: Plato) -> PlatoResponse:
    return PlatoResponse(
        id=p.id,
        nombre=p.nombre,
        descripcion=p.descripcion,
        precio_base=float(p.precio_base),
        categoria_id=p.categoria_id,
        categoria_nombre=p.categoria.nombre if p.categoria else None,
        disponible=p.disponible,
        destacado=bool(p.destacado),
        imagen_url=p.imagen_url,
        ingredientes=[
            PlatoIngredienteSchema(
                ingrediente_id=pi.ingrediente_id,
                es_default=pi.es_default,
                es_extra=pi.es_extra,
                es_removible=pi.es_removible,
                cantidad_default=pi.cantidad_default,
            )
            for pi in p.plato_ingredientes
        ],
    )
