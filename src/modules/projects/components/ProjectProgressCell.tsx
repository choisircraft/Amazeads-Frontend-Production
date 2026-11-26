import React from "react";

const DEPT_CONFIG = [
  { id: 1, label: "DS" },
  { id: 2, label: "PR" },
  { id: 3, label: "PD" },
  { id: 4, label: "LG" },
];

interface ProjectProgressCellProps {
  departments?: any[];
}

/** Renders the 4-department (DS, PR, PD, LG) progress indicator cell for a project row. */
export default function ProjectProgressCell({ departments = [] }: ProjectProgressCellProps) {
  return (
    <td className="align-middle" style={{ minWidth: "140px" }}>
      <div className="flex items-center justify-center py-0.5">
        <div className="flex items-center gap-1 text-[11px] font-bold">
          {DEPT_CONFIG.map(({ id, label }, idx) => {
            const d = departments.find((x: any) => x.department_id === id || x.id === id);
            const isAssigned = d?.is_assigned === true;
            const isDone = d?.final_status === true;

            const prevD =
              idx > 0
                ? departments.find(
                    (x: any) => x.department_id === DEPT_CONFIG[idx - 1].id || x.id === DEPT_CONFIG[idx - 1].id
                  )
                : null;
            const prevAssigned = prevD?.is_assigned === true;
            const prevDone = prevD?.final_status === true;

            return (
              <React.Fragment key={id}>
                {idx > 0 && (
                  <span
                    className={`w-3.5 h-[1.5px] -translate-y-[4px] ${
                      prevAssigned && isAssigned && prevDone && isDone ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  />
                )}
                <div className="flex flex-col items-center w-5">
                  {isAssigned ? (
                    <span className={isDone ? "text-emerald-600 font-extrabold" : "text-rose-500 font-extrabold"}>
                      {isDone ? "✓" : "✕"}
                    </span>
                  ) : (
                    <span className="text-transparent select-none">–</span>
                  )}
                  <span
                    className={`text-[8px] font-extrabold mt-1 leading-none ${
                      isAssigned ? "text-slate-500" : "text-slate-200"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </td>
  );
}
