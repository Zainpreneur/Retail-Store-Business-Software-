import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { DashboardData } from "../types";
import { StatCard } from "../components/StatCard";
import { Link } from "react-router-dom";

function currency(n: number) {
  return `$${n.toFixed(2)}`;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/reports/dashboard")
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading dashboard...</p>;
  if (!data) return <p className="text-slate-500">No data available.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of today's store performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's Revenue" value={currency(data.todayRevenue)} icon="💰" />
        <StatCard label="Today's Orders" value={data.todayOrders} icon="🧾" />
        <StatCard label="This Month" value={currency(data.monthRevenue)} icon="📅" accent="bg-green-50" />
        <StatCard label="Low Stock Items" value={data.lowStockCount} icon="⚠️" accent="bg-amber-50" />
        <StatCard label="Total Products" value={data.totalProducts} icon="📦" />
        <StatCard label="Total Customers" value={data.totalCustomers} icon="👥" />
        <StatCard label="Pending Purchase Orders" value={data.pendingPurchaseOrders} icon="📥" />
        <StatCard label="Month Orders" value={data.monthOrders} icon="📈" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Recent Sales</h2>
          {data.recentSales.length === 0 ? (
            <p className="text-sm text-slate-500">No sales yet.</p>
          ) : (
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Cashier</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSales.map((s) => (
                  <tr key={s.id}>
                    <td>{s.invoiceNo}</td>
                    <td>{s.customer?.name || "Walk-in"}</td>
                    <td>{s.user?.name}</td>
                    <td className="font-medium">{currency(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Link to="/sales" className="text-brand-600 text-sm font-medium mt-3 inline-block">
            View all sales →
          </Link>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-3">Top Selling Products</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-slate-500">No sales data yet.</p>
          ) : (
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((t, i) => (
                  <tr key={i}>
                    <td>{t.product?.name || "—"}</td>
                    <td>{t.qtySold}</td>
                    <td className="font-medium">{currency(t.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
