"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Download,
  RefreshCw,
  Users,
  Building2,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Filter,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";

interface Organization {
  id: string;
  name: string;
  email: string;
  timezone: string;
  web_chat_plan: "free" | "pro";
  web_chat_status: "active" | "inactive" | "cancelled" | "past_due";
  web_chat_period_end: string | null;
  web_chat_payment_method: string | null;
  web_chat_provider: "stripe" | "paystack" | null;
  web_chat_created_at: string | null;
  web_chat_cancelled_at: string | null;
  web_chat_updated_at: string | null;
  stripe_customer_id: string | null;
  paypal_customer_id: string | null;
  owner_email: string;
  owner_phone: string | null;
  created_at: string;
  updated_at: string;
  user_count?: number;
}

interface User {
  id: string;
  organization_id: string;
  name: string | null;
  email: string;
  image: string | null;
  created_at: string;
}

interface SubscriptionStats {
  totalOrganizations: number;
  activeSubscriptions: number;
  freePlan: number;
  proPlan: number;
  totalUsers: number;
  recentSignups: number;
}

export default function AdminSubscriptionsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Organization>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [stats, setStats] = useState<SubscriptionStats>({
    totalOrganizations: 0,
    activeSubscriptions: 0,
    freePlan: 0,
    proPlan: 0,
    totalUsers: 0,
    recentSignups: 0,
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    filterAndSortOrganizations();
  }, [organizations, searchTerm, planFilter, statusFilter, sortField, sortDirection]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/organizations", {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch organizations");

      const data = await response.json();

      // ✅ Fix: API returns { organizations, pagination, stats } — not a bare array
      const orgs: Organization[] = data.organizations ?? [];
      setOrganizations(orgs);
      calculateStats(orgs, data.stats);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to load organizations", {
        description: "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationUsers = async (orgId: string) => {
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/users`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setOrgUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  };

 

  const calculateStats = (orgs: Organization[], apiStats?: any) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    setStats({
      totalOrganizations: apiStats?.total_organizations ?? orgs.length,
      activeSubscriptions: apiStats?.active_subscriptions ?? orgs.filter((o) => o.web_chat_status === "active").length,
      freePlan: apiStats?.free_plan ?? orgs.filter((o) => o.web_chat_plan === "free").length,
      proPlan: apiStats?.pro_plan ?? orgs.filter((o) => o.web_chat_plan === "pro").length,
      totalUsers: apiStats?.total_users ?? 0,
      recentSignups: apiStats?.recent_signups ?? orgs.filter((o) => new Date(o.created_at) > thirtyDaysAgo).length,
    });
  };

  const filterAndSortOrganizations = () => {
    // ✅ Fix: Guard against non-array state during initial render
    if (!Array.isArray(organizations)) return;

    let filtered = [...organizations];

    if (searchTerm) {
      filtered = filtered.filter(
        (org) =>
          org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          org.owner_email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (planFilter !== "all") {
      filtered = filtered.filter((org) => org.web_chat_plan === planFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((org) => org.web_chat_status === statusFilter);
    }

    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

    setFilteredOrgs(filtered);
  };

  const handleSort = (field: keyof Organization) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleViewUsers = async (org: Organization) => {
    setSelectedOrg(org);
    await fetchOrganizationUsers(org.id);
    setShowUserDialog(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const handleExport = () => {
    const csv = [
      ["Organization", "Email", "Plan", "Status", "Owner Email", "Created At", "Period End"],
      ...filteredOrgs.map((org) => [
        org.name,
        org.email,
        org.web_chat_plan,
        org.web_chat_status,
        org.owner_email,
        formatDate(org.created_at),
        formatDate(org.web_chat_period_end),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscriptions_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const SortIcon = ({ field }: { field: keyof Organization }) => {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-30" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3 text-zinc-900" />
    ) : (
      <ChevronDown className="h-3 w-3 text-zinc-900" />
    );
  };

  const statusConfig: Record<string, { label: string; dot: string; text: string; bg: string }> = {
    active:   { label: "Active",   dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    inactive: { label: "Inactive", dot: "bg-zinc-400",    text: "text-zinc-600",   bg: "bg-zinc-100 border-zinc-200" },
    cancelled:{ label: "Cancelled",dot: "bg-red-400",     text: "text-red-700",    bg: "bg-red-50 border-red-200" },
    past_due: { label: "Past Due", dot: "bg-amber-400",   text: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = statusConfig[status] ?? { label: status, dot: "bg-zinc-400", text: "text-zinc-600", bg: "bg-zinc-100 border-zinc-200" };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  };

  const PlanBadge = ({ plan }: { plan: string }) => (
    plan === "pro" ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-violet-50 border border-violet-200 text-violet-700 tracking-wide">
        ✦ PRO
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 border border-zinc-200 text-zinc-500 tracking-wide">
        FREE
      </span>
    )
  );

  const activeRate = stats.totalOrganizations > 0
    ? ((stats.activeSubscriptions / stats.totalOrganizations) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-[#f8f8f6]" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .stat-card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
        .stat-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.07); transform: translateY(-1px); }
        .row-hover:hover td { background: #f3f3f0; }
        .fade-in { animation: fadeIn 0.35s ease both; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .stagger-1 { animation-delay: 0.05s; }
        .stagger-2 { animation-delay: 0.1s; }
        .stagger-3 { animation-delay: 0.15s; }
        .stagger-4 { animation-delay: 0.2s; }
        th { user-select: none; }
        .shimmer { background: linear-gradient(90deg,#ebebea 25%,#f3f3f1 50%,#ebebea 75%); background-size:200% 100%; animation: shimmer 1.4s infinite; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <div className="max-w-330 mx-auto px-6 py-10 space-y-7">

        {/* Header */}
        <div className="fade-in flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 mb-1">Admin Panel</p>
            <h1 className="text-[2rem] font-bold text-zinc-900 leading-tight tracking-tight">Subscriptions</h1>
            <p className="text-sm text-zinc-500 mt-1">Monitor organizations, plans, and billing status.</p>
          </div>
          <div className="flex gap-2 mt-1">
            <button
              onClick={fetchOrganizations}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <Download className="h-3.5 w-3.5 " />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Organizations",
              value: stats.totalOrganizations,
              sub: `+${stats.recentSignups} this month`,
              icon: <Building2 className="h-4 w-4" />,
              iconBg: "bg-blue-50 text-blue-600",
              delay: "stagger-1",
            },
            {
              label: "Active Subscriptions",
              value: stats.activeSubscriptions,
              sub: `${activeRate}% of total`,
              icon: <CheckCircle className="h-4 w-4" />,
              iconBg: "bg-emerald-50 text-emerald-600",
              delay: "stagger-2",
            },
            {
              label: "Plan Split",
              value: `${stats.proPlan} Pro`,
              sub: `${stats.freePlan} Free`,
              icon: <CreditCard className="h-4 w-4" />,
              iconBg: "bg-violet-50 text-violet-600",
              delay: "stagger-3",
            },
            {
              label: "Total Users",
              value: stats.totalUsers,
              sub: "Across all orgs",
              icon: <Users className="h-4 w-4" />,
              iconBg: "bg-amber-50 text-amber-600",
              delay: "stagger-4",
            },
          ].map((s) => (
            <div key={s.label} className={`stat-card fade-in ${s.delay} bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm`}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{s.label}</p>
                <div className={`p-2 rounded-lg ${s.iconBg}`}>{s.icon}</div>
              </div>
              <p className="text-2xl font-bold text-zinc-900 tracking-tight">{s.value}</p>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />{s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="fade-in stagger-2 bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                placeholder="Search organizations…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5  text-zinc-900 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition-colors"
              />
            </div>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="rounded-xl border-zinc-200 bg-zinc-50 text-sm text-zinc-900 h-10">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-xl border-zinc-200 bg-zinc-50 text-zinc-900 text-sm h-10">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-zinc-400 px-1">
              <Filter className="h-3.5 w-3.5" />
              <span><span className="font-semibold text-zinc-700">{filteredOrgs.length}</span> organizations</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="fade-in stagger-3 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100">
                {[
                  { label: "Organization", field: "name" as keyof Organization },
                  { label: "Plan", field: "web_chat_plan" as keyof Organization },
                  { label: "Status", field: "web_chat_status" as keyof Organization },
                  { label: "Owner", field: null },
                  { label: "Created", field: "created_at" as keyof Organization },
                  { label: "Period End", field: "web_chat_period_end" as keyof Organization },
                  { label: "Provider", field: null },
                  { label: "", field: null },
                ].map((col) => (
                  <th
                    key={col.label}
                    onClick={() => col.field && handleSort(col.field)}
                    className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 ${col.field ? "cursor-pointer hover:text-zinc-700 transition-colors" : ""}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.field && <SortIcon field={col.field} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className={`h-4 rounded shimmer ${j === 0 ? "w-36" : "w-20"}`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-sm text-zinc-400">
                    No organizations found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr key={org.id} className="row-hover transition-colors cursor-default">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-sm text-zinc-900">{org.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>{org.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <PlanBadge plan={org.web_chat_plan} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={org.web_chat_status} />
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-zinc-700">{org.owner_email}</p>
                      {org.owner_phone && (
                        <p className="text-xs text-zinc-400 mt-0.5">{org.owner_phone}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-500">{formatDate(org.created_at)}</td>
                    <td className="px-5 py-4">
                      {org.web_chat_period_end ? (
                        <div className="flex items-center gap-1.5 text-sm text-zinc-500">
                          <Calendar className="h-3.5 w-3.5 text-zinc-300" />
                          {formatDate(org.web_chat_period_end)}
                        </div>
                      ) : (
                        <span className="text-zinc-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {org.web_chat_provider ? (
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-zinc-100 border border-zinc-200 text-zinc-600 rounded-lg">
                          {org.web_chat_provider}
                        </span>
                      ) : (
                        <span className="text-zinc-300 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-zinc-200">
                          <DropdownMenuLabel className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewUsers(org)} className="text-sm cursor-pointer">
                            <Users className="h-4 w-4 mr-2" />
                            View Users
                            {org.user_count !== undefined && (
                              <span className="ml-auto text-xs text-zinc-400">{org.user_count}</span>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm cursor-pointer">
                            <CreditCard className="h-4 w-4 mr-2" />
                            View Subscription
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-sm text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50">
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Subscription
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">{selectedOrg?.name} — Users</DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              All users belonging to this organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1 max-h-100 overflow-y-auto pr-1">
            {orgUsers.length === 0 ? (
              <p className="text-center text-zinc-400 text-sm py-10">No users found.</p>
            ) : (
              orgUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-50 transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={u.image || undefined} />
                    <AvatarFallback className="text-xs bg-zinc-100 text-zinc-600 font-semibold">
                      {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-zinc-800 truncate">{u.name || "Unnamed"}</p>
                    <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                  </div>
                  <p className="text-xs text-zinc-400 shrink-0">Joined {formatDate(u.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}