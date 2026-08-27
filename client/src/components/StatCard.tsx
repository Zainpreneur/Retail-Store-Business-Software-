import React from "react";

export function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
  accent?: string;
}) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div
        className={`h-11 w-11 rounded-lg flex items-center justify-center text-xl ${
          accent || "bg-brand-50"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
