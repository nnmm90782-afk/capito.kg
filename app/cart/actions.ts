"use server";

import { pool } from "@/lib/db";

export interface CartItemInput {
  id: string;       // product id (UUID) or static key like "static-Капучино"
  name: string;
  price: number;
  quantity: number;
}

export interface PlaceOrderResult {
  ok: boolean;
  orderId?: string;     // UUID — used as workId for Finik webhook matching
  orderNumber?: string;
  code?: string;        // one-time pickup code stored in orders.comment
  error?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderDetails {
  id: string;
  orderNumber: string;
  code: string | null;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
  customerName: string | null;
  items: OrderItem[];
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CP-${date}-${suffix}`;
}

/** Returns a real product_id for an item, or the first product as fallback */
async function resolveProductId(itemId: string, itemName: string): Promise<string> {
  // If itemId looks like a UUID — use it directly
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRe.test(itemId)) {
    const r = await pool.query<{ id: string }>(
      "SELECT id FROM products WHERE id = $1 LIMIT 1", [itemId]
    );
    if (r.rowCount && r.rowCount > 0) return r.rows[0].id;
  }

  // Try to find by name
  const byName = await pool.query<{ id: string }>(
    "SELECT id FROM products WHERE LOWER(name) = LOWER($1) LIMIT 1", [itemName]
  );
  if (byName.rowCount && byName.rowCount > 0) return byName.rows[0].id;

  // Fallback: any active product
  const fallback = await pool.query<{ id: string }>(
    "SELECT id FROM products WHERE is_active = true AND deleted_at IS NULL LIMIT 1"
  );
  if (fallback.rowCount && fallback.rowCount > 0) return fallback.rows[0].id;

  throw new Error("No products found in database");
}

export async function placeOrder(
  items: CartItemInput[],
  customerName: string,
  customerPhone: string
): Promise<PlaceOrderResult> {
  if (!items.length) return { ok: false, error: "Корзина пуста" };

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const orderNumber = generateOrderNumber();
  const code = generateCode();
  // Store the one-time code in the comment field
  const commentWithCode = `КОД: ${code}`;

  // ── Guest user ────────────────────────────────────────────────────────────
  let userId: string;
  try {
    const existing = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      ["guest@capito.internal"]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      userId = existing.rows[0].id;
    } else {
      const created = await pool.query<{ id: string }>(
        "INSERT INTO users (email, first_name, status) VALUES ($1,$2,$3) RETURNING id",
        ["guest@capito.internal", "Гость", "ACTIVE"]
      );
      userId = created.rows[0].id;
    }
  } catch (e) {
    console.error("user error:", e);
    return { ok: false, error: "Ошибка создания пользователя" };
  }

  // ── Branch ────────────────────────────────────────────────────────────────
  let branchId: string;
  try {
    const branch = await pool.query<{ id: string }>(
      "SELECT id FROM branches WHERE is_active = true ORDER BY created_at LIMIT 1"
    );
    if (!branch.rowCount || branch.rowCount === 0) {
      return { ok: false, error: "Нет доступных филиалов" };
    }
    branchId = branch.rows[0].id;
  } catch (e) {
    console.error("branch error:", e);
    return { ok: false, error: "Ошибка получения филиала" };
  }

  // ── Resolve product ids before transaction ────────────────────────────────
  let resolvedItems: Array<CartItemInput & { productId: string }>;
  try {
    resolvedItems = await Promise.all(
      items.map(async (item) => ({
        ...item,
        productId: await resolveProductId(item.id, item.name),
      }))
    );
  } catch (e) {
    console.error("product resolve error:", e);
    return { ok: false, error: "Товар не найден в базе" };
  }

  // ── Transaction ────────────────────────────────────────────────────────────
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderRes = await client.query<{ id: string }>(
      `INSERT INTO orders
         (order_number, user_id, branch_id, type, status, payment_status,
          subtotal, discount_amount, delivery_fee, total_amount,
          customer_name, customer_phone, comment)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [
        orderNumber, userId, branchId,
        "PICKUP", "NEW", "PENDING",
        subtotal, 0, 0, subtotal,
        customerName || "Гость",
        customerPhone || null,
        commentWithCode,
      ]
    );
    const orderId = orderRes.rows[0].id;

    for (const item of resolvedItems) {
      await client.query(
        `INSERT INTO order_items
           (order_id, product_id, product_name, variant_name, quantity, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          orderId,
          item.productId,
          item.name,
          "",
          item.quantity,
          item.price,
          item.price * item.quantity,
        ]
      );
    }

    await client.query("COMMIT");
    return { ok: true, orderId, orderNumber, code };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("placeOrder transaction error:", err);
    return { ok: false, error: "Ошибка при создании заказа" };
  } finally {
    client.release();
  }
}

/** Fetches order details by orderNumber for the receipt screen */
export async function getOrderByNumber(
  orderNumber: string
): Promise<OrderDetails | null> {
  try {
    const orderRes = await pool.query<{
      id: string;
      order_number: string;
      comment: string | null;
      total_amount: string;
      payment_status: string;
      status: string;
      created_at: Date;
      customer_name: string | null;
    }>(
      `SELECT id, order_number, comment, total_amount, payment_status, status,
              created_at, customer_name
         FROM orders
        WHERE order_number = $1
        LIMIT 1`,
      [orderNumber]
    );

    if (!orderRes.rowCount || orderRes.rowCount === 0) return null;
    const order = orderRes.rows[0];

    const itemsRes = await pool.query<{
      product_name: string;
      quantity: number;
      unit_price: string;
      total_price: string;
    }>(
      `SELECT product_name, quantity, unit_price, total_price
         FROM order_items
        WHERE order_id = $1
        ORDER BY id`,
      [order.id]
    );

    // Extract pickup code from comment field ("КОД: XXXXXX")
    const codeMatch = order.comment?.match(/КОД:\s*([A-Z0-9]{6})/);
    const code = codeMatch ? codeMatch[1] : null;

    return {
      id: order.id,
      orderNumber: order.order_number,
      code,
      totalAmount: parseFloat(order.total_amount),
      paymentStatus: order.payment_status,
      status: order.status,
      createdAt: order.created_at.toISOString(),
      customerName: order.customer_name,
      items: itemsRes.rows.map((row) => ({
        name: row.product_name,
        quantity: row.quantity,
        unit_price: parseFloat(row.unit_price),
        total_price: parseFloat(row.total_price),
      })),
    };
  } catch (err) {
    console.error("getOrderByNumber error:", err);
    return null;
  }
}
