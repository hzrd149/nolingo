import UsersTab from "@/components/admin/UsersTab";
import AdminLayout from "@/components/admin/AdminLayout";

export default function UsersDashboard() {
  return (
    <AdminLayout title="Admin" tab="users">
      <div className="flex-grow overflow-auto">
        <UsersTab />
      </div>
    </AdminLayout>
  );
}
