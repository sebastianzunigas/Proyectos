import { NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 100;
    const productoId = searchParams.get("producto_id");
    const client = getTursoClient();

    let sql = `
      SELECT m.*, p.nombre as producto_nombre, p.sku, p.codigo_barras
      FROM movimientos_inventario m
      LEFT JOIN productos p ON m.producto_id = p.id
      WHERE 1=1
    `;
    const args: any[] = [];

    if (productoId) {
      sql += " AND m.producto_id = ?";
      args.push(productoId);
    }

    sql += " ORDER BY m.created_at DESC LIMIT ?";
    args.push(limit);

    const result = await client.execute({ sql, args });
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { producto_id, tipo_movimiento, cantidad, motivo } = body;

    if (!producto_id || !tipo_movimiento || typeof cantidad !== "number") {
      return NextResponse.json({ success: false, error: "Datos incompletos para el movimiento" }, { status: 400 });
    }

    const client = getTursoClient();

    // Obtener stock actual
    const prodRes = await client.execute({
      sql: "SELECT stock_actual, nombre FROM productos WHERE id = ?",
      args: [producto_id]
    });

    if (prodRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Producto no encontrado" }, { status: 404 });
    }

    const stockAnterior = (prodRes.rows[0].stock_actual as number) || 0;
    let stockNuevo = stockAnterior;

    if (["ENTRADA_COMPRA", "AJUSTE_POSITIVO", "DEVOLUCION_CLIENTE"].includes(tipo_movimiento)) {
      stockNuevo = stockAnterior + cantidad;
    } else {
      stockNuevo = Math.max(0, stockAnterior - cantidad);
    }

    // Actualizar producto
    await client.execute({
      sql: "UPDATE productos SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [stockNuevo, producto_id]
    });

    // Registrar en Kardex
    const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await client.execute({
      sql: `
        INSERT INTO movimientos_inventario (
          id, empresa_id, producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo
        ) VALUES (?, 'emp_default', ?, ?, ?, ?, ?, ?)
      `,
      args: [
        movId,
        producto_id,
        tipo_movimiento,
        cantidad,
        stockAnterior,
        stockNuevo,
        motivo || `Ajuste manual: ${tipo_movimiento}`
      ]
    });

    return NextResponse.json({
      success: true,
      data: {
        id: movId,
        producto_id,
        stock_anterior: stockAnterior,
        stock_nuevo: stockNuevo,
        cantidad
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
