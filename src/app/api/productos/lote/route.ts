import { NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productos, porcentajeAjuste } = body;
    const client = getTursoClient();

    // Caso 1: Ajuste Masivo de Precios (%)
    if (typeof porcentajeAjuste === "number") {
      const factor = 1 + (porcentajeAjuste / 100);
      await client.execute({
        sql: `
          UPDATE productos 
          SET precio_venta = ROUND(precio_venta * ?),
              updated_at = CURRENT_TIMESTAMP
        `,
        args: [factor]
      });
      return NextResponse.json({ success: true, message: `Precios ajustados en un ${porcentajeAjuste}%` });
    }

    // Caso 2: Carga Masiva de Productos (Array)
    if (!Array.isArray(productos) || productos.length === 0) {
      return NextResponse.json({ success: false, error: "Array de productos requerido" }, { status: 400 });
    }

    const maxSkuRes = await client.execute("SELECT MAX(sku) as max_sku FROM productos");
    let currentSku = ((maxSkuRes.rows[0]?.max_sku as number) || 1000) + 1;

    let insertados = 0;
    for (const p of productos) {
      const id = p.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const sku = Number(p.sku) || currentSku++;
      const codigo = p.codigo_barras ? String(p.codigo_barras).trim() : String(sku);
      const precioCompra = Number(p.precio_compra) || 0;
      const precioVenta = Number(p.precio_venta) || Math.round(precioCompra * 1.4);
      const stock = Number(p.stock_actual) || 0;
      const stockMin = Number(p.stock_minimo) || 5;

      await client.execute({
        sql: `
          INSERT INTO productos (
            id, empresa_id, categoria_id, sku, codigo_barras, nombre, descripcion,
            precio_compra, precio_venta, stock_actual, stock_minimo, unidad_medida,
            fecha_elaboracion, fecha_vencimiento
          ) VALUES (?, 'emp_default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(codigo_barras) DO UPDATE SET
            nombre = excluded.nombre,
            precio_compra = excluded.precio_compra,
            precio_venta = excluded.precio_venta,
            stock_actual = excluded.stock_actual,
            updated_at = CURRENT_TIMESTAMP
        `,
        args: [
          id,
          p.categoria_id || "cat_abarrotes",
          sku,
          codigo,
          p.nombre || "Producto sin nombre",
          p.descripcion || "",
          precioCompra,
          precioVenta,
          stock,
          stockMin,
          p.unidad_medida || "unidad",
          p.fecha_elaboracion || null,
          p.fecha_vencimiento || null
        ]
      });
      insertados++;
    }

    return NextResponse.json({
      success: true,
      message: `${insertados} productos procesados con éxito.`
    });
  } catch (error: any) {
    console.error("Error en lote:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
