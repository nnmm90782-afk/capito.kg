import { query } from "@/lib/db";
import ReviewsClient, { type ReviewItem, type BranchItem } from "./ReviewsClient";

export const instant = false;

async function getPublishedReviews(): Promise<ReviewItem[]> {
  return query<ReviewItem>(`
    SELECT
      r.id, r.rating, r.text,
      COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), 'Гость') AS user_name,
      br.name AS branch_name,
      TO_CHAR(r.created_at, 'DD.MM.YYYY') AS created_at
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    LEFT JOIN branches br ON br.id = r.branch_id
    WHERE r.status = 'PUBLISHED'
    ORDER BY r.created_at DESC
  `);
}

async function getBranches(): Promise<BranchItem[]> {
  return query<BranchItem>(`SELECT slug, name FROM branches WHERE is_active = true ORDER BY name`);
}

export default async function ReviewsPage() {
  const [reviews, branches] = await Promise.all([getPublishedReviews(), getBranches()]);
  return <ReviewsClient reviews={reviews} branches={branches} />;
}
