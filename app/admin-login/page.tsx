// Disable static prerendering — this page is dynamic (session check happens at request time)
export const instant = false;

import AdminLoginClient from "./AdminLoginClient";

export default function AdminLoginPage() {
  return <AdminLoginClient />;
}
