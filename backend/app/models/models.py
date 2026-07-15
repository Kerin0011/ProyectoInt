from sqlalchemy import (
    Column, Integer, String, Text, DECIMAL, TIMESTAMP,
    ForeignKey, Enum as SQLEnum, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()


class RolEnum(str, enum.Enum):
    admin = "admin"
    mozo = "mozo"


class EstadoMesa(str, enum.Enum):
    libre = "libre"
    ocupada = "ocupada"


class EstadoPedido(str, enum.Enum):
    pendiente = "pendiente"
    confirmado = "confirmado"
    en_preparacion = "en_preparacion"
    listo = "listo"
    entregado = "entregado"
    cancelado = "cancelado"


class AccionPersonalizacion(str, enum.Enum):
    agregar = "agregar"
    quitar = "quitar"


class Rol(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50), unique=True, nullable=False)

    usuarios = relationship("Usuario", back_populates="rol")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    activo = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    rol = relationship("Rol", back_populates="usuarios")
    pedidos = relationship("Pedido", back_populates="usuario")


class Mesa(Base):
    __tablename__ = "mesas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    numero = Column(String(10), unique=True, nullable=False)
    token_qr = Column(String(64), unique=True, nullable=False)
    estado = Column(SQLEnum(EstadoMesa), default=EstadoMesa.libre)

    pedidos = relationship("Pedido", back_populates="mesa", cascade="all, delete-orphan", passive_deletes=True)
    solicitudes = relationship("Solicitud", back_populates="mesa", cascade="all, delete-orphan")


class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)

    platos = relationship("Plato", back_populates="categoria")


class Ingrediente(Base):
    __tablename__ = "ingredientes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    stock = Column(Integer, default=0)
    disponible = Column(Boolean, default=True)
    precio_extra = Column(DECIMAL(10, 2), default=0.00)

    plato_ingredientes = relationship("PlatoIngrediente", back_populates="ingrediente")


class Plato(Base):
    __tablename__ = "platos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text)
    precio_base = Column(DECIMAL(10, 2), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=False)
    disponible = Column(Boolean, default=True)
    destacado = Column(Boolean, default=False)
    imagen_url = Column(String(500))

    categoria = relationship("Categoria", back_populates="platos")
    plato_ingredientes = relationship("PlatoIngrediente", back_populates="plato")
    detalle_pedidos = relationship("DetallePedido", back_populates="plato")


class PlatoIngrediente(Base):
    __tablename__ = "plato_ingredientes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plato_id = Column(Integer, ForeignKey("platos.id", ondelete="CASCADE"), nullable=False)
    ingrediente_id = Column(Integer, ForeignKey("ingredientes.id"), nullable=False)
    es_default = Column(Boolean, default=True)
    es_extra = Column(Boolean, default=False)
    es_removible = Column(Boolean, default=False)
    cantidad_default = Column(Integer, default=1)

    plato = relationship("Plato", back_populates="plato_ingredientes")
    ingrediente = relationship("Ingrediente", back_populates="plato_ingredientes")


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mesa_id = Column(Integer, ForeignKey("mesas.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    estado = Column(SQLEnum(EstadoPedido), default=EstadoPedido.pendiente)
    total = Column(DECIMAL(10, 2), default=0.00)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    mesa = relationship("Mesa", back_populates="pedidos")
    usuario = relationship("Usuario", back_populates="pedidos")
    detalles = relationship("DetallePedido", back_populates="pedido", cascade="all, delete-orphan")


class DetallePedido(Base):
    __tablename__ = "detalle_pedidos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    plato_id = Column(Integer, ForeignKey("platos.id", ondelete="SET NULL"), nullable=True)
    cantidad = Column(Integer, default=1)
    precio_unitario = Column(DECIMAL(10, 2), nullable=False)
    subtotal = Column(DECIMAL(10, 2), nullable=False)
    nota = Column(String(255), nullable=True)

    pedido = relationship("Pedido", back_populates="detalles")
    plato = relationship("Plato", back_populates="detalle_pedidos")
    personalizaciones = relationship("Personalizacion", back_populates="detalle_pedido", cascade="all, delete-orphan")


class Personalizacion(Base):
    __tablename__ = "personalizaciones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    detalle_pedido_id = Column(Integer, ForeignKey("detalle_pedidos.id", ondelete="CASCADE"), nullable=False)
    ingrediente_id = Column(Integer, ForeignKey("ingredientes.id"), nullable=False)
    accion = Column(SQLEnum(AccionPersonalizacion), nullable=False)
    cantidad = Column(Integer, default=1)
    precio_adicional = Column(DECIMAL(10, 2), default=0.00)

    detalle_pedido = relationship("DetallePedido", back_populates="personalizaciones")
    ingrediente = relationship("Ingrediente")


class Solicitud(Base):
    __tablename__ = "solicitudes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mesa_id = Column(Integer, ForeignKey("mesas.id"), nullable=False)
    tipo = Column(String(20), nullable=False)
    atendida = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    mesa = relationship("Mesa")
