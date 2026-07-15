from pydantic import BaseModel, EmailStr, Field
from typing import Literal, Optional
from datetime import datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    nombre: str
    rol: str


class UsuarioCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    rol_id: int = Field(gt=0)


class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: str
    rol: str
    activo: bool

    class Config:
        from_attributes = True


class MesaCreate(BaseModel):
    numero: str = Field(min_length=1, max_length=10)


class MesaResponse(BaseModel):
    id: int
    numero: str
    token_qr: str
    estado: str

    class Config:
        from_attributes = True


class IngredienteCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    stock: int = Field(default=0, ge=0)
    disponible: bool = True
    precio_extra: float = Field(default=0.00, ge=0)


class IngredienteResponse(BaseModel):
    id: int
    nombre: str
    stock: int
    disponible: bool
    precio_extra: float

    class Config:
        from_attributes = True


class PlatoIngredienteSchema(BaseModel):
    ingrediente_id: int = Field(gt=0)
    es_default: bool = True
    es_extra: bool = False
    es_removible: bool = False
    cantidad_default: int = Field(default=1, gt=0)


class PlatoCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    descripcion: Optional[str] = None
    precio_base: float = Field(gt=0)
    categoria_id: int = Field(gt=0)
    disponible: bool = True
    destacado: bool = False
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    ingredientes: list[PlatoIngredienteSchema] = []


class PlatoResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    precio_base: float
    categoria_id: int
    categoria_nombre: Optional[str] = None
    disponible: bool
    destacado: bool = False
    imagen_url: Optional[str]
    ingredientes: list[PlatoIngredienteSchema] = []

    class Config:
        from_attributes = True


class PersonalizacionRequest(BaseModel):
    ingrediente_id: int = Field(gt=0)
    accion: Literal["agregar", "quitar"]
    cantidad: int = Field(default=1, gt=0, le=20)


class DetallePedidoRequest(BaseModel):
    plato_id: int = Field(gt=0)
    cantidad: int = Field(default=1, gt=0, le=50)
    nota: Optional[str] = Field(default=None, max_length=255)
    personalizaciones: list[PersonalizacionRequest] = []


class PedidoCreateRequest(BaseModel):
    mesa_token: str = Field(min_length=1, max_length=64)
    detalles: list[DetallePedidoRequest] = Field(min_length=1)


class PersonalizacionResponse(BaseModel):
    id: int
    ingrediente_id: int
    ingrediente_nombre: Optional[str] = None
    accion: str
    cantidad: int
    precio_adicional: float

    class Config:
        from_attributes = True


class DetallePedidoResponse(BaseModel):
    id: int
    plato_id: int
    plato_nombre: Optional[str] = None
    cantidad: int
    precio_unitario: float
    subtotal: float
    nota: Optional[str] = None
    personalizaciones: list[PersonalizacionResponse] = []

    class Config:
        from_attributes = True


class PedidoResponse(BaseModel):
    id: int
    mesa_id: int
    mesa_numero: Optional[str] = None
    estado: str
    total: float
    created_at: datetime
    updated_at: datetime
    detalles: list[DetallePedidoResponse] = []

    class Config:
        from_attributes = True


class EstadoUpdate(BaseModel):
    """Order state. Tables use EstadoMesaUpdate, they are different domains."""
    estado: Literal[
        "pendiente", "confirmado", "en_preparacion",
        "listo", "entregado", "cancelado"
    ]


class EstadoMesaUpdate(BaseModel):
    estado: Literal["libre", "ocupada"]


class DisponibilidadUpdate(BaseModel):
    disponible: bool


class SolicitudRequest(BaseModel):
    tipo: Literal["mesero", "cuenta"]


class SolicitudResponse(BaseModel):
    id: int
    mesa_id: int
    mesa_numero: Optional[str] = None
    tipo: str
    atendida: bool
    created_at: datetime

    class Config:
        from_attributes = True
