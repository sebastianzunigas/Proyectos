import { Client } from "@libsql/client";

export const SCHEMA_SQL = `
-- 1. Tabla de Empresas (Configuración General)
CREATE TABLE IF NOT EXISTS empresas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    rut_identificador TEXT,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    logo_url TEXT,
    moneda TEXT DEFAULT 'CLP',
    iva_porcentaje REAL DEFAULT 19.0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Categorías
CREATE TABLE IF NOT EXISTS categorias (
    id TEXT PRIMARY KEY,
    empresa_id TEXT DEFAULT 'emp_default',
    nombre TEXT NOT NULL,
    icono TEXT DEFAULT 'Package',
    color TEXT DEFAULT '#3B82F6',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT DEFAULT 'emp_default',
    categoria_id TEXT,
    sku INTEGER UNIQUE,
    codigo_barras TEXT UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_compra REAL DEFAULT 0,
    precio_venta REAL NOT NULL,
    stock_actual REAL DEFAULT 0,
    stock_minimo REAL DEFAULT 5,
    unidad_medida TEXT DEFAULT 'unidad',
    imagen_url TEXT,
    fecha_elaboracion TEXT,
    fecha_vencimiento TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Clientes (CRM)
CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT DEFAULT 'emp_default',
    rut_identificador TEXT,
    nombre TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion TEXT,
    total_comprado REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id TEXT PRIMARY KEY,
    empresa_id TEXT DEFAULT 'emp_default',
    rut_identificador TEXT,
    nombre TEXT NOT NULL,
    contacto TEXT,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT DEFAULT 'emp_default',
    numero_folio INTEGER,
    cliente_id TEXT,
    subtotal REAL NOT NULL,
    impuesto REAL NOT NULL,
    total REAL NOT NULL,
    metodo_pago TEXT NOT NULL,
    monto_recibido REAL,
    vuelto REAL DEFAULT 0,
    estado TEXT DEFAULT 'COMPLETADA',
    observaciones TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 7. Detalle de Ventas
CREATE TABLE IF NOT EXISTS detalle_ventas (
    id TEXT PRIMARY KEY,
    venta_id TEXT NOT NULL,
    producto_id TEXT NOT NULL,
    cantidad REAL NOT NULL,
    precio_unitario REAL NOT NULL,
    costo_unitario REAL DEFAULT 0,
    subtotal REAL NOT NULL,
    FOREIGN KEY(venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);

-- 8. Movimientos de Inventario (Kardex)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id TEXT PRIMARY KEY,
    empresa_id TEXT DEFAULT 'emp_default',
    producto_id TEXT NOT NULL,
    tipo_movimiento TEXT NOT NULL,
    cantidad REAL NOT NULL,
    stock_anterior REAL NOT NULL,
    stock_nuevo REAL NOT NULL,
    motivo TEXT,
    referencia_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Índices de búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos(sku);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_ventas_folio ON ventas(numero_folio);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(created_at);
CREATE INDEX IF NOT EXISTS idx_kardex_producto ON movimientos_inventario(producto_id);
`;

export async function initDatabase(client: Client) {
  const statements = SCHEMA_SQL
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    await client.execute(stmt);
  }

  // Insertar empresa inicial por defecto si no existe
  await client.execute({
    sql: `
      INSERT OR IGNORE INTO empresas (id, nombre, rut_identificador, telefono, email, direccion, moneda, iva_porcentaje)
      VALUES ('emp_default', 'Mi Negocio Nexus', '76.123.456-7', '+56 9 1234 5678', 'contacto@minegocio.cl', 'Av. Principal #123', 'CLP', 19.0)
    `,
    args: []
  });

  // Insertar categorías base por defecto
  const categoriasBase = [
    { id: 'cat_abarrotes', nombre: 'Abarrotes', icono: 'ShoppingBag', color: '#F59E0B' },
    { id: 'cat_bebidas', nombre: 'Bebidas & Licores', icono: 'Coffee', color: '#3B82F6' },
    { id: 'cat_lacteos', nombre: 'Lácteos & Quesos', icono: 'Milk', color: '#10B981' },
    { id: 'cat_pasteleria', nombre: 'Pastelería & Panadería', icono: 'Cake', color: '#EC4899' },
    { id: 'cat_snacks', nombre: 'Snacks & Golosinas', icono: 'Cookie', color: '#8B5CF6' },
    { id: 'cat_limpieza', nombre: 'Limpieza & Hogar', icono: 'Sparkles', color: '#06B6D4' },
    { id: 'cat_mascotas', nombre: 'Mascotas', icono: 'Heart', color: '#EF4444' },
  ];

  for (const cat of categoriasBase) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO categorias (id, empresa_id, nombre, icono, color) VALUES (?, 'emp_default', ?, ?, ?)`,
      args: [cat.id, cat.nombre, cat.icono, cat.color]
    });
  }
}
