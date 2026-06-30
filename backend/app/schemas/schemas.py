from pydantic import BaseModel, EmailStr
from typing import Optional
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
    nombre: str
    email: EmailStr
    password: str
    rol_id: int


class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: str
    rol: str
    activo: bool

    class Config:
        from_attributes = True


class MesaCreate(BaseModel):
    numero: str


class MesaResponse(BaseModel):
    id: int
    numero: str
    token_qr: str
    estado: str

    class Config:
        from_attributes = True


class IngredienteCreate(BaseModel):
    nombre: str
    stock: int = 0
    disponible: bool = True
    precio_extra: float = 0.00


class IngredienteResponse(BaseModel):
    id: int
    nombre: str
    stock: int
    disponible: bool
    precio_extra: float

    class Config:
        from_attributes = True


class PlatoIngredienteSchema(BaseModel):
    ingrediente_id: int
    es_default: bool = True
    es_extra: bool = False
    es_removible: bool = False
    cantidad_default: int = 1


class PlatoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio_base: float
    categoria_id: int
    disponible: bool = True
    imagen_url: Optional[str] = None
    ingredientes: list[PlatoIngredienteSchema] = []


class PlatoResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    precio_base: float
    categoria_id: int
    categoria_nombre: Optional[str] = None
    disponible: bool
    imagen_url: Optional[str]
    ingredientes: list[PlatoIngredienteSchema] = []

    class Config:
        from_attributes = True


class PersonalizacionRequest(BaseModel):
    ingrediente_id: int
    accion: str
    cantidad: int = 1


class DetallePedidoRequest(BaseModel):
    plato_id: int
    cantidad: int = 1
    personalizaciones: list[PersonalizacionRequest] = []


class PedidoCreateRequest(BaseModel):
    mesa_token: str
    detalles: list[DetallePedidoRequest]


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
    estado: str


class DisponibilidadUpdate(BaseModel):
    disponible: bool
