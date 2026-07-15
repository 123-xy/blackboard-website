"use client";

import { useEffect, useState } from "react";
import { formatDateShort } from "@/lib/utils";
import {
  getAdminUsersAction,
  createAdminUserAction,
  updateAdminUserRoleAction,
  deleteAdminUserAction,
} from "@/app/actions/admin-user-actions";

type AdminUserRow = { id: string; email: string; name: string | null; role: "ADMIN" | "STAFF"; createdAt: string };

const fieldClasses =
  "w-full rounded-lg border border-card-border bg-cream-input px-3.5 py-2.5 text-sm text-heading focus:border-gold focus:outline-none";

export default function AdminUsersPanel({ currentUserId }: { currentUserId?: string }) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const refresh = () => {
    getAdminUsersAction().then((result) => {
      if (result.ok) setUsers(result.users);
      setLoading(false);
    });
  };

  useEffect(refresh, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError("");
    const result = await createAdminUserAction({ email, password, name, role });
    setCreating(false);
    if (result.ok) {
      setShowForm(false);
      setEmail("");
      setPassword("");
      setName("");
      setRole("STAFF");
      refresh();
    } else {
      setFormError(result.error || "Failed to create user");
    }
  };

  const handleRoleChange = async (id: string, newRole: "ADMIN" | "STAFF") => {
    setBusyId(id);
    await updateAdminUserRoleAction(id, newRole);
    setBusyId(null);
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this team member's access?")) return;
    setBusyId(id);
    await deleteAdminUserAction(id);
    setBusyId(null);
    refresh();
  };

  if (loading) {
    return <div className="py-10 text-center text-sm text-muted">Loading team…</div>;
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-sm text-muted">
          Admins can manage everything, including settings and other logins. Staff can view and update reservations
          & inquiries but can&apos;t delete or change configuration.
        </p>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex-none rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-dark shadow-[0_4px_0_#C97F16]"
        >
          {showForm ? "Cancel" : "+ Add Team Member"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-[16px] border border-card-border bg-surface p-6">
          <div className="mb-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-heading">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClasses} />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-heading">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClasses} />
            </div>
          </div>
          <div className="mb-4 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-heading">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClasses}
              />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-heading">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as "ADMIN" | "STAFF")} className={fieldClasses}>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          {formError && <p className="mb-4 text-sm text-error">{formError}</p>}
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-gold px-6 py-3 text-sm font-bold tracking-[0.5px] text-dark shadow-[0_4px_0_#C97F16] disabled:opacity-50"
          >
            {creating ? "CREATING…" : "CREATE LOGIN"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-[16px] border border-card-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-card-border">
                <th className="px-4 py-3 text-xs font-bold tracking-[0.5px] text-muted uppercase">Name / Email</th>
                <th className="px-4 py-3 text-xs font-bold tracking-[0.5px] text-muted uppercase">Role</th>
                <th className="px-4 py-3 text-xs font-bold tracking-[0.5px] text-muted uppercase">Added</th>
                <th className="px-4 py-3 text-xs font-bold tracking-[0.5px] text-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const busy = busyId === u.id;
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="border-b border-card-border last:border-b-0 hover:bg-cream-input/50">
                    <td className="px-4 py-3.5">
                      <div className="text-sm font-semibold text-heading">{u.name || u.email}</div>
                      <div className="text-xs text-muted">
                        {u.email} {isSelf && "(you)"}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={u.role}
                        disabled={busy || isSelf}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as "ADMIN" | "STAFF")}
                        className="rounded-lg border border-card-border bg-cream-input px-2 py-1.5 text-xs text-heading"
                      >
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted">{formatDateShort(u.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <button
                        disabled={busy || isSelf}
                        onClick={() => handleDelete(u.id)}
                        className="rounded-lg border border-error/30 px-2.5 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
