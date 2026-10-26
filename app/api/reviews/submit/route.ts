import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userEmail = "",
      userName  = "",
      text      = "",
      rating    = 5,
      branchSlug = "",
    } = body as Record<string, string | number>;

    const emailStr = String(userEmail).trim().toLowerCase();
    const textStr  = String(text).trim();
    const ratingNum = Number(rating);

    if (!emailStr || !textStr || textStr.length < 5) {
      return NextResponse.json({ ok: false, error: "Заполните email и текст (минимум 5 символов)" }, { status: 400 });
    }
    if (ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ ok: false, error: "Оценка 1–5" }, { status: 400 });
    }

    // Find or create user
    let userId: string;
    const existingUser = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [emailStr]
    );
    if (existingUser.rowCount && existingUser.rowCount > 0) {
      userId = existingUser.rows[0].id;
    } else {
      const parts = String(userName).trim().split(/\s+/);
      const newUser = await pool.query<{ id: string }>(
        `INSERT INTO users (email, first_name, last_name, status)
         VALUES ($1, $2, $3, 'ACTIVE') RETURNING id`,
        [emailStr, parts[0] ?? "Гость", parts.slice(1).join(" ") || null]
      );
      userId = newUser.rows[0].id;
    }

    // Find branch
    let branchId: string | null = null;
    if (branchSlug) {
      const br = await pool.query<{ id: string }>(
        "SELECT id FROM branches WHERE slug = $1 LIMIT 1",
        [String(branchSlug)]
      );
      if (br.rowCount && br.rowCount > 0) branchId = br.rows[0].id;
    }
    if (!branchId) {
      const br = await pool.query<{ id: string }>("SELECT id FROM branches ORDER BY name LIMIT 1");
      if (br.rowCount && br.rowCount > 0) branchId = br.rows[0].id;
    }
    if (!branchId) {
      return NextResponse.json({ ok: false, error: "Филиал не найден" }, { status: 500 });
    }

    await pool.query(
      `INSERT INTO reviews (user_id, branch_id, rating, text, status)
       VALUES ($1, $2, $3, $4, 'PENDING')`,
      [userId, branchId, ratingNum, textStr]
    );

    revalidatePath("/");
    revalidatePath("/reviews");
    revalidatePath("/admin/reviews");
    revalidatePath("/api/reviews");

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[POST /api/reviews/submit]", msg);
    return NextResponse.json({ ok: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
