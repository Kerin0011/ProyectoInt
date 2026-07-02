from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import Solicitud, Mesa, Usuario
from app.schemas.schemas import SolicitudResponse
from app.services.auth import get_current_user, require_role

router = APIRouter(prefix="/api/solicitudes", tags=["solicitudes"])


@router.get("", response_model=list[SolicitudResponse])
def listar_solicitudes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    solicitudes = db.query(Solicitud).order_by(Solicitud.created_at.desc()).limit(20).all()
    result = []
    for s in solicitudes:
        result.append(SolicitudResponse(
            id=s.id,
            mesa_id=s.mesa_id,
            mesa_numero=s.mesa.numero if s.mesa else None,
            tipo=s.tipo,
            atendida=s.atendida,
            created_at=s.created_at
        ))
    return result


@router.patch("/{solicitud_id}/atender")
def atender_solicitud(
    solicitud_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    s = db.query(Solicitud).filter(Solicitud.id == solicitud_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    s.atendida = True
    db.commit()
    return {"message": "Solicitud atendida"}
