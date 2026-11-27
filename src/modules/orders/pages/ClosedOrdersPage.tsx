"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, DollarSign, Eye, Search, X } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import DateFilterDropdown, {
  DateFilterValue,
  EMPTY_DATE_FILTER,
  buildDateRangeParams,
} from "@/components/ui/DateFilterDropdown";
import { getPMOrders, UserRole } from "@/modules/project-manager/services/managerOrder.service";
import { useProjectManagerStore } from "@/store/projectManagerStore";
import { CATEGORY_IDS } from "@/constants/categories";
import ViewOrderModal from "@/modules/sales/components/ViewOrderModal";
import ProjectProgressTimelineDropdown from "@/modules/project-manager/components/ProjectProgressTimelineDropdown";
import { formatDateStyle } from "@/lib/formatDate";
import styles from "@/modules/project-manager/components/PMOrderComponents.module.css";

function getPaymentBadgeClass(status?: string) {
  switch (status?.toLowerCase()) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider inline-block";
    case "partial":
      return "bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider inline-block";
    case "pending":
      return "bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider inline-block";
    default:
      return "bg-slate-50 text-slate-600 border border-slate-200 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider inline-block";
  }
}

// 🌟 Delay status badge based on completion_date & completed_date
function getDelayStatusBadge(completionDateStr?: string | null, completedDateStr?: string | null) {
  if (!completionDateStr) return null;

  const compDate = completionDateStr.split("T")[0];
  if (!compDate) return null;

  // 1. When completed_date is present (order is completed)
  if (completedDateStr) {
    const doneDate = completedDateStr.split("T")[0];
    if (doneDate) {
      const compTime = new Date(`${compDate}T00:00:00`).getTime();
      const doneTime = new Date(`${doneDate}T00:00:00`).getTime();

      if (!isNaN(compTime) && !isNaN(doneTime)) {
        const diffDays = Math.round((doneTime - compTime) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) {
          return (
            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shadow-3xs">
              On Date
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 whitespace-nowrap shadow-3xs">
              <span className="h-1 w-1 rounded-full bg-orange-500" />
              Delayed by {diffDays} {diffDays === 1 ? "day" : "days"}
            </span>
          );
        }
      }
    }
  }

  // 2. When completed_date is null (order is not yet completed)
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const compTime = new Date(`${compDate}T00:00:00`).getTime();
  const todayTime = new Date(`${todayStr}T00:00:00`).getTime();

  if (isNaN(compTime) || isNaN(todayTime)) return null;

  const diffDays = Math.round((todayTime - compTime) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    // completion_date is in the future (> current date): show nothing
    return null;
  }

  if (diffDays === 0) {
    // completion_date = current date: show due today
    return (
      <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shadow-3xs">
        <span className="h-1 w-1 rounded-full bg-amber-500" />
        Due Today
      </span>
    );
  }

  // completion_date is in the past (< current date): show overdue by X day(s)
  return (
    <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shadow-3xs">
      <span className="h-1 w-1 rounded-full bg-rose-500 animate-pulse" />
      Overdue by {diffDays} {diffDays === 1 ? "day" : "days"}
    </span>
  );
}

export function ClosedOrdersPage({ role = "project-manager" }: { role?: UserRole }) {
  const { selectedCategory } = useProjectManagerStore();
  const activeCategoryId = selectedCategory?.id || CATEGORY_IDS.CRYSTAL_WALL_ART;

  const [orders, setOrders] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 🌟 Search & Date Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [commitDateFilter, setCommitDateFilter] = useState<DateFilterValue>(EMPTY_DATE_FILTER);
  const [completionDateFilter, setCompletionDateFilter] = useState<DateFilterValue>(EMPTY_DATE_FILTER);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedTimelineProjectId, setSelectedTimelineProjectId] = useState<number | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const extraDateParams = {
        ...buildDateRangeParams(commitDateFilter, "commit_date", "commit_from_date", "commit_to_date"),
        ...buildDateRangeParams(completionDateFilter, "completion_date", "completion_from_date", "completion_to_date"),
      };
      const data = await getPMOrders(
        currentPage,
        5,
        "Closed",
        undefined,
        undefined,
        role,
        activeCategoryId,
        undefined,
        debouncedSearch.trim() || undefined,
        extraDateParams
      );
      setOrders(data.items || []);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalCount(data.pagination?.total_count || (data.items || []).length);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, selectedCategory, debouncedSearch, commitDateFilter, completionDateFilter, role]);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.final_amount || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Courier & Tracking — Closed Orders</h1>
        <p className={styles.subtitle}>Read-only historical register of fully delivered customer orders.</p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-red-50 text-red-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Closed Orders</span>
            <span className="text-lg font-extrabold text-slate-900">{totalCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Closed Revenue</span>
            <span className="text-lg font-extrabold text-slate-900">₹{totalRevenue.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* 🌟 Search & Date Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between gap-3 my-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex items-center min-w-[240px] sm:w-72">
            <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search orders, customer, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 h-9 text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <DateFilterDropdown
            label="Commit"
            value={commitDateFilter}
            onChange={(val) => { setCommitDateFilter(val); setCurrentPage(1); }}
            badgeClassName="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap"
          />

          <DateFilterDropdown
            label="Completion Date"
            value={completionDateFilter}
            onChange={(val) => { setCompletionDateFilter(val); setCurrentPage(1); }}
            badgeClassName="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          Total {totalCount} closed orders
        </span>
      </div>

      {/* Closed Orders Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "110px" }}>ORDER NUMBER</th>
                <th style={{ width: "160px" }}>CUSTOMER</th>
                <th>PRODUCT</th>
                <th style={{ width: "110px" }}>COMMIT DATE</th>
                <th style={{ width: "120px" }}>COMPLETION DATE</th>
                <th style={{ width: "120px" }}>FINAL AMOUNT</th>
                <th style={{ width: "100px", textAlign: "center" }}>PAYMENT</th>
                <th style={{ width: "60px", textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-10 font-semibold text-slate-500">Loading closed orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 font-semibold text-slate-500">No delivered orders found in history.</td></tr>
              ) : (
                orders.map((order) => {
                  const projectsList = order.projects && order.projects.length > 0 ? order.projects : [null];
                  const projectsCount = projectsList.length;

                  return (
                    <React.Fragment key={order.id}>
                      {projectsList.map((proj: any, pIdx: number) => {
                        const isFirstRow = pIdx === 0;

                        return (
                          <tr key={`${order.id}-${proj?.id || pIdx}`} className="hover:bg-slate-50/80 transition-colors">
                            {isFirstRow && (
                              <>
                                <td rowSpan={projectsCount} className="font-extrabold text-slate-900 align-middle">
                                  #{order.order_number || order.id}
                                </td>
                                <td rowSpan={projectsCount} className="font-bold text-slate-800 align-middle">
                                  {order.customer_name}
                                </td>
                              </>
                            )}

                            {/* Product Name (Clickable Timeline Dropdown) */}
                            <td
                              style={{
                                fontWeight: 700,
                                fontSize: "0.78rem",
                                position: "relative",
                                zIndex: proj && selectedTimelineProjectId === (proj.id || proj.project_id) ? 50 : undefined
                              }}
                              className="align-middle"
                            >
                              <span
                                className={proj || order.id ? "cursor-pointer hover:text-indigo-600 transition-colors text-indigo-950 font-bold underline-offset-2 hover:underline block" : ""}
                                onClick={() => {
                                  const pId = proj?.id || proj?.project_id || order.project_id || order.id;
                                  if (pId) {
                                    setSelectedTimelineProjectId(
                                      selectedTimelineProjectId === pId ? null : pId
                                    );
                                  }
                                }}
                                title="Click to view department progress timeline"
                              >
                                {proj ? proj.project_name : order.product_name || "—"}
                              </span>

                              {(proj?.id || proj?.project_id || order.project_id || order.id) && selectedTimelineProjectId === (proj?.id || proj?.project_id || order.project_id || order.id) && (
                                <ProjectProgressTimelineDropdown
                                  projectId={proj?.id || proj?.project_id || order.project_id || order.id}
                                  onClose={() => setSelectedTimelineProjectId(null)}
                                  position="bottom"
                                  role={role}
                                />
                              )}
                            </td>

                            {isFirstRow && (
                              <>
                                <td rowSpan={projectsCount} className="align-middle whitespace-nowrap text-xs text-slate-600">
                                  {formatDateStyle(order.commit_date)}
                                </td>
                                <td rowSpan={projectsCount} className="align-middle whitespace-nowrap text-xs text-slate-600">
                                  <div className="flex flex-col items-start">
                                    <span>{order.completion_date ? order.completion_date.split("T")[0] : "—"}</span>
                                    {getDelayStatusBadge(order.completion_date, order.completed_date || order.completed_on)}
                                  </div>
                                </td>
                                <td rowSpan={projectsCount} className="font-extrabold text-slate-900 align-middle">₹{(order.final_amount || 0).toLocaleString("en-IN")}</td>
                                <td rowSpan={projectsCount} style={{ textAlign: "center" }} className="align-middle">
                                  <span className={getPaymentBadgeClass(order.payment_status)}>
                                    {order.payment_status || "Pending"}
                                  </span>
                                </td>
                                <td rowSpan={projectsCount} className="text-center align-middle">
                                  <div className={styles.actionGroup}>
                                    <button
                                      onClick={() => { setSelectedOrderId(order.id); setIsViewOpen(true); }}
                                      className={styles.actionBtn}
                                      title="View details"
                                    >
                                      <Eye size={13} />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.paginationRow}>
            <div className={styles.resultsText}>
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalCount} orders)
            </div>
            <Pagination total={totalCount} limit={5} activePage={currentPage} onPageChange={(p) => setCurrentPage(p)} />
          </div>
        )}
      </div>

      <ViewOrderModal isOpen={isViewOpen} orderId={selectedOrderId} role={role} onClose={() => setIsViewOpen(false)} />
    </div>
  );
}

export default ClosedOrdersPage;
