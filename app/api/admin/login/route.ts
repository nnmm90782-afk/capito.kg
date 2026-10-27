import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// ─── Hardcoded admin credentials ───────────────────────────────────────────
const ADMIN_EMAIL    = "nnmm90782@gmail.com";
const ADMIN_PASSWORD = "nur_1005";

// Cookie name used to mark an authenticated admin session
export const ADMIN_COOKIE = "admin_session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body as { email?: string; password?: string };

  if (
    typeof email    === "string" &&
    typeof password === "string" &&
    email.trim().toLowerCase() === ADMIN_EMAIL &&
    password === ADMIN_PASSWORD
  ) {
    // Set a simple session cookie (HttpOnly, SameSite=Lax)
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // Expire after 8 hours
      maxAge: 60 * 60 * 8,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
