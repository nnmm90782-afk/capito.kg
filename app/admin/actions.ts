"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";

// All actions return Promise<void> so they can be used directly as <form action>.
// Validation failures exit early with a console warning instead of a return value.

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC REVIEWS (user-facing)
// ─────────────────────────────────────────────────────────────────────────────

export async function submitReview(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const userEmail = String(formData.get("userEmail") ?? "").trim().toLowerCase();
  const userName  = String(formData.get("userName")  ?? "").trim();
  const text      = String(formData.get("text")      ?? "").trim();
  const rating    = Number(formData.get("rating")    ?? 5);
  const branchSlug = String(formData.get("branchSlug") ?? "").trim();

  if (!userEmail || !text || text.length < 5) {
    return { ok: false, error: "Заполните email и текст отзыва (минимум 5 символов)" };
  }
  if (rating < 1 || rating > 5) {
    return { ok: false, error: "Оценка должна быть от 1 до 5" };
  }

  // Find or auto-create user
  let userId: string | null = null;
  const existing = await pool.query<{ id: string }>(
    "SELECT id FROM users WHERE email = $1 LIMIT 1",
    [userEmail]
  );
  if (existing.rowCount && existing.rowCount > 0) {
    userId = existing.rows[0].id;
  } else {
    const parts = userName.split(/\s+/);
    const newUser = await pool.query<{ id: string }>(
      `INSERT INTO users (email, first_name, last_name, status)
       VALUES ($1, $2, $3, 'ACTIVE') RETURNING id`,
      [userEmail, parts[0] ?? "Гость", parts.slice(1).join(" ") || null]
    );
    userId = newUser.rows[0].id;
  }

  // Branch
  let branchId: string | null = null;
  if (branchSlug) {
    const br = await pool.query<{ id: string }>(
      "SELECT id FROM branches WHERE slug = $1 LIMIT 1",
      [branchSlug]
    );
    if (br.rowCount && br.rowCount > 0) branchId = br.rows[0].id;
  }
  // Fallback: first branch
  if (!branchId) {
    const br = await pool.query<{ id: string }>("SELECT id FROM branches LIMIT 1");
    if (br.rowCount && br.rowCount > 0) branchId = br.rows[0].id;
  }

  if (!branchId) return { ok: false, error: "Филиал не найден" };

  await pool.query(
    `INSERT INTO reviews (user_id, branch_id, rating, text, status)
     VALUES ($1, $2, $3, $4, 'PENDING')`,
    [userId, branchId, rating, text]
  );

  revalidatePath("/");
  revalidatePath("/reviews");
  revalidatePath("/admin/reviews");
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SYNC — called after Supabase signUp to mirror user into our DB
// ─────────────────────────────────────────────────────────────────────────────

export async function syncUserToDB(data: {
  email: string;
  fullName?: string;
}): Promise<void> {
  if (!data.email) return;

  const existing = await pool.query(
    "SELECT id FROM users WHERE email = $1 LIMIT 1",
    [data.email]
  );
  if (existing.rowCount && existing.rowCount > 0) return; // already synced

  const parts = (data.fullName ?? "").trim().split(/\s+/);
  const firstName = parts[0] ?? null;
  const lastName  = parts.slice(1).join(" ") || null;

  await pool.query(
    `INSERT INTO users (email, first_name, last_name, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'ACTIVE', now(), now())
     ON CONFLICT (email) DO NOTHING`,
    [data.email, firstName, lastName]
  );

  revalidatePath("/admin/users");
}

// ─────────────────────────────────────────────────────────────────────────────
// MENU / PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

export async function createProduct(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  if (!name || price < 0) return;

  const categorySlug = String(formData.get("categorySlug") ?? "coffee");
  const cat = await pool.query("SELECT id FROM categories WHERE slug = $1", [categorySlug]);
  if (cat.rowCount === 0) return;
  const categoryId = cat.rows[0].id;

  const description = String(formData.get("description") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 7);

  await pool.query(
    `INSERT INTO products (category_id, name, slug, description, price, badge, image_url, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
    [categoryId, name, slug, description, price, badge, imageUrl || null]
  );
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/");
}

export async function updateProduct(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  if (!id || !name || price < 0) return;

  const categorySlug = String(formData.get("categorySlug") ?? "coffee");
  const cat = await pool.query("SELECT id FROM categories WHERE slug = $1", [categorySlug]);
  if (cat.rowCount === 0) return;

  const description = String(formData.get("description") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  await pool.query(
    `UPDATE products
       SET name = $1, description = $2, price = $3, badge = $4, image_url = $5,
           category_id = $6, updated_at = now()
     WHERE id = $7`,
    [name, description, price, badge, imageUrl || null, cat.rows[0].id, id]
  );
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await pool.query("UPDATE products SET deleted_at = now(), is_active = false WHERE id = $1", [id]);
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/");
}

export async function toggleProductVisibility(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await pool.query("UPDATE products SET is_active = NOT is_active, updated_at = now() WHERE id = $1", [id]);
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/");
}

export async function toggleProductFeatured(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await pool.query("UPDATE products SET is_featured = NOT is_featured, updated_at = now() WHERE id = $1", [id]);
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

export async function blockUser(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await pool.query("UPDATE users SET status = 'BLOCKED', updated_at = now() WHERE id = $1", [id]);
  revalidatePath("/admin/users");
}

export async function unblockUser(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await pool.query("UPDATE users SET status = 'ACTIVE', updated_at = now() WHERE id = $1", [id]);
  revalidatePath("/admin/users");
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────────────────────────────────────

export async function updateOrderStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;

  // When order is marked COMPLETED → automatically set payment_status = PAID
  // When order is CANCELLED → set payment_status = CANCELLED
  const paymentClause =
    status === "COMPLETED" ? ", payment_status = 'PAID'"
    : status === "CANCELLED" ? ", payment_status = 'CANCELLED'"
    : "";
  const completedClause = status === "COMPLETED" ? ", completed_at = now()" : "";
  const cancelledClause = status === "CANCELLED" ? ", cancelled_at = now()" : "";

  await pool.query(
    `UPDATE orders
        SET status = $1, updated_at = now()
            ${paymentClause}
            ${completedClause}
            ${cancelledClause}
      WHERE id = $2`,
    [status, id]
  );
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC BOOKING (user-facing)
// ─────────────────────────────────────────────────────────────────────────────

export async function createBooking(formData: FormData): Promise<{ ok: boolean; error?: string; booking_number?: string }> {
  const branchId   = String(formData.get("branchId")   ?? "").trim();
  const date       = String(formData.get("date")        ?? "").trim();
  const startTime  = String(formData.get("startTime")   ?? "").trim();
  const endTime    = String(formData.get("endTime")     ?? "").trim();
  const guestCount = Number(formData.get("guestCount")  ?? 2);
  const comment    = String(formData.get("comment")     ?? "").trim();
  const userEmail  = String(formData.get("userEmail")   ?? "").trim();
  const userName   = String(formData.get("userName")    ?? "").trim();
  const userPhone  = String(formData.get("userPhone")   ?? "").trim();

  if (!branchId || !date || !startTime || guestCount < 1) {
    return { ok: false, error: "Заполните все обязательные поля" };
  }

  if (!userEmail) {
    return { ok: false, error: "Укажите email для бронирования" };
  }

  try {
    let userId: string | null = null;

    const existing = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [userEmail]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      userId = existing.rows[0].id;
      // обновить телефон если передан и ещё не заполнен
      if (userPhone) {
        await pool.query(
          "UPDATE users SET phone = COALESCE(phone, $1), updated_at = now() WHERE id = $2",
          [userPhone, userId]
        );
      }
    } else {
      const parts = userName.trim().split(" ");
      const firstName = parts[0] ?? "Гость";
      const lastName  = parts.slice(1).join(" ") || null;
      const newUser = await pool.query<{ id: string }>(
        `INSERT INTO users (email, phone, first_name, last_name, status)
         VALUES ($1, $2, $3, $4, 'ACTIVE') RETURNING id`,
        [userEmail, userPhone || null, firstName, lastName]
      );
      userId = newUser.rows[0].id;
    }

    if (!userId) {
      return { ok: false, error: "Не удалось определить пользователя" };
    }

    const seq = await pool.query<{ n: string }>("SELECT COUNT(*)::text AS n FROM bookings");
    const num = String(Number(seq.rows[0].n) + 1).padStart(4, "0");
    const bookingNumber = `BK-${num}`;

    await pool.query(
      `INSERT INTO bookings
         (booking_number, user_id, branch_id, guest_count, date, start_time, end_time, status, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8)`,
      [bookingNumber, userId, branchId, guestCount, date, startTime, endTime || null, comment || null]
    );

    revalidatePath("/admin/bookings");
    revalidatePath("/booking");
    return { ok: true, booking_number: bookingNumber };

  } catch (err) {
    console.error("[createBooking] error:", err);
    return { ok: false, error: "Ошибка сервера. Попробуйте ещё раз." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS (admin actions)
// ─────────────────────────────────────────────────────────────────────────────

export async function confirmBooking(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await pool.query(
    "UPDATE bookings SET status = 'CONFIRMED', confirmed_at = now(), updated_at = now() WHERE id = $1",
    [id]
  );
  revalidatePath("/admin/bookings");
}

export async function cancelBooking(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await pool.query(
    "UPDATE bookings SET status = 'CANCELLED', cancelled_at = now(), updated_at = now() WHERE id = $1",
    [id]
  );
  revalidatePath("/admin/bookings");
}

export async function completeBooking(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await pool.query(
    "UPDATE bookings SET status = 'COMPLETED', updated_at = now() WHERE id = $1",
    [id]
  );
  revalidatePath("/admin/bookings");
}

export async function markNoShow(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await pool.query(
    "UPDATE bookings SET status = 'NO_SHOW', updated_at = now() WHERE id = $1",
    [id]
  );
  revalidatePath("/admin/bookings");
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS / COMMENTS
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteReview(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await pool.query("UPDATE reviews SET status = 'DELETED', updated_at = now() WHERE id = $1", [id]);
  revalidatePath("/admin/reviews");
}

export async function hideReview(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await pool.query("UPDATE reviews SET status = 'HIDDEN', updated_at = now() WHERE id = $1", [id]);
  revalidatePath("/admin/reviews");
}

export async function publishReview(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await pool.query("UPDATE reviews SET status = 'PUBLISHED', updated_at = now() WHERE id = $1", [id]);
  revalidatePath("/admin/reviews");
}

export async function editReview(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const text = String(formData.get("text") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 5);
  if (!id || !text) return;
  await pool.query(
    "UPDATE reviews SET text = $1, rating = $2, updated_at = now() WHERE id = $3",
    [text, Math.min(5, Math.max(1, rating)), id]
  );
  revalidatePath("/admin/reviews");
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function slugify(input: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return input
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
