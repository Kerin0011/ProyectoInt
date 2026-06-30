from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import Pedido, Mesa, Usuario
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
def dashboard(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    pedidos_activos = db.query(Pedido).filter(
        Pedido.estado.in_(["pendiente", "confirmado", "en_preparacion", "listo"])
    ).order_by(Pedido.created_at.desc()).all()

    mesas = db.query(Mesa).all()

    resumen = {
        "pendiente": 0,
        "confirmado": 0,
        "en_preparacion": 0,
        "listo": 0,
        "total_activos": 0
    }

    pedidos_data = []
    for p in pedidos_activos:
        resumen[p.estado.value] = resumen.get(p.estado.value, 0) + 1
        resumen["total_activos"] += 1
        pedidos_data.append({
            "id": p.id,
            "mesa": p.mesa.numero if p.mesa else "N/A",
            "estado": p.estado.value,
            "total": float(p.total),
            "platos_count": sum(d.cantidad for d in p.detalles),
            "created_at": p.created_at.isoformat()
        })

    mesas_data = [
        {"id": m.id, "numero": m.numero, "estado": m.estado.value}
        for m in mesas
    ]

    return {
        "resumen": resumen,
        "pedidos": pedidos_data,
        "mesas": mesas_data
    }
