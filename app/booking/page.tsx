import { query } from "@/lib/db";
import BookingClient, { type Branch } from "./BookingClient";

export const instant = false;

async function getBranches(): Promise<Branch[]> {
  return query<Branch>(`
    SELECT id, name, address FROM branches WHERE is_active = true ORDER BY name
  `);
}

export default async function BookingPage() {
  const branches = await getBranches();
  return <BookingClient branches={branches} />;
}
