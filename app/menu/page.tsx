import { query } from "@/lib/db";
import MenuClient, { type MenuCategory, type MenuItem } from "./MenuClient";

// The public menu reads live product data from the DB and is revalidated
// on demand by admin actions (revalidatePath("/menu")). Render on demand.
export const instant = false;

interface CategoryRow { slug: string; name: string }
interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  badge: string;
  image_url: string | null;
  category_slug: string;
}

// The public menu reads from the DB. Admin actions call revalidatePath("/menu")
// after any change, so the page refreshes automatically. With Cache Components
// enabled we rely on that on-demand invalidation instead of a time-based revalidate.

async function getMenuData() {
  const categories = await query<CategoryRow>(`
    SELECT slug, name FROM categories WHERE is_active = true ORDER BY sort_order
  `);

  const products = await query<ProductRow>(`
    SELECT p.id, p.name, p.description, p.price::float8 AS price, p.badge, p.image_url,
           c.slug AS category_slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = true AND p.deleted_at IS NULL
    ORDER BY p.sort_order, p.created_at DESC
  `);

  // Group products by category slug.
  const itemsByCategory: Record<string, MenuItem[]> = {};
  for (const p of products) {
    const item: MenuItem = {
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      badge: p.badge,
      image_url: p.image_url,
    };
    if (!itemsByCategory[p.category_slug]) itemsByCategory[p.category_slug] = [];
    itemsByCategory[p.category_slug].push(item);
  }

  // Only keep categories that have at least one product OR are always shown.
  // We keep all active categories so the tabs match the admin categories.
  const cats: MenuCategory[] = categories.map((c) => ({ slug: c.slug, name: c.name }));

  return { categories: cats, itemsByCategory };
}

export default async function MenuPage() {
  const { categories, itemsByCategory } = await getMenuData();
  return <MenuClient categories={categories} itemsByCategory={itemsByCategory} />;
}
