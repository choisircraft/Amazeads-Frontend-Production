"use client";

import React, { useEffect, useState } from "react";
import { Eye, Lock, Search, X } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { getDeliveredOrders } from "../services/order.service";
import ViewOrderModal from "../components/ViewOrderModal";
import ConfirmCloseOrderModal from "../components/ConfirmCloseOrderModal";
import OrderDelayStatusBadge from "../components/OrderDelayStatusBadge";
import ProjectProgressTimelineDropdown from "@/modules/project-manager/components/ProjectProgressTimelineDropdown";
import { useSalesStore } from "@/store/salesStore";
import { CATEGORY_IDS } from "@/constants/categories";
import styles from "../components/OrderListComponents.module.css";
import { formatDateStyle } from "@/lib/formatDate";

export default function OrdersToClosePage() {
  const { selectedCategory } = useSalesStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Search filter
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Modals
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedTimelineProjectId, setSelectedTimelineProjectId] = useState<number | null>(null);
  const [selectedCloseOrder, setSelectedCloseOrder] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const activeCategoryId = selectedCategory?.id || CATEGORY_IDS.CRYSTAL_WALL_ART;
      const data = await getDeliveredOrders(
        currentPage,
        5,
        activeCategoryId,
        debouncedSearch.trim() || undefined
      );
      setOrders(data.items || []);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalCount(data.pagination?.total_count || (data.items || []).length);
    } catch (err) {
      console.error("Error fetching delivered orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, selectedCategory, debouncedSearch]);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Orders To Close</h1>
          <p className={styles.subtitle}>Review delivered customer orders and perform final order closure audit.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-3 px-4 py-2.5 w-fit mb-4 flex-wrap">
        <div className="relative flex items-center min-w-[220px] sm:w-72">
          <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search orders, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-7 h-8 text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Delivered Orders Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "85px" }}>ORDER ID</th>
                <th style={{ width: "95px" }}>COMMIT DATE</th>
                <th style={{ width: "105px" }}>COMPLETION DATE</th>
                <th style={{ width: "150px" }}>CUSTOMER</th>
                <th>PRODUCT</th>
                <th style={{ width: "50px", textAlign: "center" }}>QTY</th>
                <th style={{ width: "100px" }}>TOTAL (₹)</th>
                <th style={{ width: "110px" }}>PAID AMOUNT</th>
                <th style={{ width: "110px" }}>DUE AMOUNT</th>
                <th style={{ width: "90px", textAlign: "center" }}>STATUS</th>
                <th style={{ width: "140px", textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={11} style={{ textAlign: "center", padding: "20px" }}>Loading delivered orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: "center", padding: "24px" }}>No delivered orders awaiting closure.</td></tr>
              ) : (
                orders.map((order) => {
                  const projectsList = order.projects && order.projects.length > 0 ? order.projects : [null];
                  const projectsCount = projectsList.length;

                  return (
                    <React.Fragment key={order.id}>
                      {projectsList.map((proj: any, pIdx: number) => {
                        const isFirstRow = pIdx === 0;

                        return (
                          <tr key={`${order.id}-${proj?.id || pIdx}`}>
                            {/* Order ID & Customer (RowSpan) */}
                            {isFirstRow && (
                              <>
                                <td rowSpan={projectsCount} style={{ fontWeight: 700 }} className="align-middle whitespace-nowrap">
                                  #{order.order_number || order.id}
                                </td>
                                <td rowSpan={projectsCount} className="align-middle whitespace-nowrap text-xs text-slate-600">
                                  {formatDateStyle(order.commit_date)}
                                </td>
                                <td rowSpan={projectsCount} className="align-middle whitespace-nowrap text-xs text-slate-600">
                                  <div className="font-semibold text-slate-700">{formatDateStyle(order.completion_date)}</div>
                                  <div className="mt-1">
                                    <OrderDelayStatusBadge
                                      completionDate={order.completion_date}
                                      completedDate={order.completed_date || order.completed_on}
                                    />
                                  </div>
                                </td>
                                <td rowSpan={projectsCount} style={{ fontWeight: 700 }} className="align-middle">
                                  {order.customer_name}
                                </td>
                              </>
                            )}

                            {/* Product Name & Qty */}
                            <td
                              style={{
                                fontWeight: 700,
                                fontSize: "0.78rem",
                                position: "relative",
                                zIndex: proj && selectedTimelineProjectId === proj.id ? 50 : undefined
                              }}
                              className="align-middle"
                            >
                              <span
                                className={proj ? "cursor-pointer hover:text-indigo-600 transition-colors text-indigo-950 font-bold underline-offset-2 hover:underline block" : ""}
                                onClick={() => {
                                  if (proj?.id) {
                                    setSelectedTimelineProjectId(
                                      selectedTimelineProjectId === proj.id ? null : proj.id
                                    );
                                  }
                                }}
                                title={proj ? "Click to view department progress timeline" : undefined}
                              >
                                {proj ? proj.project_name : "—"}
                              </span>

                              {proj?.id && selectedTimelineProjectId === proj.id && (
                                <ProjectProgressTimelineDropdown
                                  projectId={proj.id}
                                  onClose={() => setSelectedTimelineProjectId(null)}
                                  position="bottom"
                                  role="sales"
                                />
                              )}
                            </td>
                            <td style={{ textAlign: "center", color: "#64748b" }}>
                              {proj ? proj.quantity : "—"}
                            </td>

                            {/* Total, Paid, Due, Status & Actions (RowSpan) */}
                            {isFirstRow && (
                              <>
                                <td rowSpan={projectsCount} style={{ fontWeight: 700 }} className="align-middle whitespace-nowrap">
                                  ₹{(order.final_amount || 0).toLocaleString("en-IN")}
                                </td>
                                <td rowSpan={projectsCount} className="align-middle whitespace-nowrap">
                                  <span className={styles.paidBubble}>
                                    ₹{(order.paid_amount || 0).toLocaleString("en-IN")}
                                  </span>
                                </td>
                                <td rowSpan={projectsCount} className="align-middle whitespace-nowrap">
                                  <span className={styles.dueBubble}>
                                    ₹{(order.balance_amount || 0).toLocaleString("en-IN")}
                                  </span>
                                </td>
                                <td rowSpan={projectsCount} style={{ textAlign: "center" }} className="align-middle">
                                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                                    {order.order_status || "Delivered"}
                                  </span>
                                </td>
                                <td rowSpan={projectsCount} className="align-middle">
                                  <div className={styles.actionGroup}>
                                    {/* View Details Eye Icon */}
                                    <button 
                                      onClick={() => { setSelectedOrderId(order.id); setIsViewOpen(true); }}
                                      className={styles.actionBtn}
                                      title="View Order Details"
                                    >
                                      <Eye size={13} />
                                    </button>

                                    {/* 🌟 Close Order Action Button */}
                                    <button
                                      onClick={() => {
                                        setSelectedCloseOrder(order);
                                        setIsCloseModalOpen(true);
                                      }}
                                      className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                      title="Close Order Record"
                                    >
                                      <Lock size={12} /> Close Order
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

        {/* Pagination Footer */}
        {!isLoading && orders.length > 0 && (
          <div className={styles.paginationRow}>
            <div className={styles.resultsText}>
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalCount} orders)
            </div>
            <Pagination 
              total={totalCount} 
              limit={5} 
              activePage={currentPage} 
              onPageChange={(page) => setCurrentPage(page)} 
            />
          </div>
        )}
      </div>

      {/* View Details Modal */}
      <ViewOrderModal isOpen={isViewOpen} orderId={selectedOrderId} onClose={() => setIsViewOpen(false)} />

      {/* 🌟 Confirm Close Order Modal */}
      <ConfirmCloseOrderModal
        isOpen={isCloseModalOpen}
        orderId={selectedCloseOrder?.id || null}
        orderNumber={selectedCloseOrder?.order_number || null}
        onClose={() => {
          setIsCloseModalOpen(false);
          setSelectedCloseOrder(null);
        }}
        onSuccess={() => {
          setIsCloseModalOpen(false);
          setSelectedCloseOrder(null);
          fetchOrders(); // 🌟 സക്സസ് ആയി ക്ലോസ് ചെയ്ത ശേഷം റെക്കോർഡ് റിഫ്രഷ് ചെയ്ത് ലിസ്റ്റിൽ നിന്നും മാറ്റുന്നു
        }}
      />
    </div>
  );
}