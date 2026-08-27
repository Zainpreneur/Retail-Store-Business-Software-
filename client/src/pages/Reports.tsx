import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { StatCard } from "../components/StatCard";
import { Product } from "../types";

interface SalesReport {
  totalRevenue: number;
  totalOrders: number;
  totalTax: number;
  totalDiscount: number;
  daily: { date: string; revenue: number; orders: number }[];
}

interface InventoryReport {
  totalProducts: number;
  totalStockValue: number;
  lowStock: Product[];
}

export function Reports() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [sRes, iRes] = await Promise.all([
      api.get("/reports/sales", { params: { from: from || undefined, to: to || undefined } }),
      api.get("/reports/inventory"),
    ]);
    setSalesReport(sRes.data);
    setInventoryReport(iRes.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxRevenue = salesReport ? Math.max(...salesReport.daily.map((d) => d.revenue), 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-slate-500">Sales performance and inventory valuation</p>
      </div>

      <div className="card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={load}>Apply Filter</button>
      </div>

      {loading || !salesReport || !inventoryReport ? (
        <p className="text-slate-500">Loading reports...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={`$${salesReport.totalRevenue.toFixed(2)}`} icon="💰" />
            <StatCard label="Total Orders" value={salesReport.totalOrders} icon="🧾" />
            <StatCard label="Total Tax Collected" value={`$${salesReport.totalTax.toFixed(2)}`} icon="🏛️" />
            <StatCard label="Inventory Value" value={`$${inventoryReport.totalStockValue.toFixed(2)}`} icon="📦" />
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-4">Daily Revenue</h2>
            {salesReport.daily.length === 0 ? (
              <p className="text-sm text-slate-500">No sales in this period.</p>
            ) : (
              <div className="space-y-2">
                {salesReport.daily.map((d) => (
                  <div key={d.date} className="flex items-center gap-3 text-sm">
                    <span className="w-24 text-slate-500">{d.date}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-brand-500 h-4 rounded-full"
                        style={{ width: `${(d.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="w-24 text-right font-medium">${d.revenue.toFixed(2)}</span>
                    <span className="w-16 text-right text-slate-400">{d.orders} orders</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-4">Low Stock Items ({inventoryReport.lowStock.length})</h2>
            {inventoryReport.lowStock.length === 0 ? (
              <p className="text-sm text-slate-500">All products are sufficiently stocked. 🎉</p>
            ) : (
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Reorder Level</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryReport.lowStock.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td className="text-red-600 font-medium">{p.stockQty} {p.unit}</td>
                      <td>{p.reorderLevel} {p.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
