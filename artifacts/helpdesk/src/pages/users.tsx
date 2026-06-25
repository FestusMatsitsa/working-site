import { useState } from "react";
import {
  useListUsers, getListUsersQueryKey,
} from "@workspace/api-client-react";
import { Search, User, Mail, Phone, Shield } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  technician: "bg-blue-100 text-blue-700",
  staff: "bg-gray-100 text-gray-600",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield className="w-3 h-3" />,
  technician: <User className="w-3 h-3" />,
  staff: <User className="w-3 h-3" />,
};

export default function Users() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const { data: users = [] } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });

  const filtered = users.filter(u => {
    const matchSearch = search === "" ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department ?? "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const admins = users.filter(u => u.role === "admin").length;
  const technicians = users.filter(u => u.role === "technician").length;
  const staff = users.filter(u => u.role === "staff").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Directory</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} staff member{users.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card shadow-sm">
          <p className="text-sm text-muted-foreground">Administrators</p>
          <p className="text-3xl font-bold text-purple-600">{admins}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card shadow-sm">
          <p className="text-sm text-muted-foreground">Technicians</p>
          <p className="text-3xl font-bold text-blue-600">{technicians}</p>
        </div>
        <div className="border rounded-lg p-4 bg-card shadow-sm">
          <p className="text-sm text-muted-foreground">Staff</p>
          <p className="text-3xl font-bold">{staff}</p>
        </div>
      </div>

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
        <select className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="technician">Technician</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-muted-foreground">No staff found</div>
        ) : (
          filtered.map(user => (
            <div key={user.id} className="border rounded-lg bg-card shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-lg">
                    {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{user.name}</h3>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${ROLE_COLORS[user.role ?? ""] ?? ""}`}>
                      {ROLE_ICONS[user.role ?? ""]}
                      {user.role}
                    </span>
                  </div>
                  {user.jobTitle && <p className="text-sm text-muted-foreground">{user.jobTitle}</p>}
                  {user.department && <p className="text-xs text-muted-foreground">{user.department}</p>}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
