import { NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso";

export async function GET() {
  try {
    const client = getTursoClient();

    // 1. Resumen general (KPIs)
    const kpiRes = await client.execute(`
      SELECT 
        COUNT(id) as total_ventas,
        COALESCE(SUM(total), 0) as ingresos_totales,
        COALESCE(AVG(total), 0) as ticket_promedio
      FROM ventas
      WHERE estado = 'COMPLETADA'
    `);

    // 2. Ventas del día de hoy
    const todayRes = await client.execute(`
      SELECT 
        COUNT(id) as ventas_hoy,
        COALESCE(SUM(total), 0) as ingresos_hoy
      FROM ventas
      WHERE DATE(created_at) = DATE('now') AND estado = 'COMPLETADA'
    `);

    // 3. Productos con stock crítico
    const stockBajoRes = await client.execute(`
      SELECT id, nombre, sku, stock_actual, stock_minimo, precio_venta
      FROM productos
      WHERE stock_actual <= stock_minimo
      ORDER BY stock_actual ASC
      LIMIT 10
    `);

    // 4. Distribución de ventas por hora (Horarios punta)
    const horasRes = await client.execute(`
      SELECT 
        strftime('%H:00', created_at) as hora,
        COUNT(id) as cantidad_ventas,
        COALESCE(SUM(total), 0) as total_monto
      FROM ventas
      WHERE estado = 'COMPLETADA'
      GROUP BY hora
      ORDER BY hora ASC
    `);

    // 5. Top 10 Productos más vendidos
    const topProdRes = await client.execute(`
      SELECT 
        p.id, p.nombre, p.sku,
        SUM(d.cantidad) as total_unidades,
        SUM(d.subtotal) as total_dinero
      FROM detalle_ventas d
      JOIN productos p ON d.producto_id = p.id
      JOIN ventas v ON d.venta_id = v.id
      WHERE v.estado = 'COMPLETADA'
      GROUP BY p.id
      ORDER BY total_unidades DESC
      LIMIT 10
    `);

    // 6. Ventas por método de pago
    const pagosRes = await client.execute(`
      SELECT metodo_pago, COUNT(id) as transacciones, SUM(total) as monto
      FROM ventas
      WHERE estado = 'COMPLETADA'
      GROUP BY metodo_pago
    `);

    return NextResponse.json({
      success: true,
      data: {
        kpis: kpiRes.rows[0] || {},
        hoy: todayRes.rows[0] || {},
        stock_bajo: stockBajoRes.rows || [],
        horas: horasRes.rows || [],
        top_productos: topProdRes.rows || [],
        metodos_pago: pagosRes.rows || []
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
