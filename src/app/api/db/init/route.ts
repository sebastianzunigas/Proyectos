import { NextResponse } from "next/server";
import { getTursoClient } from "@/lib/turso";
import { initDatabase } from "@/lib/schema";

export async function POST() {
  try {
    const client = getTursoClient();
    await initDatabase(client);
    return NextResponse.json({
      success: true,
      message: "Base de datos Turso inicializada exitosamente con todas sus tablas y categorías base."
    });
  } catch (error: any) {
    console.error("Error al inicializar Turso:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al inicializar la base de datos" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = getTursoClient();
    const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    return NextResponse.json({
      success: true,
      tables: result.rows.map(r => r.name)
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
