from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.models import Usuario, Rol
from app.schemas.schemas import LoginRequest, TokenResponse, UsuarioCreate, UsuarioResponse
from app.services.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_current_user_opcional
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contrasena incorrectos"
        )
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )

    token = create_access_token({"sub": user.id, "rol": user.rol.nombre})
    return TokenResponse(
        access_token=token,
        nombre=user.nombre,
        rol=user.rol.nombre
    )


@router.post("/register", response_model=UsuarioResponse)
def register(
    data: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Optional[Usuario] = Depends(get_current_user_opcional)
):
    # The very first user is created without a token to bootstrap the initial
    # admin. After that, only an admin can create users.
    es_primer_usuario = db.query(Usuario).count() == 0
    if not es_primer_usuario:
        if current_user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales invalidas",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if current_user.rol.nombre != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo un administrador puede registrar usuarios"
            )

    existing = db.query(Usuario).filter(Usuario.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya esta registrado"
        )

    rol = db.query(Rol).filter(Rol.id == data.rol_id).first()
    if not rol:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El rol {data.rol_id} no existe"
        )

    user = Usuario(
        nombre=data.nombre,
        email=data.email,
        password_hash=hash_password(data.password),
        rol_id=data.rol_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UsuarioResponse(
        id=user.id,
        nombre=user.nombre,
        email=user.email,
        rol=user.rol.nombre,
        activo=user.activo
    )


@router.get("/me", response_model=UsuarioResponse)
def me(current_user: Usuario = Depends(get_current_user)):
    return UsuarioResponse(
        id=current_user.id,
        nombre=current_user.nombre,
        email=current_user.email,
        rol=current_user.rol.nombre,
        activo=current_user.activo
    )
