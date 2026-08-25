import { NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso";

export async function GET() {
  try {
    const client = getTursoClient();
    const result = await client.execute("SELECT * FROM clientes ORDER BY nombre ASC");
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const client = getTursoClient();
    const id = body.id || `cli_${Date.now()}`;

    await client.execute({
      sql: `
        INSERT INTO clientes (id, empresa_id, rut_identificador, nombre, email, telefono, direccion, total_comprado)
        VALUES (?, 'emp_default', ?, ?, ?, ?, ?, 0)
      `,
      args: [
        id,
        body.rut_identificador || "",
        body.nombre,
        body.email || "",
        body.telefono || "",
        body.direccion || ""
      ]
    });

    return NextResponse.json({ success: true, data: { id, ...body } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });

    const client = getTursoClient();
    await client.execute({ sql: "DELETE FROM clientes WHERE id = ?", args: [id] });
    return NextResponse.json({ success: true, message: "Cliente eliminado" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
