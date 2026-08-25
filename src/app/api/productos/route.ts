import { NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const categoria = searchParams.get("categoria");
    const client = getTursoClient();

    let sql = `
      SELECT p.*, c.nombre as categoria_nombre, c.color as categoria_color
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE 1=1
    `;
    const args: any[] = [];

    if (categoria) {
      sql += " AND p.categoria_id = ?";
      args.push(categoria);
    }

    if (search) {
      sql += " AND (p.nombre LIKE ? OR p.codigo_barras LIKE ? OR CAST(p.sku AS TEXT) LIKE ?)";
      const pattern = `%${search}%`;
      args.push(pattern, pattern, pattern);
    }

    sql += " ORDER BY p.sku ASC";

    const result = await client.execute({ sql, args });
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const client = getTursoClient();

    // Generar SKU si no viene
    let sku = body.sku;
    if (!sku) {
      const maxSkuRes = await client.execute("SELECT MAX(sku) as max_sku FROM productos");
      const maxSku = (maxSkuRes.rows[0]?.max_sku as number) || 1000;
      sku = maxSku + 1;
    }

    const id = body.id || `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const codigo_barras = body.codigo_barras ? body.codigo_barras.trim() : sku.toString();

    await client.execute({
      sql: `
        INSERT INTO productos (
          id, empresa_id, categoria_id, sku, codigo_barras, nombre, descripcion,
          precio_compra, precio_venta, stock_actual, stock_minimo, unidad_medida,
          imagen_url, fecha_elaboracion, fecha_vencimiento
        ) VALUES (?, 'emp_default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        body.categoria_id || null,
        sku,
        codigo_barras,
        body.nombre,
        body.descripcion || "",
        Number(body.precio_compra) || 0,
        Number(body.precio_venta) || 0,
        Number(body.stock_actual) || 0,
        Number(body.stock_minimo) || 5,
        body.unidad_medida || "unidad",
        body.imagen_url || null,
        body.fecha_elaboracion || null,
        body.fecha_vencimiento || null
      ]
    });

    // Registrar en Kardex movimiento inicial si hay stock
    if (Number(body.stock_actual) > 0) {
      await client.execute({
        sql: `
          INSERT INTO movimientos_inventario (id, empresa_id, producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo)
          VALUES (?, 'emp_default', ?, 'ENTRADA_COMPRA', ?, 0, ?, 'Inventario Inicial')
        `,
        args: [
          `mov_${Date.now()}`,
          id,
          Number(body.stock_actual),
          Number(body.stock_actual)
        ]
      });
    }

    return NextResponse.json({ success: true, data: { id, sku, ...body } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID de producto requerido" }, { status: 400 });
    }

    const client = getTursoClient();

    await client.execute({
      sql: `
        UPDATE productos SET
          categoria_id = ?,
          nombre = ?,
          descripcion = ?,
          precio_compra = ?,
          precio_venta = ?,
          stock_actual = ?,
          stock_minimo = ?,
          unidad_medida = ?,
          codigo_barras = ?,
          fecha_elaboracion = ?,
          fecha_vencimiento = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [
        updates.categoria_id || null,
        updates.nombre,
        updates.descripcion || "",
        Number(updates.precio_compra) || 0,
        Number(updates.precio_venta) || 0,
        Number(updates.stock_actual) || 0,
        Number(updates.stock_minimo) || 5,
        updates.unidad_medida || "unidad",
        updates.codigo_barras || "",
        updates.fecha_elaboracion || null,
        updates.fecha_vencimiento || null,
        id
      ]
    });

    return NextResponse.json({ success: true, message: "Producto actualizado correctamente" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID de producto requerido" }, { status: 400 });
    }

    const client = getTursoClient();
    await client.execute({
      sql: "DELETE FROM productos WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({ success: true, message: "Producto eliminado" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
