import { NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso";

export async function GET() {
  try {
    const client = getTursoClient();
    const result = await client.execute("SELECT * FROM empresas WHERE id = 'emp_default'");
    return NextResponse.json({ success: true, data: result.rows[0] || {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const client = getTursoClient();

    await client.execute({
      sql: `
        UPDATE empresas SET
          nombre = ?,
          rut_identificador = ?,
          telefono = ?,
          email = ?,
          direccion = ?,
          moneda = ?,
          iva_porcentaje = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 'emp_default'
      `,
      args: [
        body.nombre || "Mi Empresa",
        body.rut_identificador || "",
        body.telefono || "",
        body.email || "",
        body.direccion || "",
        body.moneda || "CLP",
        Number(body.iva_porcentaje) || 19.0
      ]
    });

    return NextResponse.json({ success: true, message: "Datos de empresa actualizados" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Vaciar catálogo o resetear datos
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const client = getTursoClient();

    if (action === "reset_todo") {
      await client.execute("DELETE FROM detalle_ventas");
      await client.execute("DELETE FROM ventas");
      await client.execute("DELETE FROM movimientos_inventario");
      await client.execute("DELETE FROM productos");
      await client.execute("DELETE FROM clientes");
      return NextResponse.json({ success: true, message: "Todos los datos han sido reseteados correctamente." });
    }

    if (action === "solo_productos") {
      await client.execute("DELETE FROM detalle_ventas");
      await client.execute("DELETE FROM movimientos_inventario");
      await client.execute("DELETE FROM productos");
      return NextResponse.json({ success: true, message: "Catálogo de productos e inventario vaciados." });
    }

    return NextResponse.json({ success: false, error: "Acción no especificada" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
