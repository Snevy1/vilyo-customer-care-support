"use client";

import {
  ArrowUp,
  ArrowDown,
  Crown,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import AddNew from "./AddNew";
import ViewEdit from "./ViewEdit";
import DeleteProcessor from "./delete";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentProcessor {
  id: string;
  provider: string;
  code: string;
  display_name: string;
  logo_url?: string | null;
  is_enabled: boolean;
  environment: "production" | "test";
  supported_currencies?: string[];
  priority?: number;
  is_top_priority?: boolean;
  tenant_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

// ─── Toast Component ──────────────────────────────────────────────────────────

function ToastNotification({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm shadow-lg border transition-all
            ${t.type === "success" ? "bg-white border-green-200 text-green-800" : ""}
            ${t.type === "error" ? "bg-white border-red-200 text-red-700" : ""}
            ${t.type === "info" ? "bg-white border-zinc-200 text-zinc-700" : ""}
          `}
        >
          {t.type === "success" && <CheckCircle2 size={15} className="text-green-500 shrink-0" />}
          {t.type === "error" && <XCircle size={15} className="text-red-500 shrink-0" />}
          {t.type === "info" && <AlertCircle size={15} className="text-zinc-400 shrink-0" />}
          <span>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-2 text-zinc-300 hover:text-zinc-500 transition-colors"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {[40, 200, 80, 60, 50].map((w, i) => (
        <TableCell key={i} className="text-center">
          <div
            className="h-4 rounded-md bg-zinc-100 animate-pulse mx-auto"
            style={{ width: w }}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentProcessorsPage() {
  const [processors, setProcessors] = useState<PaymentProcessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [openPopoverKey, setOpenPopoverKey] = useState<string | null>(null);

  // ── Toast helpers ──────────────────────────────────────────────────────────

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProcessors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payment-processors");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to load (${res.status})`);
      }
      const data: { processors: PaymentProcessor[] } = await res.json();

      // Sort: top priority first, then by priority index
      const sorted = [...(data.processors ?? [])].sort((a, b) => {
        if (a.is_top_priority && !b.is_top_priority) return -1;
        if (!a.is_top_priority && b.is_top_priority) return 1;
        return (a.priority ?? 999) - (b.priority ?? 999);
      });
      setProcessors(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcessors();
  }, [fetchProcessors]);

  // ── Toggle Enabled ─────────────────────────────────────────────────────────

  const handleToggleEnabled = async (record: PaymentProcessor, checked: boolean) => {
    // Optimistic update
    setProcessors((prev) =>
      prev.map((p) => (p.id === record.id ? { ...p, is_enabled: checked } : p))
    );
    setTogglingId(record.id);

    try {
      const res = await fetch(`/api/admin/payment-processors/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: checked }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update");
      }
      addToast("success", `${record.display_name} ${checked ? "enabled" : "disabled"}`);
    } catch (err) {
      // Roll back
      setProcessors((prev) =>
        prev.map((p) => (p.id === record.id ? { ...p, is_enabled: !checked } : p))
      );
      addToast("error", err instanceof Error ? err.message : "Toggle failed");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Reorder ────────────────────────────────────────────────────────────────

  const handleReorder = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= processors.length) return;

    const updated = [...processors];

    // Swap priority values
    const tempPriority = updated[index].priority;
    updated[index] = { ...updated[index], priority: updated[swapIndex].priority };
    updated[swapIndex] = { ...updated[swapIndex], priority: tempPriority };

    // Transfer top-priority badge if moving into position 0
    if (direction === "up" && index === 1) {
      updated[0] = { ...updated[0], is_top_priority: true };
      updated[1] = { ...updated[1], is_top_priority: false };
    } else if (direction === "down" && index === 0) {
      updated[0] = { ...updated[0], is_top_priority: false };
      updated[1] = { ...updated[1], is_top_priority: true };
    }

    // Re-sort and re-index
    updated.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
    updated.forEach((p, i) => { p.priority = i; });

    // Optimistic update
    setProcessors(updated);
    setReorderingId(updated[swapIndex].id);

    try {
      const res = await fetch("/api/admin/payment-processors/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          updated.map(({ id, priority, is_top_priority }) => ({
            id,
            priority,
            is_top_priority,
          }))
        ),
      });
      if (!res.ok) throw new Error("Reorder failed");
      addToast("info", "Order saved");
    } catch (err) {
      addToast("error", "Failed to save order — refreshing");
      fetchProcessors();
    } finally {
      setReorderingId(null);
    }
  };

  // ── Set Top Priority ───────────────────────────────────────────────────────

  const handleSetTopPriority = async (record: PaymentProcessor) => {
    const updated = processors.map((p, i) => ({
      ...p,
      is_top_priority: p.id === record.id,
      priority: i,
    }));

    // Move the target to position 0 in display
    const sorted = [
      ...updated.filter((p) => p.id === record.id),
      ...updated.filter((p) => p.id !== record.id),
    ].map((p, i) => ({ ...p, priority: i }));

    setProcessors(sorted);
    setOpenPopoverKey(null);

    try {
      const res = await fetch("/api/admin/payment-processors/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          sorted.map(({ id, priority, is_top_priority }) => ({
            id,
            priority,
            is_top_priority,
          }))
        ),
      });
      if (!res.ok) throw new Error("Failed to set top priority");
      addToast("success", `${record.display_name} set as top priority`);
    } catch (err) {
      addToast("error", "Failed to update priority — refreshing");
      fetchProcessors();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col bg-white rounded-xl mt-5 shadow-sm border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <p className="text-base font-semibold text-zinc-900">Payment Processors</p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {loading ? "Loading…" : `${processors.length} processor${processors.length !== 1 ? "s" : ""} configured`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchProcessors}
              disabled={loading}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <AddNew onSuccess={fetchProcessors} />
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2.5 mx-6 my-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchProcessors}
              className="ml-auto text-xs text-red-500 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="px-4 pb-5">
          <Table className="mt-4 border rounded-lg overflow-hidden">
            <TableHeader>
              <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                <TableHead className="w-14 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  #
                </TableHead>
                <TableHead className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Processor
                </TableHead>
                <TableHead className="w-28 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Environment
                </TableHead>
                <TableHead className="w-24 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Move
                </TableHead>
                <TableHead className="w-24 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Enabled
                </TableHead>
                <TableHead className="w-16 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : processors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-zinc-400 text-sm">
                    No payment processors configured yet.{" "}
                    <span className="text-indigo-500 font-medium">Add one above.</span>
                  </TableCell>
                </TableRow>
              ) : (
                processors.map((record, index) => (
                  <TableRow
                    key={record.id}
                    className={`transition-colors ${
                      record.is_top_priority ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    {/* Priority number */}
                    <TableCell className="text-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500">
                        {index + 1}
                      </span>
                    </TableCell>

                    {/* Processor info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {record.logo_url ? (
                          <img
                            src={record.logo_url}
                            alt={record.display_name}
                            className="h-7 w-14 object-contain rounded"
                          />
                        ) : (
                          <div className="h-7 w-14 rounded bg-zinc-100 flex items-center justify-center text-zinc-300 text-xs">
                            No logo
                          </div>
                        )}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-zinc-800">
                            {record.display_name}
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">
                            {record.code}
                          </span>
                        </div>
                        {record.is_top_priority && (
                          <>
                            <Badge className="hidden md:inline-flex bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-50 text-xs gap-1">
                              <Crown size={10} />
                              Top Priority
                            </Badge>
                            <Crown className="md:hidden text-indigo-500 h-4 w-4" />
                          </>
                        )}
                      </div>
                    </TableCell>

                    {/* Environment */}
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          record.environment === "production"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            record.environment === "production"
                              ? "bg-green-500"
                              : "bg-amber-400"
                          }`}
                        />
                        {record.environment === "production" ? "Prod" : "Test"}
                      </span>
                    </TableCell>

                    {/* Move */}
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleReorder(index, "up")}
                          disabled={index === 0 || !!reorderingId}
                          className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-800 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          {reorderingId === record.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <ArrowUp size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleReorder(index, "down")}
                          disabled={index === processors.length - 1 || !!reorderingId}
                          className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-800 hover:text-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </TableCell>

                    {/* Toggle */}
                    <TableCell className="text-center">
                      {togglingId === record.id ? (
                        <Loader2 size={15} className="animate-spin text-zinc-400 mx-auto" />
                      ) : (
                        <Switch
                          checked={record.is_enabled}
                          onCheckedChange={(checked) =>
                            handleToggleEnabled(record, checked)
                          }
                        />
                      )}
                    </TableCell>

                    {/* Actions popover */}
                    <TableCell className="text-center">
                      <Popover
                        open={openPopoverKey === record.id}
                        onOpenChange={(open) =>
                          setOpenPopoverKey(open ? record.id : null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-zinc-700"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-52 p-1.5" align="end">
                          <div className="flex flex-col gap-0.5">
                            <button
                              className="w-full text-left rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 transition-colors disabled:opacity-40"
                              onClick={() => handleSetTopPriority(record)}
                              disabled={!!record.is_top_priority}
                            >
                              <Crown size={13} className="text-indigo-500" />
                              Set as Top Priority
                            </button>

                            <Separator className="my-1" />

                            <div className="px-1">
                              <ViewEdit
                                data={{
                                  id: record.id,
                                  name: record.display_name,
                                  code: record.code,
                                  provider: record.provider,
                                  environment: record.environment,
                                  logoUrl: record.logo_url ?? undefined,
                                  isEnabled: record.is_enabled,
                                  supportedCurrencies: record.supported_currencies,
                                  userTypes: record.supported_currencies,
                                }}
                                onSuccess={() => {
                                  setOpenPopoverKey(null);
                                  fetchProcessors();
                                }}
                              />
                            </div>

                            <Separator className="my-1" />

                            <div className="px-1">
                              <DeleteProcessor
                                processorId={record.id}
                                onSuccess={() => {
                                  setOpenPopoverKey(null);
                                  fetchProcessors();
                                }}
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}