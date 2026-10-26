---
inclusion: manual
name: supabase-auth-setup
description: Step-by-step guide for configuring Supabase Auth with OTP email verification for this project
---

# Supabase Auth — настройка

## 1. Создать проект в Supabase

1. Зайди на [supabase.com](https://supabase.com) → **New project**
2. Выбери регион поближе (например, `eu-central-1`)
3. Сохрани пароль БД — он больше не покажется

---

## 2. Получить ключи API

**Dashboard → Project Settings → API**

| Переменная | Откуда брать |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "anon / public" key |

Вставь их в `.env` (и в `.env.local` для локального запуска):

```env
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."
```

> ⚠️ `NEXT_PUBLIC_*` переменные видны в браузере — это нормально для anon-ключа.  
> `service_role` ключ **никогда** не добавляй с префиксом `NEXT_PUBLIC_`.

---

## 3. Настроить Email Auth с OTP-кодом

**Dashboard → Authentication → Providers → Email**

| Настройка | Значение |
|---|---|
| Enable Email provider | ✅ включено |
| Confirm email | ✅ включено (обязательно!) |
| Secure email change | ✅ рекомендуется |
| OTP Expiry | `3600` (1 час) или `600` (10 мин) |

---

## 4. Настроить OTP вместо magic link

**Dashboard → Authentication → Email Templates → Confirm signup**

Supabase по умолчанию шлёт magic link. Чтобы слать **6-значный OTP-код**:

**Dashboard → Authentication → Settings (вверху страницы) → OTP**

- Найди раздел **"OTP"** или **"Phone / Email OTP"**
- Убедись, что включён `Email OTP` (не только magic link)

> Supabase автоматически включает OTP при использовании `verifyOtp({ type: "signup" })`.  
> Шаблон письма должен содержать `{{ .Token }}` — это и есть 6-значный код.

**Пример шаблона письма** (Dashboard → Auth → Email Templates → Confirm signup):

```html
<h2>Подтверждение email — Capito Coffee</h2>
<p>Ваш код подтверждения:</p>
<h1 style="letter-spacing: 8px; font-size: 36px;">{{ .Token }}</h1>
<p>Код действителен 1 час. Никому его не сообщайте.</p>
```

---

## 5. Настроить Redirect URLs

**Dashboard → Authentication → URL Configuration**

| Поле | Значение |
|---|---|
| Site URL | `http://localhost:3000` (dev) или твой домен |
| Redirect URLs | `http://localhost:3000/**` |

---

## 6. Настроить реальную отправку писем (для production)

По умолчанию Supabase использует встроенный SMTP (лимит ~3 письма/час на Free-плане).

Для production подключи внешний SMTP:  
**Dashboard → Project Settings → Auth → SMTP Settings**

Рекомендуемые провайдеры:
- [Resend](https://resend.com) — бесплатно до 3000 писем/мес, простая настройка
- [SendGrid](https://sendgrid.com) — надёжный, бесплатно до 100 писем/день
- [Postmark](https://postmarkapp.com) — лучший deliverability

Пример настройки через **Resend**:
1. Создай аккаунт на resend.com → Add Domain → верифицируй домен
2. Создай API Key
3. В Supabase SMTP:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: `re_xxxxxxx` (твой API key)
   - Sender email: `noreply@твойдомен.com`

---

## 7. Переменные окружения для Vercel / деплоя

В Vercel Dashboard → Settings → Environment Variables добавь:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DATABASE_URL
```

---

## Поток аутентификации (как работает)

```
Регистрация (/register)
  └─► supabase.auth.signUp({ email, password })
        └─► Supabase шлёт письмо с 6-значным OTP
              └─► Редирект на /verify-email?email=...

Подтверждение (/verify-email)
  └─► supabase.auth.verifyOtp({ email, token, type: "signup" })
        └─► Успех → сессия создана → редирект на /

Вход (/login)
  └─► supabase.auth.signInWithPassword({ email, password })
        └─► Проверяем email_confirmed_at
              ├─► не подтверждён → signOut() + редирект на /verify-email
              └─► подтверждён → сессия → редирект на /
```

---

## Безопасность

- Пароли **никогда** не хранятся на клиенте — Supabase хранит bcrypt-хэш
- OTP-коды **никогда** не хранятся в localStorage — они передаются только через email
- В localStorage хранится только JWT session token (стандартная практика)
- Anon-ключ безопасно использовать в браузере — он не даёт admin-прав
- RLS (Row Level Security) на таблицах БД защищает данные по user_id
