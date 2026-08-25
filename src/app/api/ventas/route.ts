import { NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 50;
    const client = getTursoClient();

    const ventasRes = await client.execute({
      sql: `
        SELECT v.*, c.nombre as cliente_nombre, c.rut_identificador as cliente_rut
        FROM ventas v
        LEFT JOIN clientes c ON v.cliente_id = c.id
        ORDER BY v.numero_folio DESC
        LIMIT ?
      `,
      args: [limit]
    });

    const ventas = ventasRes.rows;

    // Obtener detalles para cada venta
    const ventasConDetalle = await Promise.all(
      ventas.map(async (v) => {
        const detRes = await client.execute({
          sql: `
            SELECT d.*, p.nombre as producto_nombre, p.sku
            FROM detalle_ventas d
            LEFT JOIN productos p ON d.producto_id = p.id
            WHERE d.venta_id = ?
          `,
          args: [v.id]
        });
        return {
          ...v,
          detalles: detRes.rows
        };
      })
    );

    return NextResponse.json({ success: true, data: ventasConDetalle });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, cliente_id, metodo_pago, monto_recibido, vuelto, observaciones } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "El carrito está vacío" }, { status: 400 });
    }

    const client = getTursoClient();

    // 1. Obtener siguiente número de folio
    const folioRes = await client.execute("SELECT MAX(numero_folio) as max_folio FROM ventas");
    const nextFolio = ((folioRes.rows[0]?.max_folio as number) || 100) + 1;
    const ventaId = `vta_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // 2. Calcular totales
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.cantidad * item.precio_unitario;
    }
    const ivaPorcentaje = 0.19;
    const impuesto = Math.round(subtotal * (ivaPorcentaje / (1 + ivaPorcentaje)));
    const total = subtotal;

    // 3. Insertar Venta
    await client.execute({
      sql: `
        INSERT INTO ventas (
          id, empresa_id, numero_folio, cliente_id, subtotal, impuesto, total,
          metodo_pago, monto_recibido, vuelto, estado, observaciones
        ) VALUES (?, 'emp_default', ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETADA', ?)
      `,
      args: [
        ventaId,
        nextFolio,
        cliente_id || null,
        subtotal,
        impuesto,
        total,
        metodo_pago || 'EFECTIVO',
        monto_recibido || total,
        vuelto || 0,
        observaciones || null
      ]
    });

    // 4. Insertar Detalle, Descontar Stock y Registrar Kardex
    for (const item of items) {
      const detalleId = `det_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const prodRes = await client.execute({
        sql: "SELECT stock_actual, precio_compra, nombre FROM productos WHERE id = ?",
        args: [item.producto_id]
      });

      const prod = prodRes.rows[0];
      const stockAnterior = (prod?.stock_actual as number) || 0;
      const costoUnitario = (prod?.precio_compra as number) || 0;
      const stockNuevo = Math.max(0, stockAnterior - item.cantidad);

      // Detalle
      await client.execute({
        sql: `
          INSERT INTO detalle_ventas (id, venta_id, producto_id, cantidad, precio_unitario, costo_unitario, subtotal)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          detalleId,
          ventaId,
          item.producto_id,
          item.cantidad,
          item.precio_unitario,
          costoUnitario,
          item.cantidad * item.precio_unitario
        ]
      });

      // Descontar Stock
      await client.execute({
        sql: "UPDATE productos SET stock_actual = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [stockNuevo, item.producto_id]
      });

      // Registrar Kardex
      await client.execute({
        sql: `
          INSERT INTO movimientos_inventario (
            id, empresa_id, producto_id, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, motivo, referencia_id
          ) VALUES (?, 'emp_default', ?, 'SALIDA_VENTA', ?, ?, ?, ?, ?)
        `,
        args: [
          `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          item.producto_id,
          item.cantidad,
          stockAnterior,
          stockNuevo,
          `Venta Folio #${nextFolio}`,
          ventaId
        ]
      });
    }

    // 5. Si hay cliente, acumular total_comprado
    if (cliente_id) {
      await client.execute({
        sql: "UPDATE clientes SET total_comprado = COALESCE(total_comprado, 0) + ? WHERE id = ?",
        args: [total, cliente_id]
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: ventaId,
        numero_folio: nextFolio,
        subtotal,
        impuesto,
        total,
        metodo_pago,
        monto_recibido,
        vuelto
      }
    });
  } catch (error: any) {
    console.error("Error procesando venta:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
