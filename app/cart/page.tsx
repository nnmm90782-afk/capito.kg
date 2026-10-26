"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart, Trash2, Plus, Minus, X,
  CheckCircle, AlertCircle, Coffee, ArrowLeft,
  Receipt, Copy, Check, QrCode, Home, Menu,
  Loader2,
} from "lucide-react";
import { useCart } from "../cart-provider";
import { useLang } from "../lang-provider";
import { makeT } from "../components/translations";
import { Navbar } from "../components/navbar";
import { Footer } from "../components/footer";
import { placeOrder, getOrderByNumber, OrderDetails } from "./actions";
import { useAuth } from "../auth-provider";

// ── Receipt Modal (cash / place order) ───────────────────────────────────────

interface ReceiptData {
  orderNumber: string;
  code: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  date: string;
}

function ReceiptModal({
  data,
  onClose,
}: {
  data: ReceiptData;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const tr = makeT(lang);
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(data.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-gold)",
          boxShadow: "var(--shadow-glow)",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "var(--bg-overlay)", color: "var(--text-faint)" }}
          aria-label="Close"
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div
          className="px-6 pt-7 pb-5 text-center border-b"
          style={{ borderColor: "var(--border-gold)" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{
              background: "rgba(74,222,128,0.12)",
              border: "1px solid rgba(74,222,128,0.3)",
            }}
          >
            <CheckCircle size={26} color="#4ade80" />
          </div>
          <h2
            className="text-xl font-black"
            style={{ color: "var(--text-primary)" }}
          >
            {tr("receipt_success")}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {tr("receipt_number")}
            {data.orderNumber}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--text-faint)" }}
          >
            {data.date}
          </p>
        </div>

        {/* One-time code */}
        <div
          className="px-6 py-5 border-b"
          style={{ borderColor: "var(--border-gold)" }}
        >
          <p
            className="text-xs font-semibold mb-2 text-center"
            style={{ color: "var(--text-muted)" }}
          >
            {tr("receipt_code")}
          </p>
          <div
            className="flex items-center justify-between rounded-xl px-5 py-3"
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-gold)",
            }}
          >
            <span
              className="text-3xl font-black tracking-[0.3em]"
              style={{ color: "#f5a623" }}
            >
              {data.code}
            </span>
            <button
              onClick={copyCode}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: "rgba(245,166,35,0.12)", color: "#f5a623" }}
              aria-label="Copy code"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <p
            className="text-[11px] text-center mt-2"
            style={{ color: "var(--text-faint)" }}
          >
            {tr("receipt_code_hint")}
          </p>
        </div>

        {/* Items */}
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: "var(--border-gold)" }}
        >
          <div className="flex flex-col gap-2">
            {data.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm"
              >
                <span style={{ color: "var(--text-muted)" }}>
                  {item.name}
                  <span
                    className="ml-1 text-xs"
                    style={{ color: "var(--text-faint)" }}
                  >
                    ×{item.quantity}
                  </span>
                </span>
                <span
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {(item.price * item.quantity).toLocaleString("ru-RU")} сом
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total + close */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-5">
            <span className="font-bold" style={{ color: "var(--text-muted)" }}>
              {tr("cart_total")}
            </span>
            <span
              className="text-xl font-black"
              style={{ color: "#f5a623" }}
            >
              {data.total.toLocaleString("ru-RU")} сом
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg,#f5a623,#ffc84a)",
              color: "#0a0805",
            }}
          >
            {tr("receipt_done")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payment Receipt Modal (after Finik redirect) ──────────────────────────────

function PaymentReceiptModal({
  orderNumber,
  onClose,
}: {
  orderNumber: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchOrder() {
      // Finik webhook may arrive slightly after the redirect — poll up to 6s
      for (let attempt = 0; attempt < 4; attempt++) {
        const data = await getOrderByNumber(orderNumber);
        if (!cancelled) {
          if (data) {
            setOrder(data);
            setLoading(false);
            return;
          }
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 1500));
          }
        }
      }
      if (!cancelled) setLoading(false);
    }
    fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  function copyCode() {
    if (!order?.code) return;
    navigator.clipboard.writeText(order.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function goToMenu() {
    router.push("/menu");
  }

  function goHome() {
    router.push("/");
  }

  const isPaid =
    order?.paymentStatus === "PAID" || order?.paymentStatus === "paid";
  const formattedDate = order
    ? new Date(order.createdAt).toLocaleString("ru-RU", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-6"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-gold)",
          boxShadow: "0 0 60px rgba(245,166,35,0.18)",
        }}
      >
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 px-6 gap-4">
            <Loader2 size={36} color="#f5a623" className="animate-spin" />
            <p
              className="text-sm text-center font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              Загружаем данные заказа…
            </p>
          </div>
        )}

        {/* Loaded */}
        {!loading && (
          <>
            {/* Header */}
            <div
              className="px-6 pt-8 pb-6 text-center border-b"
              style={{ borderColor: "var(--border-gold)" }}
            >
              {/* Animated checkmark */}
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ background: isPaid ? "#4ade80" : "#f5a623" }}
                />
                <div
                  className="relative w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: isPaid
                      ? "rgba(74,222,128,0.15)"
                      : "rgba(245,166,35,0.15)",
                    border: isPaid
                      ? "1px solid rgba(74,222,128,0.4)"
                      : "1px solid rgba(245,166,35,0.4)",
                  }}
                >
                  <CheckCircle
                    size={30}
                    color={isPaid ? "#4ade80" : "#f5a623"}
                  />
                </div>
              </div>

              <h2
                className="text-xl font-black"
                style={{ color: "var(--text-primary)" }}
              >
                {isPaid ? "Оплата прошла успешно!" : "Заказ оформлен"}
              </h2>

              {order && (
                <>
                  <p
                    className="text-sm mt-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Заказ №&nbsp;
                    <span className="font-bold" style={{ color: "#f5a623" }}>
                      {order.orderNumber}
                    </span>
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {formattedDate}
                  </p>
                </>
              )}

              {!order && (
                <p
                  className="text-sm mt-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  Заказ №&nbsp;
                  <span className="font-bold" style={{ color: "#f5a623" }}>
                    {orderNumber}
                  </span>
                </p>
              )}
            </div>

            {/* Pickup code */}
            {order?.code && (
              <div
                className="px-6 py-5 border-b"
                style={{ borderColor: "var(--border-gold)" }}
              >
                <p
                  className="text-xs font-semibold mb-2.5 text-center uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Код для получения заказа
                </p>
                <div
                  className="flex items-center justify-between rounded-xl px-5 py-3.5"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-gold)",
                  }}
                >
                  <span
                    className="text-3xl font-black tracking-[0.35em]"
                    style={{ color: "#f5a623" }}
                  >
                    {order.code}
                  </span>
                  <button
                    onClick={copyCode}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
                    style={{
                      background: "rgba(245,166,35,0.15)",
                      color: "#f5a623",
                    }}
                    aria-label="Скопировать код"
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
                <p
                  className="text-[11px] text-center mt-2"
                  style={{ color: "var(--text-faint)" }}
                >
                  Назовите этот код при получении заказа
                </p>
              </div>
            )}

            {/* Order items */}
            {order && order.items.length > 0 && (
              <div
                className="px-6 py-4 border-b"
                style={{ borderColor: "var(--border-gold)" }}
              >
                <p
                  className="text-xs font-semibold mb-3 uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  Состав заказа
                </p>
                <div className="flex flex-col gap-2">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span style={{ color: "var(--text-muted)" }}>
                        {item.name}
                        <span
                          className="ml-1 text-xs"
                          style={{ color: "var(--text-faint)" }}
                        >
                          ×{item.quantity}
                        </span>
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.total_price.toLocaleString("ru-RU")} сом
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div
                  className="flex justify-between items-center mt-3 pt-3 border-t"
                  style={{ borderColor: "var(--border-gold)" }}
                >
                  <span
                    className="font-bold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Итого
                  </span>
                  <span
                    className="text-lg font-black"
                    style={{ color: "#f5a623" }}
                  >
                    {order.totalAmount.toLocaleString("ru-RU")} сом
                  </span>
                </div>
              </div>
            )}

            {/* Payment badge */}
            {order && (
              <div className="px-6 pt-4 pb-1">
                <div
                  className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
                  style={{
                    background: isPaid
                      ? "rgba(74,222,128,0.10)"
                      : "rgba(245,166,35,0.10)",
                    border: isPaid
                      ? "1px solid rgba(74,222,128,0.25)"
                      : "1px solid rgba(245,166,35,0.25)",
                    color: isPaid ? "#4ade80" : "#f5a623",
                  }}
                >
                  <QrCode size={13} />
                  {isPaid ? "Оплачено через Finik Pay" : "Ожидание подтверждения оплаты"}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="px-6 py-5 flex flex-col gap-3">
              <button
                onClick={goToMenu}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg,#f5a623,#ffc84a)",
                  color: "#0a0805",
                }}
              >
                <Menu size={16} />
                Вернуться в меню
              </button>
              <button
                onClick={goHome}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-80 active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-gold)",
                  color: "var(--text-muted)",
                }}
              >
                <Home size={15} />
                На главную
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Cart Page ────────────────────────────────────────────────────────────────

// Фиксированная цена оплаты через Finik Pay
const FINIK_AMOUNT = 1;

function CartContent() {
  const { lang } = useLang();
  const tr = makeT(lang);
  const { items, count, total, increment, decrement, remove, clear } = useCart();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [finikLoading, setFinikLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Read Finik redirect params from URL
  const paymentParam = searchParams.get("payment");
  const orderParam = searchParams.get("order");
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(
    paymentParam === "success" && !!orderParam
  );

  // Clean the URL once the modal is dismissed
  function handlePaymentReceiptClose() {
    setShowPaymentReceipt(false);
    router.replace("/cart", { scroll: false });
  }

  async function handleOrder() {
    setError(null);
    setLoading(true);
    const result = await placeOrder(
      items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
      name,
      phone
    );
    setLoading(false);

    if (!result.ok || !result.orderNumber || !result.code) {
      setError(result.error ?? tr("receipt_err"));
      return;
    }

    setReceipt({
      orderNumber: result.orderNumber,
      code: result.code,
      items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
      total,
      date: new Date().toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" }),
    });
    clear();
  }

  async function handleFinikPayment() {
    setError(null);
    setFinikLoading(true);

    try {
      // Create order in DB first to get orderId (UUID) and orderNumber
      const result = await placeOrder(
        items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        name,
        phone
      );

      if (!result.ok || !result.orderId || !result.orderNumber) {
        setError(result.error ?? tr("receipt_err"));
        setFinikLoading(false);
        return;
      }

      // workId = orderId (UUID) so webhook can match by orders.id
      // The RedirectUrl in lib/finik.ts appends &order={workId} which is the orderNumber
      // We pass orderNumber as workId here so the redirect URL carries the human-readable number
      const response = await fetch("/api/finik/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workId: result.orderNumber,   // used in RedirectUrl as ?order=
          orderId: result.orderId,       // UUID for webhook DB update
          workTopic: "Оплата заказа Capito",
          userId: user?.id ?? "guest",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось создать платёж");
      }

      if (data.paymentUrl) {
        clear();
        window.location.href = data.paymentUrl;
      } else {
        throw new Error("Payment URL not received");
      }
    } catch (err) {
      console.error("Finik payment error:", err);
      setError(err instanceof Error ? err.message : "Ошибка оплаты");
      setFinikLoading(false);
    }
  }

  return (
    <>
      {/* Standard receipt modal (cash order) */}
      {receipt && (
        <ReceiptModal data={receipt} onClose={() => setReceipt(null)} />
      )}

      {/* Finik payment receipt modal */}
      {showPaymentReceipt && orderParam && (
        <PaymentReceiptModal
          orderNumber={orderParam}
          onClose={handlePaymentReceiptClose}
        />
      )}

      <Navbar />
      <main
        className="min-h-screen pt-24 pb-20 px-4"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="max-w-2xl mx-auto">

          {/* Back */}
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm mb-6 transition-colors hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={15} />
            {tr("nav_menu")}
          </Link>

          {/* Title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(245,166,35,0.10)",
                  border: "1px solid var(--border-gold)",
                }}
              >
                <ShoppingCart size={18} color="#f5a623" />
              </div>
              <div>
                <h1
                  className="text-2xl font-black leading-none"
                  style={{ color: "var(--text-primary)" }}
                >
                  {tr("cart_title")}
                </h1>
                {count > 0 && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-faint)" }}
                  >
                    {count} {tr("cart_items")}
                  </p>
                )}
              </div>
            </div>
            {items.length > 0 && (
              <button
                onClick={clear}
                className="flex items-center gap-1.5 text-xs transition-colors px-3 py-1.5 rounded-full border"
                style={{
                  color: "var(--text-faint)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <Trash2 size={12} />
                {tr("cart_clear")}
              </button>
            )}
          </div>

          {/* Empty state */}
          {items.length === 0 && !receipt && (
            <div
              className="rounded-2xl py-20 flex flex-col items-center gap-4"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-gold)",
              }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(245,166,35,0.08)",
                  border: "1px solid var(--border-gold)",
                }}
              >
                <Coffee size={24} color="#f5a623" />
              </div>
              <p
                className="font-bold text-lg"
                style={{ color: "var(--text-primary)" }}
              >
                {tr("cart_empty")}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {tr("cart_empty_desc")}
              </p>
              <Link
                href="/menu"
                className="mt-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg,#f5a623,#ffc84a)",
                  color: "#0a0805",
                }}
              >
                {tr("cart_go_menu")}
              </Link>
            </div>
          )}

          {/* Items */}
          {items.length > 0 && (
            <div className="flex flex-col gap-3 mb-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-2xl px-5 py-4"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-gold)",
                  }}
                >
                  {/* Image or placeholder */}
                  <div
                    className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{ background: "var(--drink-img-bg)" }}
                  >
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Coffee size={22} color="#f5a623" opacity={0.5} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold text-sm truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.name}
                    </p>
                    <p
                      className="text-sm font-semibold mt-0.5"
                      style={{ color: "#f5a623" }}
                    >
                      {(item.price * item.quantity).toLocaleString("ru-RU")} сом
                    </p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => decrement(item.id)}
                      className="w-7 h-7 rounded-full border flex items-center justify-center transition-all hover:bg-[rgba(245,166,35,0.1)]"
                      style={{
                        borderColor: "var(--border-gold)",
                        color: "#f5a623",
                      }}
                      aria-label="Decrease"
                    >
                      <Minus size={12} />
                    </button>
                    <span
                      className="w-6 text-center font-bold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => increment(item.id)}
                      className="w-7 h-7 rounded-full border flex items-center justify-center transition-all hover:bg-[rgba(245,166,35,0.1)]"
                      style={{
                        borderColor: "var(--border-gold)",
                        color: "#f5a623",
                      }}
                      aria-label="Increase"
                    >
                      <Plus size={12} />
                    </button>

                    <button
                      onClick={() => remove(item.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all ml-1 hover:bg-[rgba(239,68,68,0.1)]"
                      style={{ color: "rgba(239,68,68,0.6)" }}
                      aria-label="Remove"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Checkout form + summary */}
          {items.length > 0 && (
            <div
              className="rounded-2xl p-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-gold)",
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <Receipt size={16} color="#f5a623" />
                <h2
                  className="font-bold text-base"
                  style={{ color: "var(--text-primary)" }}
                >
                  {tr("cart_order_btn")}
                </h2>
              </div>

              {/* Optional contact fields */}
              <div className="flex flex-col gap-3 mb-5">
                <input
                  type="text"
                  placeholder="Ваше имя (необязательно)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-gold)",
                    color: "var(--text-primary)",
                  }}
                />
                <input
                  type="tel"
                  placeholder="Телефон (необязательно)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-gold)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-sm"
                  style={{
                    background: "rgba(239,68,68,0.10)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#f87171",
                  }}
                >
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* Divider + total */}
              <div
                className="border-t pt-4 mb-4"
                style={{ borderColor: "var(--border-gold)" }}
              >
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm py-1"
                  >
                    <span style={{ color: "var(--text-muted)" }}>
                      {item.name}{" "}
                      <span style={{ color: "var(--text-faint)" }}>
                        ×{item.quantity}
                      </span>
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {(item.price * item.quantity).toLocaleString("ru-RU")} сом
                    </span>
                  </div>
                ))}
                <div
                  className="flex justify-between items-center mt-3 pt-3 border-t"
                  style={{ borderColor: "var(--border-gold)" }}
                >
                  <span
                    className="font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {tr("cart_total")}
                  </span>
                  <span
                    className="text-2xl font-black"
                    style={{ color: "#f5a623" }}
                  >
                    {total.toLocaleString("ru-RU")} сом
                  </span>
                </div>
              </div>

              {/* Finik Pay button */}
              <button
                onClick={handleFinikPayment}
                disabled={loading || finikLoading}
                className="w-full py-3.5 rounded-xl font-bold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-gold)",
                  color: "var(--text-primary)",
                }}
              >
                {finikLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Создание платежа...
                  </>
                ) : (
                  <>
                    <QrCode size={18} color="#f5a623" />
                    Оплатить через Finik · {FINIK_AMOUNT} сом
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}


export default function CartPage() {
  return (
    <Suspense fallback={null}>
      <CartContent />
    </Suspense>
  );
}
