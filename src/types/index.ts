export interface Empresa {
  id: string;
  nombre: string;
  rut_identificador?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  logo_url?: string;
  moneda: string;
  iva_porcentaje: number;
}

export interface Categoria {
  id: string;
  empresa_id?: string;
  nombre: string;
  icono?: string;
  color?: string;
  created_at?: string;
}

export interface Producto {
  id: string;
  empresa_id?: string;
  categoria_id?: string;
  categoria_nombre?: string;
  sku: number;
  codigo_barras?: string;
  nombre: string;
  descripcion?: string;
  precio_compra: number;
  precio_venta: number;
  margen_porcentaje?: number;
  stock_actual: number;
  stock_minimo: number;
  unidad_medida: string;
  imagen_url?: string;
  fecha_elaboracion?: string;
  fecha_vencimiento?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Cliente {
  id: string;
  empresa_id?: string;
  rut_identificador?: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  total_comprado?: number;
  created_at?: string;
}

export interface Proveedor {
  id: string;
  empresa_id?: string;
  rut_identificador?: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  created_at?: string;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  empresa_id?: string;
  numero_folio: number;
  cliente_id?: string;
  cliente_nombre?: string;
  cliente_rut?: string;
  subtotal: number;
  impuesto: number;
  total: number;
  metodo_pago: 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA' | 'OTRO';
  monto_recibido?: number;
  vuelto?: number;
  estado: 'COMPLETADA' | 'ANULADA';
  observaciones?: string;
  created_at: string;
  detalles?: DetalleVenta[];
}

export interface DetalleVenta {
  id?: string;
  venta_id?: string;
  producto_id: string;
  producto_nombre?: string;
  cantidad: number;
  precio_unitario: number;
  costo_unitario: number;
  subtotal: number;
}

export interface MovimientoInventario {
  id: string;
  empresa_id?: string;
  producto_id: string;
  producto_nombre?: string;
  sku?: number;
  tipo_movimiento: 'ENTRADA_COMPRA' | 'SALIDA_VENTA' | 'DEVOLUCION_CLIENTE' | 'DEVOLUCION_PROVEEDOR' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'MERMA_DANADO';
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo?: string;
  referencia_id?: string;
  created_at: string;
}
