import { getLanguageName } from "../../lib/utils/language";

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

interface UsersTableProps {
  users: User[];
  onToggleAdmin: (userId: number, isAdmin: number) => void;
  onResetPassword: (userId: number) => void;
  onDeleteUser: (userId: number) => void;
}

export default function UsersTable({
  users,
  onToggleAdmin,
  onResetPassword,
  onDeleteUser,
}: UsersTableProps) {
  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Existing Users</h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Username</th>
                <th>Display Name</th>
                <th>Learning Language</th>
                <th>Admin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.display_name || "-"}</td>
                  <td>
                    {user.learning_language
                      ? getLanguageName(user.learning_language)
                      : "-"}
                  </td>
                  <td>
                    {user.is_admin ? (
                      <span className="badge">Admin</span>
                    ) : (
                      <span className="badge">User</span>
                    )}
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        className={`btn btn-sm ${user.is_admin ? "btn-warning" : "btn-primary"}`}
                        onClick={() => onToggleAdmin(user.id, user.is_admin)}
                      >
                        {user.is_admin ? "Demote" : "Promote"}
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onResetPassword(user.id)}
                      >
                        Reset Password
                      </button>
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => onDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
