import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || "libsql://nexus-akum.aws-us-east-1.turso.io";
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const client = createClient({ url, authToken });

async function seed() {
  console.log("Iniciando migración y siembra en Turso:", url);

  const demoItems = [
    { sku: 1001, nombre: "Torta Tres Leches (Porción)", costo: 1400, venta: 3500, stock: 15, min: 4, cat: "cat_pasteleria", unidad: "porción" },
    { sku: 1002, nombre: "Pie de Limón Merengue (Porción)", costo: 1100, venta: 2800, stock: 12, min: 3, cat: "cat_pasteleria", unidad: "porción" },
    { sku: 1003, nombre: "Empanada de Pino al Horno", costo: 1200, venta: 2600, stock: 24, min: 5, cat: "cat_pasteleria", unidad: "unidad" },
    { sku: 1004, nombre: "Bebida Coca Cola 1.5L Original", costo: 1300, venta: 2100, stock: 30, min: 8, cat: "cat_bebidas", unidad: "botella" },
    { sku: 1005, nombre: "Jugo Néctar Andina 1.5L Durazno", costo: 1050, venta: 1750, stock: 20, min: 6, cat: "cat_bebidas", unidad: "botella" },
    { sku: 1006, nombre: "Leche Entera Colun 1L Tetra", costo: 850, venta: 1290, stock: 40, min: 10, cat: "cat_lacteos", unidad: "unidad" },
    { sku: 1007, nombre: "Queso Gauda Laminado 250g", costo: 1900, venta: 2890, stock: 18, min: 4, cat: "cat_lacteos", unidad: "unidad" },
    { sku: 1008, nombre: "Papas Fritas Lays 250g", costo: 1500, venta: 2490, stock: 25, min: 5, cat: "cat_snacks", unidad: "unidad" },
    { sku: 1009, nombre: "Aceite Vegetal Belmont 900ml", costo: 1450, venta: 2190, stock: 35, min: 10, cat: "cat_abarrotes", unidad: "botella" },
    { sku: 1010, nombre: "Detergente Omo Polvo 800g", costo: 1800, venta: 2790, stock: 14, min: 4, cat: "cat_limpieza", unidad: "unidad" }
  ];

  for (const item of demoItems) {
    const id = `prod_${item.sku}`;
    await client.execute({
      sql: `
        INSERT INTO productos (
          id, empresa_id, categoria_id, sku, codigo_barras, nombre, precio_compra, precio_venta, stock_actual, stock_minimo, unidad_medida
        ) VALUES (?, 'emp_default', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(codigo_barras) DO UPDATE SET
          nombre = excluded.nombre,
          precio_compra = excluded.precio_compra,
          precio_venta = excluded.precio_venta,
          stock_actual = excluded.stock_actual
      `,
      args: [id, item.cat, item.sku, item.sku.toString(), item.nombre, item.costo, item.venta, item.stock, item.min, item.unidad]
    });
  }

  console.log("✅ Productos sembrados correctamente en Turso.");
}

seed().catch(console.error);
