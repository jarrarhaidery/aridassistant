"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const action = newRole === "admin" ? "promote to admin" : "remove admin access";

    if (!confirm(`Are you sure you want to ${action}?`)) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setMessage(`User ${action} successfully`);
        setMessageType("success");
        fetchUsers();
        setTimeout(() => {
          setMessage("");
          setMessageType("");
        }, 3000);
      } else {
        setMessage("Failed to update user role");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      setMessage("Error updating user role");
      setMessageType("error");
    }
  };

  const deleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This cannot be undone.`)) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage(`User "${userName}" deleted successfully`);
        setMessageType("success");
        fetchUsers();
        setTimeout(() => {
          setMessage("");
          setMessageType("");
        }, 3000);
      } else {
        setMessage("Failed to delete user");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage("Error deleting user");
      setMessageType("error");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          User Management
        </h1>
        <p className="text-sm text-gray-600">
          Manage users and admin permissions
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 border ${
            messageType === "success"
              ? "bg-green-50 border-green-200 text-green-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Total Users
          </p>
          <p className="text-3xl font-semibold text-gray-900">{users.length}</p>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Administrators
          </p>
          <p className="text-3xl font-semibold text-gray-900">
            {users.filter((u) => u.role === "admin").length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Regular Users
          </p>
          <p className="text-3xl font-semibold text-gray-900">
            {users.filter((u) => u.role === "user").length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleAdmin(user.id, user.role)}
                        className={`px-4 py-2 text-sm font-medium transition-all ${
                          user.role === "admin"
                            ? "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
                            : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                        }`}
                      >
                        {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id, user.name)}
                        className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-sm font-medium transition-all"
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

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}