"use server";

import { pool } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ProfileData {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  type: string;
  createdAt: string;
  itemCount: number;
  items: { name: string; quantity: number; unitPrice: number }[];
}

export interface BookingRow {
  id: string;
  bookingNumber: string;
  status: string;
  date: string;
  startTime: string;
  guestCount: number;
  branchName: string | null;
  comment: string | null;
  createdAt: string;
}

// ─── Get profile by Supabase email ─────────────────────────────────────────

export async function getProfileByEmail(email: string): Promise<ProfileData | null> {
  if (!email) return null;
  try {
    const res = await pool.query<{
      id: string;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      avatar_url: string | null;
      created_at: Date;
    }>(
      `SELECT id, email, first_name, last_name, phone, avatar_url, created_at
         FROM users
        WHERE email = $1
        LIMIT 1`,
      [email]
    );
    if (!res.rowCount || res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      email: r.email,
      firstName: r.first_name,
      lastName: r.last_name,
      phone: r.phone,
      avatarUrl: r.avatar_url,
      createdAt: r.created_at.toISOString(),
    };
  } catch (e) {
    console.error("getProfileByEmail error:", e);
    return null;
  }
}

// ─── Update name / phone ────────────────────────────────────────────────────

export async function updateProfile(
  email: string,
  data: { firstName: string; lastName: string; phone: string }
): Promise<{ ok: boolean; error?: string }> {
  if (!email) return { ok: false, error: "Not authenticated" };
  try {
    await pool.query(
      `UPDATE users
          SET first_name = $1,
              last_name  = $2,
              phone      = NULLIF($3, ''),
              updated_at = now()
        WHERE email = $4`,
      [
        data.firstName.trim() || null,
        data.lastName.trim() || null,
        data.phone.trim(),
        email,
      ]
    );
    revalidatePath("/profile");
    return { ok: true };
  } catch (e) {
    console.error("updateProfile error:", e);
    return { ok: false, error: "DB error" };
  }
}

// ─── Update avatar URL (after client-side Supabase Storage upload) ──────────

export async function updateAvatarUrl(
  email: string,
  url: string
): Promise<{ ok: boolean; error?: string }> {
  if (!email || !url) return { ok: false, error: "Invalid params" };
  try {
    await pool.query(
      `UPDATE users SET avatar_url = $1, updated_at = now() WHERE email = $2`,
      [url, email]
    );
    revalidatePath("/profile");
    return { ok: true };
  } catch (e) {
    console.error("updateAvatarUrl error:", e);
    return { ok: false, error: "DB error" };
  }
}

// ─── Get orders for user ────────────────────────────────────────────────────

export async function getOrdersByEmail(email: string): Promise<OrderRow[]> {
  if (!email) return [];
  try {
    // First get the user id
    const userRes = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email]
    );
    if (!userRes.rowCount || userRes.rowCount === 0) return [];
    const userId = userRes.rows[0].id;

    const ordersRes = await pool.query<{
      id: string;
      order_number: string;
      status: string;
      payment_status: string;
      total_amount: string;
      type: string;
      created_at: Date;
    }>(
      `SELECT id, order_number, status, payment_status, total_amount, type, created_at
         FROM orders
        WHERE user_id = $1
          AND email != 'guest@capito.internal'
        ORDER BY created_at DESC
        LIMIT 50`,
      [userId]
    );

    if (!ordersRes.rowCount || ordersRes.rowCount === 0) return [];

    // Fetch items for each order in one query
    const orderIds = ordersRes.rows.map((o) => o.id);
    const itemsRes = await pool.query<{
      order_id: string;
      product_name: string;
      quantity: number;
      unit_price: string;
    }>(
      `SELECT order_id, product_name, quantity, unit_price
         FROM order_items
        WHERE order_id = ANY($1::uuid[])`,
      [orderIds]
    );

    // Group items by order
    const itemsByOrder: Record<string, { name: string; quantity: number; unitPrice: number }[]> = {};
    for (const item of itemsRes.rows) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push({
        name: item.product_name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
      });
    }

    return ordersRes.rows.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      paymentStatus: o.payment_status,
      totalAmount: parseFloat(o.total_amount),
      type: o.type,
      createdAt: o.created_at.toISOString(),
      itemCount: itemsByOrder[o.id]?.length ?? 0,
      items: itemsByOrder[o.id] ?? [],
    }));
  } catch (e) {
    console.error("getOrdersByEmail error:", e);
    return [];
  }
}

// ─── Get bookings for user ──────────────────────────────────────────────────

export async function getBookingsByEmail(email: string): Promise<BookingRow[]> {
  if (!email) return [];
  try {
    const userRes = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [email]
    );
    if (!userRes.rowCount || userRes.rowCount === 0) return [];
    const userId = userRes.rows[0].id;

    const res = await pool.query<{
      id: string;
      booking_number: string;
      status: string;
      date: Date;
      start_time: Date;
      guest_count: number;
      branch_name: string | null;
      comment: string | null;
      created_at: Date;
    }>(
      `SELECT b.id, b.booking_number, b.status, b.date, b.start_time,
              b.guest_count, br.name AS branch_name, b.comment, b.created_at
         FROM bookings b
    LEFT JOIN branches br ON br.id = b.branch_id
        WHERE b.user_id = $1
        ORDER BY b.created_at DESC
        LIMIT 50`,
      [userId]
    );

    return res.rows.map((r) => ({
      id: r.id,
      bookingNumber: r.booking_number,
      status: r.status,
      date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
      startTime:
        r.start_time instanceof Date
          ? r.start_time.toISOString().slice(11, 16)
          : String(r.start_time).slice(0, 5),
      guestCount: r.guest_count,
      branchName: r.branch_name,
      comment: r.comment,
      createdAt: r.created_at.toISOString(),
    }));
  } catch (e) {
    console.error("getBookingsByEmail error:", e);
    return [];
  }
}
