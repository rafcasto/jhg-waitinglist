import AdminClient from "./admin-client";

export const metadata = {
  title: "Admin — JobHackers.global",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
