"use client";

import React, { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";

export interface DateFilterValue {
  date: string;
  from: string;
  to: string;
}

export const EMPTY_DATE_FILTER: DateFilterValue = { date: "", from: "", to: "" };

export function hasDateFilter(val?: DateFilterValue | null): boolean {
  return Boolean(val && (val.date || val.from || val.to));
}

export function buildDateRangeParams(
  val: DateFilterValue,
  exactKey: string,
  fromKey: string,
  toKey: string
): Record<string, string> {
  const params: Record<string, string> = {};
  if (val.from || val.to) {
    if (val.from) params[fromKey] = val.from;
    if (val.to) params[toKey] = val.to;
  } else if (val.date) {
    params[exactKey] = val.date;
  }
  return params;
}

function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatReadableDate(ymd: string, includeYear = true): string {
  if (!ymd) return "";
  const parsed = new Date(`${ymd.split("T")[0]}T00:00:00`);
  if (isNaN(parsed.getTime())) return ymd;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  });
}

function formatFilterSummary(value: DateFilterValue): string {
  if (value.from && value.to) {
    if (value.from === value.to) {
      return formatReadableDate(value.from);
    }
    const sameYear = value.from.slice(0, 4) === value.to.slice(0, 4);
    return `${formatReadableDate(value.from, !sameYear)} – ${formatReadableDate(value.to, true)}`;
  }
  if (value.from) {
    return `From ${formatReadableDate(value.from)}`;
  }
  if (value.to) {
    return `Until ${formatReadableDate(value.to)}`;
  }
  if (value.date) {
    const today = toLocalYmd(new Date());
    if (value.date === today) {
      return `Today (${formatReadableDate(value.date, false)})`;
    }
    return formatReadableDate(value.date);
  }
  return "All Dates";
}

interface DateFilterDropdownProps {
  label: string;
  value: DateFilterValue;
  onChange: (next: DateFilterValue) => void;
  badgeClassName?: string;
  triggerClassName?: string;
  align?: "left" | "right";
  allowClear?: boolean;
  title?: string;
}

/**
 * Dropdown date filter supporting both exact single-date selection and From–To date ranges.
 */
export default function DateFilterDropdown({
  label,
  value,
  onChange,
  badgeClassName,
  triggerClassName,
  align = "left",
  allowClear = true,
  title,
}: DateFilterDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"single" | "range">(
    value.from || value.to ? "range" : "single"
  );

  // Sync active mode when external state changes (e.g. reset)
  useEffect(() => {
    if (value.from || value.to) {
      setMode("range");
    } else if (value.date) {
      setMode("single");
    }
  }, [value.date, value.from, value.to]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const active = hasDateFilter(value);
  const summaryText = formatFilterSummary(value);

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(EMPTY_DATE_FILTER);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        title={title || `Filter by ${label}`}
        className={
          triggerClassName ||
          `inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer select-none transition-all ${
            active
              ? "bg-white border-indigo-300 text-slate-800 shadow-2xs"
              : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white"
          }`
        }
      >
        <Calendar size={13} className={active ? "text-indigo-600 shrink-0" : "text-slate-400 shrink-0"} />

        {badgeClassName ? (
          <span className={badgeClassName}>{label}:</span>
        ) : (
          <span className="text-[10px] uppercase text-slate-400 font-bold whitespace-nowrap">
            {label}:
          </span>
        )}

        <span
          className={`text-xs whitespace-nowrap ${
            active ? "font-bold text-slate-800" : "font-medium text-slate-400"
          }`}
        >
          {summaryText}
        </span>

        {allowClear && active && (
          <button
            type="button"
            onClick={handleClear}
            className="ml-0.5 p-0.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer bg-transparent border-none flex items-center"
            title={`Clear ${label} filter`}
          >
            <X size={11} />
          </button>
        )}

        <ChevronDown
          size={13}
          className={`text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 z-[1200] w-[285px] bg-white rounded-xl border border-slate-200 shadow-xl p-3 space-y-3 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
              {label} Filter
            </span>
            {allowClear && active && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer bg-transparent border-none p-0"
              >
                Clear
              </button>
            )}
          </div>

          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`py-1.5 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                mode === "single"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Single Date
            </button>
            <button
              type="button"
              onClick={() => setMode("range")}
              className={`py-1.5 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                mode === "range"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              From – To Range
            </button>
          </div>

          {mode === "single" ? (
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                Exact Date
              </label>
              <input
                type="date"
                value={value.date}
                onChange={(e) =>
                  onChange({ date: e.target.value, from: "", to: "" })
                }
                className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={value.from}
                  max={value.to || undefined}
                  onChange={(e) => {
                    const nextFrom = e.target.value;
                    onChange({
                      date: "",
                      from: nextFrom,
                      to: value.to && nextFrom && value.to < nextFrom ? nextFrom : value.to,
                    });
                  }}
                  className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={value.to}
                  min={value.from || undefined}
                  onChange={(e) => {
                    const nextTo = e.target.value;
                    onChange({
                      date: "",
                      from: value.from && nextTo && value.from > nextTo ? nextTo : value.from,
                      to: nextTo,
                    });
                  }}
                  className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
