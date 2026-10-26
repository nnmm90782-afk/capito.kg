import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const rows = await query<{
      id: string;
      user_name: string;
      rating: number;
      text: string | null;
    }>(`
      SELECT
        r.id, r.rating, r.text,
        COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), 'Гость') AS user_name
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.status = 'PUBLISHED'
      ORDER BY r.created_at DESC
      LIMIT 6
    `);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([]);
  }
}
