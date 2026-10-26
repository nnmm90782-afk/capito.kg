// Database setup: creates tables (compatible with prisma/schema.prisma @map names)
// and seeds demo data. Run once with: node lib/setup-db.mjs
import pkg from "pg";
import fs from "fs";
const { Pool } = pkg;

const url = fs.readFileSync(".env", "utf8").match(/DATABASE_URL="([^"]+)"/)?.[1];
const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

const DDL = `
-- Enums (matching prisma/schema.prisma)
DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('ACTIVE','BLOCKED','DELETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('NEW','ACCEPTED','PREPARING','READY','COURIER_ASSIGNED','PICKED_UP','IN_TRANSIT','DELIVERED','COMPLETED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('PENDING','PAID','FAILED','CANCELLED','REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "ReviewStatus" AS ENUM ('PENDING','PUBLISHED','HIDDEN','DELETED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "OrderType" AS ENUM ('DELIVERY','PICKUP','DINE_IN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- users
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE,
  phone           VARCHAR(30)  UNIQUE,
  password_hash   TEXT,
  first_name      VARCHAR(100),
  last_name       VARCHAR(100),
  avatar_url      TEXT,
  status          "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- branches
CREATE TABLE IF NOT EXISTS branches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) UNIQUE NOT NULL,
  address     TEXT NOT NULL,
  city        VARCHAR(100) NOT NULL DEFAULT 'Bishkek',
  phone       VARCHAR(30),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- categories
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL,
  slug        VARCHAR(200) UNIQUE NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- products (image_url + price + badge added for practical admin/menu use)
CREATE TABLE IF NOT EXISTS products (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id        UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name               VARCHAR(255) NOT NULL,
  slug               VARCHAR(255) UNIQUE NOT NULL,
  description        TEXT,
  short_description  TEXT,
  image_url          TEXT,
  price              NUMERIC(12,2) NOT NULL DEFAULT 0,
  badge              VARCHAR(50) DEFAULT '',
  is_active          BOOLEAN NOT NULL DEFAULT true,
  is_featured        BOOLEAN NOT NULL DEFAULT false,
  sort_order         INT NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number       VARCHAR(30) UNIQUE NOT NULL,
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  branch_id          UUID REFERENCES branches(id) ON DELETE SET NULL,
  type               "OrderType" NOT NULL DEFAULT 'DELIVERY',
  status             "OrderStatus" NOT NULL DEFAULT 'NEW',
  payment_status     "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  subtotal           NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_fee       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  customer_name      VARCHAR(255),
  customer_phone     VARCHAR(30),
  comment            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at       TIMESTAMPTZ,
  cancelled_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- order_items
CREATE TABLE IF NOT EXISTS order_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id          UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name        VARCHAR(255) NOT NULL,
  variant_name        VARCHAR(100) NOT NULL DEFAULT '',
  quantity            INT NOT NULL DEFAULT 1,
  unit_price          NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price         NUMERIC(12,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- reviews
CREATE TABLE IF NOT EXISTS reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id     UUID REFERENCES orders(id) ON DELETE SET NULL,
  branch_id    UUID REFERENCES branches(id) ON DELETE SET NULL,
  rating       SMALLINT NOT NULL DEFAULT 5,
  text         TEXT,
  status       "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
`;

const seed = `
-- Branch
INSERT INTO branches (name, slug, address, city, phone) VALUES
  ('Capito Center', 'capito-center', 'пр. Чуй 100', 'Bishkek', '+996555123456'),
  ('Capito Dordoi', 'capito-dordoi', 'ул. Ибраимова 50', 'Bishkek', '+996555654321')
ON CONFLICT (slug) DO NOTHING;

-- Categories
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Кофе','coffee',1),
  ('Авторские напитки','signature',2),
  ('Холодные напитки','cold',3),
  ('Чай','tea',4),
  ('Bakery','bakery',5),
  ('Пицца','pizza',6),
  ('Паста','pasta',7),
  ('Завтраки','breakfast',8)
ON CONFLICT (slug) DO NOTHING;

-- Users
INSERT INTO users (email, phone, first_name, last_name, status) VALUES
  ('asan@example.com','+996700111222','Асан','Сыдыков','ACTIVE'),
  ('aida@example.com','+996700333444','Айда','Жумабекова','ACTIVE'),
  ('nurgul@example.com','+996702555666','Нургуль','Алиева','ACTIVE'),
  ('spam@example.com','+996703777888','Спам','Бот','BLOCKED'),
  ('me@example.com','+996705999000','Эрмек','Беков','ACTIVE')
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products (category_id, name, slug, description, price, badge, is_active, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='coffee'),'Эспрессо','espresso','Чистый вкус и максимум энергии.',180,'',true,1),
  ((SELECT id FROM categories WHERE slug='coffee'),'Капучино','cappuccino','Мягкая молочная пена и крепкое эспрессо.',220,'Хит',true,2),
  ((SELECT id FROM categories WHERE slug='coffee'),'Латте','latte','Мягкий вкус и бархатная текстура.',240,'',true,3),
  ((SELECT id FROM categories WHERE slug='coffee'),'Флэт Уайт','flat-white','Насыщенный вкус с нежной текстурой.',230,'',true,4),
  ((SELECT id FROM categories WHERE slug='signature'),'Карамельный латте','caramel-latte','Карамель, ваниль и нежная пена.',280,'Новинка',true,1),
  ((SELECT id FROM categories WHERE slug='signature'),'Лавандовый латте','lavender-latte','Лаванда и мёд с молочной пеной.',285,'',true,2),
  ((SELECT id FROM categories WHERE slug='cold'),'Айс Американо','iced-americano','Освежающий кофе со льдом.',220,'',true,1),
  ((SELECT id FROM categories WHERE slug='cold'),'Фраппе','frappe','Взбитый ледяной кофе.',270,'',true,2),
  ((SELECT id FROM categories WHERE slug='tea'),'Матча латте','matcha-latte','Японский зелёный чай с молоком.',270,'',true,1),
  ((SELECT id FROM categories WHERE slug='bakery'),'Круассан','croissant','Хрустящий, свежий каждое утро.',120,'',true,1),
  ((SELECT id FROM categories WHERE slug='bakery'),'Чизкейк','cheesecake','Нежный творожный чизкейк.',220,'',true,2),
  ((SELECT id FROM categories WHERE slug='pizza'),'Маргарита','margherita','Томаты, моцарелла, базилик.',590,'',true,1),
  ((SELECT id FROM categories WHERE slug='pizza'),'Пепперони','pepperoni','Острая салями и сыр.',650,'Хит',true,2),
  ((SELECT id FROM categories WHERE slug='pasta'),'Карбонара','carbonara','Паста с беконом и сливочным соусом.',490,'',true,1),
  ((SELECT id FROM categories WHERE slug='breakfast'),'Авокадо тост','avocado-toast','Хрустящий тост с авокадо и яйцом.',350,'',true,1)
ON CONFLICT (slug) DO NOTHING;

-- Orders (mix of statuses for analytics)
INSERT INTO orders (order_number, user_id, branch_id, status, payment_status, subtotal, total_amount, customer_name, created_at, completed_at) VALUES
  ('ORD-1001',(SELECT id FROM users WHERE email='asan@example.com'),(SELECT id FROM branches WHERE slug='capito-center'),'COMPLETED','PAID',400,400,'Асан Сыдыков', now() - interval '6 days', now() - interval '6 days'),
  ('ORD-1002',(SELECT id FROM users WHERE email='aida@example.com'),(SELECT id FROM branches WHERE slug='capito-dordoi'),'COMPLETED','PAID',670,670,'Айда Жумабекова', now() - interval '5 days', now() - interval '5 days'),
  ('ORD-1003',(SELECT id FROM users WHERE email='nurgul@example.com'),(SELECT id FROM branches WHERE slug='capito-center'),'COMPLETED','PAID',285,285,'Нургуль Алиева', now() - interval '4 days', now() - interval '4 days'),
  ('ORD-1004',(SELECT id FROM users WHERE email='me@example.com'),(SELECT id FROM branches WHERE slug='capito-center'),'COMPLETED','PAID',1040,1040,'Эрмек Беков', now() - interval '3 days', now() - interval '3 days'),
  ('ORD-1005',(SELECT id FROM users WHERE email='asan@example.com'),(SELECT id FROM branches WHERE slug='capito-dordoi'),'PREPARING','PAID',590,590,'Асан Сыдыков', now() - interval '1 days', NULL),
  ('ORD-1006',(SELECT id FROM users WHERE email='aida@example.com'),(SELECT id FROM branches WHERE slug='capito-center'),'NEW','PENDING',220,220,'Айда Жумабекова', now() - interval '4 hours', NULL),
  ('ORD-1007',(SELECT id FROM users WHERE email='nurgul@example.com'),(SELECT id FROM branches WHERE slug='capito-center'),'CANCELLED','CANCELLED',490,490,'Нургуль Алиева', now() - interval '2 days', NULL)
ON CONFLICT (order_number) DO NOTHING;

-- Order items
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
SELECT o.id, p.id, p.name, 2, 180, 360 FROM orders o, products p WHERE o.order_number='ORD-1001' AND p.slug='espresso'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
SELECT o.id, p.id, p.name, 1, 220, 220 FROM orders o, products p WHERE o.order_number='ORD-1002' AND p.slug='cappuccino'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
SELECT o.id, p.id, p.name, 1, 280, 280 FROM orders o, products p WHERE o.order_number='ORD-1002' AND p.slug='caramel-latte'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
SELECT o.id, p.id, p.name, 1, 285, 285 FROM orders o, products p WHERE o.order_number='ORD-1003' AND p.slug='lavender-latte'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
SELECT o.id, p.id, p.name, 1, 220, 220 FROM orders o, products p WHERE o.order_number='ORD-1004' AND p.slug='cappuccino'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
SELECT o.id, p.id, p.name, 1, 590, 590 FROM orders o, products p WHERE o.order_number='ORD-1004' AND p.slug='margherita'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
SELECT o.id, p.id, p.name, 1, 230, 230 FROM orders o, products p WHERE o.order_number='ORD-1004' AND p.slug='flat-white'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
SELECT o.id, p.id, p.name, 1, 590, 590 FROM orders o, products p WHERE o.order_number='ORD-1005' AND p.slug='pepperoni'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
SELECT o.id, p.id, p.name, 1, 220, 220 FROM orders o, products p WHERE o.order_number='ORD-1006' AND p.slug='cappuccino'
ON CONFLICT DO NOTHING;
INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
SELECT o.id, p.id, p.name, 1, 490, 490 FROM orders o, products p WHERE o.order_number='ORD-1007' AND p.slug='carbonara'
ON CONFLICT DO NOTHING;

-- Reviews
INSERT INTO reviews (user_id, branch_id, rating, text, status, created_at) VALUES
  ((SELECT id FROM users WHERE email='asan@example.com'),(SELECT id FROM branches WHERE slug='capito-center'),5,'Отличный капучино, лучшая кофейня в городе!','PUBLISHED', now() - interval '5 days'),
  ((SELECT id FROM users WHERE email='aida@example.com'),(SELECT id FROM branches WHERE slug='capito-dordoi'),4,'Вкусная пицца, но ждала долго.','PUBLISHED', now() - interval '4 days'),
  ((SELECT id FROM users WHERE email='nurgul@example.com'),(SELECT id FROM branches WHERE slug='capito-center'),2,'Холодный кофе, ужасный сервис! Не рекомендую.','PENDING', now() - interval '2 days'),
  ((SELECT id FROM users WHERE email='me@example.com'),(SELECT id FROM branches WHERE slug='capito-center'),5,'Всегда свежая выпечка, спасибо!','PUBLISHED', now() - interval '1 days')
ON CONFLICT DO NOTHING;
`;

async function run() {
  console.log("Creating tables...");
  await pool.query(DDL);
  console.log("Seeding data...");
  await pool.query(seed);
  const c = await pool.query("SELECT COUNT(*)::int AS n FROM products");
  console.log("Done. Products:", c.rows[0].n);
  await pool.end();
}
run().catch(e => { console.error("ERROR:", e.message); process.exit(1); });
