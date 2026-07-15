-- ============================================
-- SISTEMA DE PEDIDOS PARA RESTAURANTE
-- MySQL - Tercera Forma Normal (3FN)
-- ============================================

CREATE DATABASE IF NOT EXISTS nexora;
USE nexora;

-- 1. ROLES
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. USUARIOS
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. MESAS
CREATE TABLE mesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(10) NOT NULL UNIQUE,
    token_qr VARCHAR(64) NOT NULL UNIQUE,
    estado ENUM('libre', 'ocupada') DEFAULT 'libre'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. CATEGORIAS
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. INGREDIENTES
CREATE TABLE ingredientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    stock INT DEFAULT 0,
    disponible TINYINT(1) DEFAULT 1,
    precio_extra DECIMAL(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. PLATOS
CREATE TABLE platos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2) NOT NULL,
    categoria_id INT NOT NULL,
    disponible TINYINT(1) DEFAULT 1,
    destacado TINYINT(1) DEFAULT 0,
    imagen_url VARCHAR(500),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. PLATO_INGREDIENTES (relacion N:M con atributos)
CREATE TABLE plato_ingredientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plato_id INT NOT NULL,
    ingrediente_id INT NOT NULL,
    es_default TINYINT(1) DEFAULT 1,
    es_extra TINYINT(1) DEFAULT 0,
    es_removible TINYINT(1) DEFAULT 0,
    cantidad_default INT DEFAULT 1,
    FOREIGN KEY (plato_id) REFERENCES platos(id) ON DELETE CASCADE,
    FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. PEDIDOS
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mesa_id INT NOT NULL,
    usuario_id INT,
    estado ENUM('pendiente','confirmado','en_preparacion','listo','entregado','cancelado')
        DEFAULT 'pendiente',
    total DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mesa_id) REFERENCES mesas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. DETALLE_PEDIDOS
CREATE TABLE detalle_pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    plato_id INT DEFAULT NULL,
    cantidad INT DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    nota VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (plato_id) REFERENCES platos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. PERSONALIZACIONES
CREATE TABLE personalizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    detalle_pedido_id INT NOT NULL,
    ingrediente_id INT NOT NULL,
    accion ENUM('agregar', 'quitar') NOT NULL,
    cantidad INT DEFAULT 1,
    precio_adicional DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (detalle_pedido_id) REFERENCES detalle_pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. SOLICITUDES (llamar mesero, pedir cuenta)
CREATE TABLE solicitudes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mesa_id INT NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    atendida TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mesa_id) REFERENCES mesas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- DATOS SEMILLA
-- ============================================

INSERT INTO roles (nombre) VALUES ('admin'), ('mozo');

INSERT INTO categorias (nombre, descripcion) VALUES
('Entradas', 'Platos para comenzar'),
('Platos Fuertes', 'Platos principales'),
('Bebidas', 'Bebidas frias y calientes'),
('Postres', 'Dulces y postres');

INSERT INTO mesas (numero, token_qr) VALUES
('M1', UUID()),
('M2', UUID()),
('M3', UUID()),
('M4', UUID()),
('M5', UUID());

INSERT INTO ingredientes (nombre, stock, precio_extra) VALUES
('Queso extra', 50, 2000.00),
('Tocineta', 30, 3000.00),
('Aguacate', 20, 2500.00),
('Pan', 100, 0.00),
('Carne de res', 60, 0.00),
('Pollo', 50, 0.00),
('Lechuga', 40, 0.00),
('Tomate', 40, 0.00),
('Cebolla', 35, 0.00),
('Salsa de tomate', 25, 0.00),
('Pasta', 60, 0.00),
('Huevo', 80, 0.00),
('Azucar', 100, 0.00),
('Cafe', 50, 0.00),
('Helado de vainilla', 20, 0.00),
('Brownie', 15, 0.00);

INSERT INTO platos (nombre, descripcion, precio_base, categoria_id, disponible) VALUES
('Hamburguesa Clasica', 'Carne de res, lechuga, tomate, cebolla', 15000.00, 2, 1),
('Sandwich de Pollo', 'Pollo, lechuga, tomate, pan artesanal', 13000.00, 2, 1),
('Pasta Alfredo', 'Pasta con salsa cremosa y pollo', 18000.00, 2, 1),
('Ensalada Cesar', 'Lechuga, pollo, crutones, aderezo', 12000.00, 1, 1),
('Cafe Americano', 'Cafe negro tradicional', 4000.00, 3, 1),
('Brownie con Helado', 'Brownie caliente con helado de vainilla', 10000.00, 4, 1);
