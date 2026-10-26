// app/api/finik/create-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createFinikPayment, CreatePaymentData } from '@/lib/finik';

// Фиксированная цена — 1 сом
const FIXED_AMOUNT = 1;

/**
 * POST /api/finik/create-payment
 * Создает платеж в Finik с фиксированной суммой 5 сомов
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Получение данных из запроса
    const body = await request.json();
    // workId   — orderNumber (human-readable, e.g. CP-20240101-AB12), used in RedirectUrl ?order=
    // orderId  — UUID of the order in DB, used in webhook metadata so it can match orders.id
    const { workId, orderId, workTopic, userId } = body;

    // 2. Валидация данных
    if (!workId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: workId and userId' },
        { status: 400 }
      );
    }

    // 3. Создание данных для платежа (цена всегда 5 сомов)
    // Pass orderId (UUID) as the workId sent to Finik so webhook can match by orders.id.
    // If orderId is not provided, fall back to workId (backwards compatibility).
    const paymentData: CreatePaymentData = {
      amount: FIXED_AMOUNT,
      workId: orderId || workId,
      orderNumber: workId,  // always the human-readable order number for RedirectUrl
      workTopic: workTopic || 'Оплата заказа',
      userId,
    };

    // 4. Создание платежа в Finik
    const paymentUrl = await createFinikPayment(paymentData);

    // 5. Возврат URL платежной страницы
    return NextResponse.json({
      success: true,
      paymentUrl,
      amount: FIXED_AMOUNT,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating Finik payment:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
