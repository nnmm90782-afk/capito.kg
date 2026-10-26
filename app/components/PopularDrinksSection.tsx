import { query } from "@/lib/db";
import PopularDrinksClient from "./PopularDrinksClient";

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  badge: string;
  image_url: string | null;
}

async function getPopularDrinks() {
  'use cache';
  const rows = await query<ProductRow>(`
    SELECT p.id, p.name, p.description, p.price::float8 AS price, p.badge, p.image_url
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = true
      AND p.deleted_at IS NULL
      AND c.slug = 'coffee'
    ORDER BY p.sort_order, p.created_at DESC
    LIMIT 4
  `);
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    badge: p.badge,
    image_url: p.image_url,
  }));
}

export default async function PopularDrinksSection() {
  'use cache';
  const drinks = await getPopularDrinks();
  return <PopularDrinksClient drinks={drinks} />;
}
