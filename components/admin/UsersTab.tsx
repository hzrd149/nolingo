import { useEffect, useState } from "react";
import CreateUserForm from "./CreateUserForm";
import UsersTable from "./UsersTable";
import { ErrorIcon } from "../Icons";

interface User {
  id: number;
  username: string;
  display_name?: string;
  about?: string;
  location?: string;
  website?: string;
  learning_language?: string;
  is_admin: number;
  created_at: string;
  updated_at: string;
}

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch all users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error(await res.text());

      // Refresh users list
      fetchUsers();

      // User deleted successfully, refresh users list
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    }
  };

  const handleToggleAdmin = async (userId: number, isAdmin: number) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, is_admin: !isAdmin }),
      });

      if (!res.ok) throw new Error(await res.text());

      // Refresh users list
      fetchUsers();

      // User admin status updated successfully, refresh users list
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    }
  };

  const handleResetPassword = async (userId: number) => {
    const newPassword = prompt("Enter new password:");
    if (!newPassword) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, password: newPassword }),
      });

      if (!res.ok) throw new Error(await res.text());

      // Password reset successfully
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="loading loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <ErrorIcon />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Create User
        </button>
      </div>

      {showCreateForm && (
        <CreateUserForm
          onUserCreated={() => {
            fetchUsers();
            setShowCreateForm(false);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <UsersTable
        users={users}
        onToggleAdmin={handleToggleAdmin}
        onResetPassword={handleResetPassword}
        onDeleteUser={handleDeleteUser}
      />
    </div>
  );
}
