import { NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso";

export async function GET() {
  try {
    const client = getTursoClient();
    const result = await client.execute("SELECT * FROM categorias ORDER BY nombre ASC");
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, icono, color } = body;
    const id = "cat_" + Date.now();
    const client = getTursoClient();

    await client.execute({
      sql: "INSERT INTO categorias (id, empresa_id, nombre, icono, color) VALUES (?, 'emp_default', ?, ?, ?)",
      args: [id, nombre, icono || "Package", color || "#3B82F6"]
    });

    return NextResponse.json({ success: true, data: { id, nombre, icono, color } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
