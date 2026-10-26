import { query } from "@/lib/db";
import AdminMenuClient, { type Product, type Category } from "./AdminMenuClient";

// Admin page: live data from DB, rendered on demand.
export const instant = false;

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  badge: string;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  category_slug: string;
  category_name: string;
}

async function getProducts(): Promise<ProductRow[]> {
  return query<ProductRow>(`
    SELECT
      p.id, p.name, p.description, p.price, p.badge, p.image_url,
      p.is_active, p.is_featured,
      c.slug AS category_slug, c.name AS category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.deleted_at IS NULL
    ORDER BY c.sort_order, p.sort_order, p.created_at DESC
  `);
}

async function getCategories(): Promise<Category[]> {
  return query<Category>(`
    SELECT slug, name FROM categories WHERE is_active = true ORDER BY sort_order
  `);
}

export default async function AdminMenuPage() {
  const [productRows, categories] = await Promise.all([getProducts(), getCategories()]);

  const products: Product[] = productRows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    badge: r.badge,
    image_url: r.image_url,
    is_active: r.is_active,
    is_featured: r.is_featured,
    category_slug: r.category_slug,
    category_name: r.category_name,
  }));

  return <AdminMenuClient products={products} categories={categories} />;
}
