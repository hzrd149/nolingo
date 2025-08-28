import { useState } from "react";
import FormSelect from "@/components/ui/FormSelect";
import ISO6391 from "iso-639-1";

interface CreateUserFormProps {
  onUserCreated: () => void;
  onCancel: () => void;
}

const LANGUAGE_OPTIONS = ISO6391.getAllNames()
  .map((name) => ({
    value: ISO6391.getCode(name),
    label: name,
  }))
  .filter((lang) => lang.value) // Filter out any undefined codes
  .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically by name

export default function CreateUserForm({
  onUserCreated,
  onCancel,
}: CreateUserFormProps) {
  const [newUser, setNewUser] = useState({
    username: "",
    display_name: "",
    password: "",
    learning_language: "",
    is_admin: false,
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) throw new Error(await res.text());

      // Reset form
      setNewUser({
        username: "",
        display_name: "",
        password: "",
        learning_language: "",
        is_admin: false,
      });

      // Notify parent component
      onUserCreated();
    } catch (err: any) {
      alert(err.message || "Failed to create user");
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Create New User</h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                placeholder="Username"
                className="input"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="label">Display Name</label>
              <input
                type="text"
                placeholder="Display Name"
                className="input"
                value={newUser.display_name}
                onChange={(e) =>
                  setNewUser({ ...newUser, display_name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                placeholder="Leave blank to auto-generate"
                className="input"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />
            </div>

            <div>
              <FormSelect
                label="Learning Language"
                value={newUser.learning_language}
                onChange={(value) =>
                  setNewUser({ ...newUser, learning_language: value })
                }
                options={LANGUAGE_OPTIONS}
                placeholder="Select a language"
                searchable={true}
              />
            </div>

            <div>
              <label className="label">Admin</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={newUser.is_admin}
                  onChange={(e) =>
                    setNewUser({ ...newUser, is_admin: e.target.checked })
                  }
                />
                <span className="ml-2">Make this user an admin</span>
              </div>
            </div>
          </div>

          <div className="card-actions justify-end space-x-2">
            <button type="button" className="btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn">
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
