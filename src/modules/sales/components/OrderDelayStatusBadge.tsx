"use client";

import React from "react";

interface OrderDelayStatusBadgeProps {
  completionDate?: string | null;
  completedDate?: string | null;
}

/**
 * Renders the delivery timing badge (On Date, Delayed by X day(s), Due Today, or Overdue by X day(s))
 * comparing completedDate against completionDate, or today's date when not yet completed.
 */
export default function OrderDelayStatusBadge({
  completionDate,
  completedDate,
}: OrderDelayStatusBadgeProps) {
  if (!completionDate) return null;

  try {
    const compDatePart = completionDate.split("T")[0];
    const compTime = new Date(`${compDatePart}T00:00:00`).getTime();
    if (isNaN(compTime)) return null;

    // 1. When completed_date is present (not null): compare completed_date vs completion_date
    if (completedDate) {
      const doneDatePart = completedDate.split("T")[0];
      const doneTime = new Date(`${doneDatePart}T00:00:00`).getTime();

      if (!isNaN(doneTime)) {
        const delayDays = Math.round((doneTime - compTime) / (1000 * 60 * 60 * 24));

        if (delayDays > 0) {
          return (
            <span className="bg-orange-50 text-orange-700 border border-orange-200 font-extrabold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap inline-flex items-center gap-1 shadow-3xs">
              <span className="h-1 w-1 rounded-full bg-orange-500" />
              Delayed by {delayDays} {delayDays === 1 ? "day" : "days"}
            </span>
          );
        }

        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap shadow-3xs">
            On Date
          </span>
        );
      }
    }

    // 2. When completed_date is null: normal overdue / due today calculation
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const todayTime = new Date(`${todayStr}T00:00:00`).getTime();

    const diffDays = Math.round((todayTime - compTime) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return null;
    }

    if (diffDays === 0) {
      return (
        <span className="bg-amber-50 text-amber-700 border border-amber-200 font-extrabold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap inline-flex items-center gap-1 shadow-3xs">
          <span className="h-1 w-1 rounded-full bg-amber-500" />
          Due Today
        </span>
      );
    }

    return (
      <span className="bg-rose-50 text-rose-700 border border-rose-200 font-extrabold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap inline-flex items-center gap-1 shadow-3xs">
        <span className="h-1 w-1 rounded-full bg-rose-500 animate-pulse" />
        Overdue by {diffDays} {diffDays === 1 ? "day" : "days"}
      </span>
    );
  } catch {
    return null;
  }
}
