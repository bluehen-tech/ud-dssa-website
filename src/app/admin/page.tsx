"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: string;
  email: string;
  admin_flag: boolean;
  email_access_flag: boolean;
  created_at: string;
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`
        relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-primary focus:ring-offset-2
        ${checked ? "bg-blue-primary" : "bg-gray-200"}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0
          transition duration-200 ease-in-out
          ${checked ? "translate-x-5" : "translate-x-0"}
        `}
      />
    </button>
  );
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-primary rounded-lg hover:bg-blue-800 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-48" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-16" />
          </td>
          <td className="px-6 py-4">
            <div className="h-6 bg-gray-200 rounded-full w-11" />
          </td>
          <td className="px-6 py-4">
            <div className="h-6 bg-gray-200 rounded-full w-11" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-24" />
          </td>
        </tr>
      ))}
    </>
  );
}

export default function AdminPage() {
  const { session, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [confirm, setConfirm] = useState<{
    userId: string;
    email: string;
    field: "admin_flag" | "email_access_flag";
    newValue: boolean;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && (!session || !isAdmin)) {
      router.replace("/");
    }
  }, [authLoading, session, isAdmin, router]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch users");
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session && isAdmin) {
      fetchUsers();
    }
  }, [session, isAdmin, fetchUsers]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggle = (userId: string, email: string, field: "admin_flag" | "email_access_flag", currentValue: boolean) => {
    const newValue = !currentValue;

    if (field === "admin_flag" && userId === session?.user.id && !newValue) {
      return;
    }

    setConfirm({ userId, email, field, newValue });
  };

  const executeToggle = async () => {
    if (!confirm) return;
    const { userId, field, newValue } = confirm;
    setConfirm(null);

    setUpdatingIds((prev) => new Set(prev).add(userId));

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, [field]: newValue } : u))
    );

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, [field]: newValue }),
      });
      const data = await res.json();

      if (!data.success) {
        // Revert optimistic update
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, [field]: !newValue } : u))
        );
        showToast(data.message || "Update failed", "error");
      } else {
        showToast(data.message, "success");
      }
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, [field]: !newValue } : u))
      );
      showToast("Network error — please try again", "error");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const filteredUsers = users.filter((u) =>
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const confirmTitle = confirm
    ? confirm.field === "admin_flag"
      ? confirm.newValue
        ? "Grant Admin Access"
        : "Remove Admin Access"
      : confirm.newValue
        ? "Grant Email Access"
        : "Remove Email Access"
    : "";

  const confirmMessage = confirm
    ? confirm.field === "admin_flag"
      ? confirm.newValue
        ? `Are you sure you want to make ${confirm.email} an admin? They will have full administrative privileges.`
        : `Are you sure you want to remove admin access from ${confirm.email}?`
      : confirm.newValue
        ? `Are you sure you want to grant email access to ${confirm.email}? They will be able to compose and send emails.`
        : `Are you sure you want to remove email access from ${confirm.email}?`
    : "";

  const getRoleBadge = (user: UserProfile) => {
    if (user.admin_flag) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Admin
        </span>
      );
    }
    if (user.email_access_flag) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Email Manager
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Member
      </span>
    );
  };

  if (authLoading || !session || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
          <h1 className="text-4xl font-bold text-blue-primary mb-2">
            User Management
          </h1>
          <p className="text-xl text-gray-600">
            Manage admin access and email permissions for all users.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Only users who have signed in with their @udel.edu email appear here. If someone is missing, ask them to sign in first.
          </p>
        </div>

        {/* Search + summary */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-blue-primary focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}</span>
              <span className="text-gray-300">|</span>
              <span>{users.filter((u) => u.admin_flag).length} admin{users.filter((u) => u.admin_flag).length !== 1 ? "s" : ""}</span>
              <span className="text-gray-300">|</span>
              <span>{users.filter((u) => u.email_access_flag && !u.admin_flag).length} email manager{users.filter((u) => u.email_access_flag && !u.admin_flag).length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button
              onClick={fetchUsers}
              className="text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email Access
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member Since
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <SkeletonRows />
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {search ? "No users match your search." : "No users found."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelf = user.id === session.user.id;
                  const isUpdating = updatingIds.has(user.id);

                  return (
                    <tr key={user.id} className={`hover:bg-gray-50 ${isSelf ? "bg-blue-50/40" : ""}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {user.email}
                          </span>
                          {isSelf && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                              you
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={user.admin_flag}
                            onChange={() => handleToggle(user.id, user.email, "admin_flag", user.admin_flag)}
                            disabled={isUpdating || (isSelf && user.admin_flag)}
                            label={`Toggle admin for ${user.email}`}
                          />
                          {isSelf && user.admin_flag && (
                            <span className="text-xs text-gray-400" title="You cannot remove your own admin access">
                              locked
                            </span>
                          )}
                          {isUpdating && (
                            <span className="animate-spin h-4 w-4 border-2 border-blue-primary border-t-transparent rounded-full" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={user.email_access_flag || user.admin_flag}
                            onChange={() => handleToggle(user.id, user.email, "email_access_flag", user.email_access_flag)}
                            disabled={isUpdating || user.admin_flag}
                            label={`Toggle email access for ${user.email}`}
                          />
                          {user.admin_flag && (
                            <span className="text-xs text-gray-400" title="Admins always have email access">
                              via admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card layout */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-48 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
                <div className="flex gap-4">
                  <div className="h-6 bg-gray-200 rounded-full w-11" />
                  <div className="h-6 bg-gray-200 rounded-full w-11" />
                </div>
              </div>
            ))
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              {search ? "No users match your search." : "No users found."}
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelf = user.id === session.user.id;
              const isUpdating = updatingIds.has(user.id);

              return (
                <div
                  key={user.id}
                  className={`bg-white rounded-lg shadow-md p-4 ${isSelf ? "ring-2 ring-blue-primary/20" : ""}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {user.email}
                      </span>
                      {isSelf && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 shrink-0">
                          you
                        </span>
                      )}
                    </div>
                    {getRoleBadge(user)}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={user.admin_flag}
                        onChange={() => handleToggle(user.id, user.email, "admin_flag", user.admin_flag)}
                        disabled={isUpdating || (isSelf && user.admin_flag)}
                        label={`Toggle admin for ${user.email}`}
                      />
                      <span className="text-xs text-gray-500">Admin</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Toggle
                        checked={user.email_access_flag || user.admin_flag}
                        onChange={() => handleToggle(user.id, user.email, "email_access_flag", user.email_access_flag)}
                        disabled={isUpdating || user.admin_flag}
                        label={`Toggle email access for ${user.email}`}
                      />
                      <span className="text-xs text-gray-500">Email</span>
                    </div>
                    {isUpdating && (
                      <span className="animate-spin h-4 w-4 border-2 border-blue-primary border-t-transparent rounded-full" />
                    )}
                  </div>

                  <div className="mt-2 text-xs text-gray-400">
                    Joined{" "}
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-6">
          <Link
            href="/"
            className="px-4 py-2 text-blue-primary hover:text-blue-800 hover:underline"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Confirmation modal */}
      <ConfirmModal
        open={!!confirm}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel="Confirm"
        onConfirm={executeToggle}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
