import React, { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { Sale } from "../types";
import { Modal } from "../components/Modal";
import { useAuth } from "../context/AuthContext";

export function SalesHistory() {
  const { hasRole } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Sale | null>(null);

  async function load() {
    setLoading(true);
    const res = await api.get("/sales");
    setSales(res.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleVoid(sale: Sale) {
    if (!confirm(`Void invoice ${sale.invoiceNo}? This restores stock.`)) return;
    try {
      await api.post(`/sales/${sale.id}/void`);
      setSelected(null);
      load();
    } catch (err) {
      alert(apiErrorMessage(err));
    }
  }

  const statusColor: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-700",
    VOID: "bg-slate-200 text-slate-600",
    REFUNDED: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Sales History</h1>
        <p className="text-sm text-slate-500">Browse past transactions and invoices</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Cashier</th>
              <th>Total</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-6 text-slate-500">Loading...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-6 text-slate-500">No sales recorded yet.</td></tr>
            ) : (
              sales.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.invoiceNo}</td>
                  <td>{new Date(s.createdAt).toLocaleString()}</td>
                  <td>{s.customer?.name || "Walk-in"}</td>
                  <td>{s.user?.name}</td>
                  <td className="font-medium">${s.total.toFixed(2)}</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[s.status]}`}>{s.status}</span></td>
                  <td className="text-right">
                    <button className="text-brand-600 text-sm font-medium" onClick={() => setSelected(s)}>View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal title={`Invoice ${selected.invoiceNo}`} onClose={() => setSelected(null)}>
          <div className="space-y-3">
            <div className="text-sm text-slate-500">
              {new Date(selected.createdAt).toLocaleString()} · Cashier: {selected.user?.name} · Customer: {selected.customer?.name || "Walk-in"}
            </div>
            <div className="border rounded-md divide-y">
              {selected.items.map((i) => (
                <div key={i.id} className="flex justify-between px-3 py-2 text-sm">
                  <span>{i.product?.name} × {i.qty}</span>
                  <span>${i.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>${selected.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-${selected.discount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>${selected.tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>${selected.total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Paid ({selected.paymentMethod})</span><span>${selected.amountPaid.toFixed(2)}</span></div>
            </div>
            {hasRole("ADMIN", "MANAGER") && selected.status === "COMPLETED" && (
              <button className="btn-danger w-full" onClick={() => handleVoid(selected)}>Void Sale</button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
