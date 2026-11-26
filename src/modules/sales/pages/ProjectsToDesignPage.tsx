"use client";

import React, { useEffect, useState } from "react";
import { Eye, Calendar, RotateCcw, Edit3, Search, X } from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import DateFilterDropdown, { DateFilterValue } from "@/components/ui/DateFilterDropdown";
import { useSalesStore } from "@/store/salesStore";
import { CATEGORY_IDS } from "@/constants/categories";
import { getProjectsToDesignList } from "../services/designApproval.service";
import SalesProjectDetailsModal from "../components/SalesProjectDetailsModal";
import UpdateProjectDatesModal from "../components/UpdateProjectDatesModal";
import ProjectProgressTimelineDropdown from "@/modules/project-manager/components/ProjectProgressTimelineDropdown";
import styles from "../components/DesignApprovalComponents.module.css";
import { formatDateStyle } from "@/lib/formatDate";

export default function ProjectsToDesignPage() {
  const { selectedCategory } = useSalesStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 🌟 ഡിഫോൾട്ട് ആയി ഇന്നത്തെ തീയതി (YYYY-MM-DD) ഫിൽട്ടറിനായി നൽകുന്നു
  const getTodayDateStr = () => new Date().toISOString().split("T")[0];
  const [designDate, setDesignDate] = useState<DateFilterValue>({
    date: getTodayDateStr(),
    from: "",
    to: "",
  });

  // 🌟 design_task_assigned ഫിൽട്ടർ (default: false - Pending Assign)
  const [taskFilter, setTaskFilter] = useState<boolean | undefined>(false);

  // 🌟 ഇതുവരെയുള്ള ഡാറ്റ ഫെച്ച് ചെയ്യാൻ Upto Date ചെക്ക്ബോക്സ് (default: false)
  const [isUptoDate, setIsUptoDate] = useState<boolean>(false);

  // Search Filter
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Modal States
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedTimelineProjectId, setSelectedTimelineProjectId] = useState<number | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isUpdateDatesOpen, setIsUpdateDatesOpen] = useState(false);
  const [selectedUpdateProject, setSelectedUpdateProject] = useState<any>(null);
  const [selectedUpdateOrder, setSelectedUpdateOrder] = useState<any>(null);

  const isEditAllowed = (proj: any, order: any) => {
    return true;
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // 🌟 category_id 5-ാമത്തെ പെരാമീറ്റർ ആയി അയക്കുന്നു
      const categoryId = selectedCategory?.id || CATEGORY_IDS.CRYSTAL_WALL_ART;

      const targetDate = isUptoDate ? (designDate.date || designDate.to || getTodayDateStr()) : designDate.date;
      const isRange = !isUptoDate && Boolean(designDate.from || designDate.to);
      const data = await getProjectsToDesignList(
        currentPage,
        5,
        isUptoDate || isRange ? undefined : targetDate || undefined,
        taskFilter,
        categoryId,
        isUptoDate ? targetDate : isRange ? designDate.to || undefined : undefined,
        debouncedSearch.trim() || undefined,
        isRange ? designDate.from || undefined : undefined
      );

      const items = data.items || [];

      setOrders(items);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalCount(data.pagination?.total_count || items.length);
    } catch (err) {
      console.error("Error fetching projects for design:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentPage, designDate, taskFilter, selectedCategory, isUptoDate, debouncedSearch]);

  const handleResetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setDesignDate({ date: getTodayDateStr(), from: "", to: "" });
    setTaskFilter(false);
    setIsUptoDate(false);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const stylesMap: Record<string, string> = {
      Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-100",
      Draft: "bg-amber-50 text-amber-700 border-amber-100",
      Pending: "bg-amber-50 text-amber-700 border-amber-100",
      Completed: "bg-blue-50 text-blue-700 border-blue-100",
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border inline-block ${stylesMap[status] || "bg-amber-50 text-amber-700 border-amber-100"}`}>
        {status || "Pending"}
      </span>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header & Filter Bar */}
      <div className={styles.headerRow} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className={styles.title}>Projects to Design</h1>
          <p className={styles.subtitle}>Track and review all active product lines ready for the graphic designing queue.</p>
        </div>

        {/* 🌟 Design Date (Default Today) & Task Assigned Filter Panel */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">

          {/* Search across tracking_id, order_number, customer name, mobile number, invoice_id */}
          <div className="relative flex items-center min-w-[200px] sm:w-60 bg-white rounded-lg border border-slate-200 shadow-2xs px-2.5 py-1">
            <Search size={13} className="text-slate-400 mr-2 shrink-0 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tracking, order #, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none w-full"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0 ml-1"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Design Date Picker (Default Today) */}
          <DateFilterDropdown
            label="Design Date"
            value={designDate}
            align="right"
            triggerClassName="inline-flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs text-xs font-semibold cursor-pointer select-none hover:border-slate-300"
            onChange={(val) => {
              if (val.from || val.to) setIsUptoDate(false);
              setDesignDate(val);
              setCurrentPage(1);
            }}
          />

          {/* Task Assigned Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg">
            <button
              onClick={() => { setTaskFilter(false); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] ${taskFilter === false ? "bg-white text-indigo-700 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Pending Assign
            </button>
            <button
              onClick={() => { setTaskFilter(true); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] ${taskFilter === true ? "bg-white text-indigo-700 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              Assigned
            </button>
            <button
              onClick={() => { setTaskFilter(undefined); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] ${taskFilter === undefined ? "bg-white text-indigo-700 font-bold shadow-2xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              All Items
            </button>
          </div>

          {/* 🌟 Upto Date Checkbox (All Items thottu ippurath) */}
          <label className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-[11px] cursor-pointer hover:bg-slate-50 transition-colors select-none shadow-2xs">
            <input
              type="checkbox"
              checked={isUptoDate}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsUptoDate(checked);
                if (checked) {
                  setDesignDate({ date: getTodayDateStr(), from: "", to: "" });
                }
                setCurrentPage(1);
              }}
              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Upto Date</span>
          </label>

          {/* Reset Filters */}
          <button
            onClick={handleResetFilters}
            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Reset Filters to Today"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "85px" }}>ORDER ID</th>
                <th style={{ width: "150px" }}>CUSTOMER</th>
                <th>PRODUCT</th>
                <th style={{ width: "50px", textAlign: "center" }}>QTY</th>
                <th style={{ width: "100px" }}>DESIGN DATE</th>
                <th style={{ width: "135px", minWidth: "130px", textAlign: "center" }}>PROGRESS</th>
                <th style={{ width: "100px" }}>TOTAL</th>
                <th style={{ width: "65px", textAlign: "center" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>Loading pending design queue...</td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "24px" }} className="text-slate-500 font-semibold text-xs">
                    {debouncedSearch ? `No projects found matching "${debouncedSearch}".` : "No projects mapped for selected date or filter."}
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const projectsList = order.projects && order.projects.length > 0 ? order.projects : [null];
                  const projectsCount = projectsList.length;

                  const totalProjectsAmount = order.projects
                    ? order.projects.reduce((sum: number, p: any) => sum + (p.amount || 0) + (p.additional_amount || 0), 0)
                    : (order.final_amount || 0);

                  return (
                    <React.Fragment key={order.order_id || order.id}>
                      {projectsList.map((proj: any, pIdx: number) => {
                        const isFirstRow = pIdx === 0;

                        return (
                          <tr key={`${order.order_id || order.id}-${proj?.id || pIdx}`}>
                            {/* Order ID & Customer (RowSpan) */}
                            {isFirstRow && (
                              <>
                                <td rowSpan={projectsCount} style={{ fontWeight: 700 }} className="align-middle whitespace-nowrap">
                                  #{order.order_number || order.order_id || order.id}
                                </td>
                                <td rowSpan={projectsCount} style={{ fontWeight: 700 }} className="align-middle">
                                  {order.customer_name}
                                </td>
                              </>
                            )}

                            {/* Product Name, Qty, Design Date (ഓരോ പ്രൊഡക്റ്റിനും വെവ്വേറെ) */}
                            <td
                              style={{
                                fontWeight: 700,
                                fontSize: "0.78rem",
                                position: "relative",
                                zIndex: selectedTimelineProjectId === proj.id ? 50 : undefined
                              }}
                              className="align-middle"
                            >
                              <span
                                className="cursor-pointer hover:text-indigo-600 transition-colors text-indigo-950 font-bold underline-offset-2 hover:underline block"
                                onClick={(e) => {
                                  if (proj) {
                                    setSelectedTimelineProjectId(
                                      selectedTimelineProjectId === proj.id ? null : proj.id
                                    );
                                  }
                                }}
                                title="Click to view department progress timeline"
                              >
                                {proj ? proj.project_name : "—"}
                              </span>

                              {proj && selectedTimelineProjectId === proj.id && (
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
                            <td className="align-middle whitespace-nowrap text-xs text-slate-600">
                              {formatDateStyle(proj?.design_date || order.design_date)}
                            </td>

                            {/* Progress — 4 fixed positions, blank if not assigned */}
                            <td className="align-middle" style={{ minWidth: "140px" }}>
                              {(() => {
                                const depts = proj?.departments || [];

                                const deptConfig = [
                                  { id: 1, label: "DS" },
                                  { id: 2, label: "PR" },
                                  { id: 3, label: "PD" },
                                  { id: 4, label: "LG" },
                                ];

                                return (
                                  <div className="flex items-center justify-center py-0.5">
                                    <div className="flex items-center gap-1 text-[11px] font-bold">
                                      {deptConfig.map(({ id, label }, idx) => {
                                        const d = depts.find((x: any) => x.department_id === id || x.id === id);
                                        const isAssigned = d?.is_assigned === true;
                                        const isDone = d?.final_status === true;

                                        const prevD = idx > 0 ? depts.find((x: any) => x.department_id === deptConfig[idx - 1].id || x.id === deptConfig[idx - 1].id) : null;
                                        const prevAssigned = prevD?.is_assigned === true;
                                        const prevDone = prevD?.final_status === true;

                                        return (
                                          <React.Fragment key={id}>
                                            {idx > 0 && (
                                              <span className={`w-3.5 h-[1.5px] -translate-y-[4px] ${prevAssigned && isAssigned && prevDone && isDone ? "bg-emerald-500" : "bg-slate-200"}`} />
                                            )}
                                            <div className="flex flex-col items-center w-5">
                                              {isAssigned ? (
                                                <span className={isDone ? "text-emerald-600 font-extrabold" : "text-rose-500 font-extrabold"}>
                                                  {isDone ? "✓" : "✕"}
                                                </span>
                                              ) : (
                                                <span className="text-transparent select-none">–</span>
                                              )}
                                              <span className={`text-[8px] font-extrabold mt-1 leading-none ${isAssigned ? "text-slate-500" : "text-slate-200"}`}>
                                                {label}
                                              </span>
                                            </div>
                                          </React.Fragment>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>

                            {/* Total Amount (RowSpan) */}
                            {isFirstRow && (
                              <td rowSpan={projectsCount} style={{ fontWeight: 700 }} className="align-middle whitespace-nowrap">
                                ₹{totalProjectsAmount.toLocaleString("en-IN")}
                              </td>
                            )}

                            {/* Actions (ഓരോ പ്രൊഡക്റ്റിനും വെവ്വേറെ) */}
                            <td className="align-middle">
                              <div className={styles.actionGroup}>
                                {proj && (
                                  <>
                                    <button
                                      onClick={() => { setSelectedProjectId(proj.id); setIsViewOpen(true); }}
                                      className={styles.actionBtn}
                                      title="View product specifications"
                                    >
                                      <Eye size={13} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (isEditAllowed(proj, order)) {
                                          setSelectedUpdateProject(proj);
                                          setSelectedUpdateOrder(order);
                                          setIsUpdateDatesOpen(true);
                                        }
                                      }}
                                      disabled={!isEditAllowed(proj, order)}
                                      className={`${styles.actionBtn} ${!isEditAllowed(proj, order)
                                        ? "opacity-45 cursor-not-allowed hover:bg-transparent text-slate-350"
                                        : ""
                                        }`}
                                      title={
                                        isEditAllowed(proj, order)
                                          ? "Edit schedule dates"
                                          : "Date updates only allowed between commit & completion dates"
                                      }
                                    >
                                      <Edit3 size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
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

        {/* 🌟 Pagination Footer Row */}
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

      <SalesProjectDetailsModal
        isOpen={isViewOpen}
        projectId={selectedProjectId}
        onClose={() => {
          setIsViewOpen(false);
          setSelectedProjectId(null);
        }}
      />

      <UpdateProjectDatesModal
        isOpen={isUpdateDatesOpen}
        project={selectedUpdateProject}
        order={selectedUpdateOrder}
        mode="design"
        onClose={() => {
          setIsUpdateDatesOpen(false);
          setSelectedUpdateProject(null);
          setSelectedUpdateOrder(null);
        }}
        onSuccess={() => {
          fetchProjects();
        }}
      />
    </div>
  );
}