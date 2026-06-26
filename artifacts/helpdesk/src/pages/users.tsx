import { useState } from "react";
import {
  useListUsers, getListUsersQueryKey,
  useCreateUser, useUpdateUser, useSendUserResetLink,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/context/auth";
import {
  Search, Shield, User as UserIcon, Mail, Phone,
  UserPlus, MoreVertical, KeyRound, UserX, UserCheck, Pencil,
  Copy, Check, X,
} from "lucide-react";
import type { UserInput, UserUpdate } from "@workspace/api-client-react";

// ── Role config ──────────────────────────────────────────────────────────────

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "ict_officer", label: "ICT Officer" },
  { value: "user", label: "Staff" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  ict_officer: "bg-blue-100 text-blue-700",
  user: "bg-gray-100 text-gray-600",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  ict_officer: "ICT Officer",
  user: "Staff",
};

// ── Shared input style ────────────────────────────────────────────────────────
const inputCls = "w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring";

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

// ── Action menu for each user card ────────────────────────────────────────────
function UserMenu({
  user,
  isCurrentUser,
  onEdit,
  onToggleActive,
  onResetLink,
}: {
  user: { id: number; name: string; isActive: boolean };
  isCurrentUser: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onResetLink: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
        title="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-card border rounded-lg shadow-lg py-1 w-48">
            <button
              onClick={() => { setOpen(false); onEdit(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit details
            </button>
            <button
              onClick={() => { setOpen(false); onResetLink(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" /> Send reset link
            </button>
            {!isCurrentUser && (
              <>
                <div className="border-t my-1" />
                <button
                  onClick={() => { setOpen(false); onToggleActive(); }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                    user.isActive
                      ? "hover:bg-destructive/10 text-destructive"
                      : "hover:bg-green-50 text-green-700"
                  }`}
                >
                  {user.isActive
                    ? <><UserX className="w-3.5 h-3.5" /> Deactivate</>
                    : <><UserCheck className="w-3.5 h-3.5" /> Reactivate</>
                  }
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Reset link result dialog ──────────────────────────────────────────────────
function ResetLinkDialog({
  url,
  userName,
  onClose,
}: { url: string; userName: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Reset link sent</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-muted-foreground">
          A password reset email has been sent to <strong>{userName}</strong>. If email delivery fails, share this link directly — it expires in 60 minutes.
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 border rounded-md px-3 py-2 text-xs bg-muted font-mono truncate focus:outline-none"
          />
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-3 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors flex-shrink-0"
          >
            {copied ? <><Check className="w-3.5 h-3.5 text-green-600" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ── Create user modal ─────────────────────────────────────────────────────────
function CreateUserModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { mutate: createUser, isPending } = useCreateUser();
  const [form, setForm] = useState<Partial<UserInput>>({ role: "user", department: "" });

  function set(field: keyof UserInput, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.role || !form.department) return;
    createUser(
      { data: form as UserInput },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
          onClose();
        },
      }
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-base">New Staff Account</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <Field label="Full name *">
            <input required className={inputCls} value={form.name ?? ""} onChange={e => set("name", e.target.value)} placeholder="e.g. John Mwenda" />
          </Field>
          <Field label="Email address *">
            <input required type="email" className={inputCls} value={form.email ?? ""} onChange={e => set("email", e.target.value)} placeholder="john.mwenda@kilifi.go.ke" />
          </Field>
          <Field label="Role *">
            <select required className={inputCls} value={form.role ?? "user"} onChange={e => set("role", e.target.value)}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Department *">
            <input required className={inputCls} value={form.department ?? ""} onChange={e => set("department", e.target.value)} placeholder="e.g. Finance" />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={form.phone ?? ""} onChange={e => set("phone", e.target.value)} placeholder="+254 7XX XXX XXX" />
          </Field>
          <p className="text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
            The new staff member can set their own password on first sign-in.
          </p>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border rounded-md py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {isPending ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit user modal ────────────────────────────────────────────────────────────
function EditUserModal({
  user,
  onClose,
}: {
  user: { id: number; name: string; email: string; role: string; department: string; phone?: string | null };
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { mutate: updateUser, isPending } = useUpdateUser();
  const [form, setForm] = useState<UserUpdate>({
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    phone: user.phone ?? "",
  });

  function set(field: keyof UserUpdate, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    updateUser(
      { id: user.id, data: form },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
          onClose();
        },
      }
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-semibold text-base">Edit Staff Account</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <Field label="Full name">
            <input className={inputCls} value={form.name ?? ""} onChange={e => set("name", e.target.value)} />
          </Field>
          <Field label="Email address">
            <input type="email" className={inputCls} value={form.email ?? ""} onChange={e => set("email", e.target.value)} />
          </Field>
          <Field label="Role">
            <select className={inputCls} value={form.role ?? ""} onChange={e => set("role", e.target.value)}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Department">
            <input className={inputCls} value={form.department ?? ""} onChange={e => set("department", e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className={inputCls} value={form.phone ?? ""} onChange={e => set("phone", e.target.value)} />
          </Field>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border rounded-md py-2 text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Users() {
  const me = useCurrentUser();
  const isAdmin = me?.role === "admin";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<typeof users[0] | null>(null);
  const [resetLinkResult, setResetLinkResult] = useState<{ url: string; name: string } | null>(null);

  const qc = useQueryClient();
  const { data: users = [] } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });
  const { mutate: updateUser } = useUpdateUser();
  const { mutate: sendReset, isPending: isResetting } = useSendUserResetLink();

  const filtered = users.filter(u => {
    const matchSearch = search === "" ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = {
    admin: users.filter(u => u.role === "admin").length,
    ict_officer: users.filter(u => u.role === "ict_officer").length,
    user: users.filter(u => u.role === "user").length,
    inactive: users.filter(u => !u.isActive).length,
  };

  function toggleActive(u: typeof users[0]) {
    updateUser(
      { id: u.id, data: { isActive: !u.isActive } },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getListUsersQueryKey() }) }
    );
  }

  function handleSendReset(u: typeof users[0]) {
    sendReset(
      { id: u.id },
      {
        onSuccess: (data) => {
          setResetLinkResult({ url: (data as { resetUrl: string }).resetUrl, name: u.name });
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} staff member{users.length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> New Staff
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4 bg-card shadow-sm">
          <p className="text-sm text-muted-foreground">Administrators</p>
          <p className="text-3xl font-bold text-red-600">{counts.admin}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card shadow-sm">
          <p className="text-sm text-muted-foreground">ICT Officers</p>
          <p className="text-3xl font-bold text-blue-600">{counts.ict_officer}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card shadow-sm">
          <p className="text-sm text-muted-foreground">Staff</p>
          <p className="text-3xl font-bold">{counts.user}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card shadow-sm">
          <p className="text-sm text-muted-foreground">Inactive</p>
          <p className="text-3xl font-bold text-muted-foreground">{counts.inactive}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* User cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">No staff found</div>
        ) : (
          filtered.map(user => (
            <div
              key={user.id}
              className={`border rounded-lg bg-card shadow-sm p-5 transition-shadow hover:shadow-md ${!user.isActive ? "opacity-60" : ""}`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-base ${user.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <h3 className="font-semibold text-sm truncate">{user.name}</h3>
                    {!user.isActive && (
                      <span className="text-[10px] font-medium bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded flex-shrink-0">Inactive</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role ?? ""] ?? "bg-gray-100 text-gray-600"}`}>
                      {ROLE_LABELS[user.role ?? ""] ?? user.role}
                    </span>
                    {user.department && (
                      <span className="text-xs text-muted-foreground truncate">{user.department}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin menu */}
                {isAdmin && (
                  <UserMenu
                    user={user}
                    isCurrentUser={user.id === me?.id}
                    onEdit={() => setEditUser(user)}
                    onToggleActive={() => toggleActive(user)}
                    onResetLink={() => handleSendReset(user)}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} />}
      {resetLinkResult && (
        <ResetLinkDialog
          url={resetLinkResult.url}
          userName={resetLinkResult.name}
          onClose={() => setResetLinkResult(null)}
        />
      )}
    </div>
  );
}
