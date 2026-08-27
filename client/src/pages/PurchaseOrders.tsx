import React, { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { Product, PurchaseOrder, Supplier } from "../types";
import { Modal } from "../components/Modal";

interface Line {
  productId: string;
  qty: number;
  costPrice: number;
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-slate-200 text-slate-600",
  ORDERED: "bg-amber-100 text-amber-700",
  RECEIVED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [oRes, sRes, pRes] = await Promise.all([
      api.get("/purchase-orders"),
      api.get("/suppliers"),
      api.get("/products"),
    ]);
    setOrders(oRes.data);
    setSuppliers(sRes.data);
    setProducts(pRes.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setSupplierId("");
    setLines([]);
    setNotes("");
    setError("");
    setShowModal(true);
  }

  function addLine() {
    if (products.length === 0) return;
    setLines((prev) => [...prev, { productId: products[0].id, qty: 1, costPrice: products[0].costPrice }]);
  }

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!supplierId || lines.length === 0) {
      setError("Select a supplier and add at least one line item.");
      return;
    }
    try {
      await api.post("/purchase-orders", { supplierId, items: lines, notes });
      setShowModal(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleReceive(po: PurchaseOrder) {
    if (!confirm(`Mark PO ${po.poNumber} as received? This will add stock for all line items.`)) return;
    try {
      await api.post(`/purchase-orders/${po.id}/receive`);
      setSelected(null);
      load();
    } catch (err) {
      alert(apiErrorMessage(err));
    }
  }

  async function handleCancel(po: PurchaseOrder) {
    if (!confirm(`Cancel PO ${po.poNumber}?`)) return;
    try {
      await api.post(`/purchase-orders/${po.id}/cancel`);
      setSelected(null);
      load();
    } catch (err) {
      alert(apiErrorMessage(err));
    }
  }

  const total = lines.reduce((s, l) => s + l.qty * l.costPrice, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-sm text-slate-500">Order stock from suppliers and receive it into inventory</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ New Purchase Order</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-6 text-slate-500">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-slate-500">No purchase orders yet.</td></tr>
            ) : (
              orders.map((po) => (
                <tr key={po.id}>
                  <td className="font-mono text-xs">{po.poNumber}</td>
                  <td>{po.supplier?.name}</td>
                  <td className="font-medium">${po.totalAmount.toFixed(2)}</td>
                  <td><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[po.status]}`}>{po.status}</span></td>
                  <td>{new Date(po.createdAt).toLocaleDateString()}</td>
                  <td className="text-right">
                    <button className="text-brand-600 text-sm font-medium" onClick={() => setSelected(po)}>View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title="New Purchase Order" onClose={() => setShowModal(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Supplier</label>
              <select className="input" required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">— Select supplier —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Line Items</label>
                <button type="button" className="btn-secondary !py-1 !px-2 text-xs" onClick={addLine}>+ Add Line</button>
              </div>
              <div className="space-y-2">
                {lines.map((l, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      className="input flex-1"
                      value={l.productId}
                      onChange={(e) => {
                        const p = products.find((pr) => pr.id === e.target.value);
                        updateLine(idx, { productId: e.target.value, costPrice: p?.costPrice ?? l.costPrice });
                      }}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      className="input w-20"
                      value={l.qty}
                      onChange={(e) => updateLine(idx, { qty: Number(e.target.value) })}
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="input w-24"
                      value={l.costPrice}
                      onChange={(e) => updateLine(idx, { costPrice: Number(e.target.value) })}
                    />
                    <span className="w-20 text-right text-sm font-medium">${(l.qty * l.costPrice).toFixed(2)}</span>
                    <button type="button" className="text-red-500" onClick={() => removeLine(idx)}>✕</button>
                  </div>
                ))}
                {lines.length === 0 && <p className="text-sm text-slate-400">No line items added.</p>}
              </div>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex justify-between items-center font-semibold text-base border-t pt-3">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Create Purchase Order</button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title={`Purchase Order ${selected.poNumber}`} onClose={() => setSelected(null)} wide>
          <div className="space-y-3">
            <div className="text-sm text-slate-500">
              Supplier: {selected.supplier?.name} · Created by {selected.user?.name} · {new Date(selected.createdAt).toLocaleString()}
            </div>
            <div className="border rounded-md divide-y">
              {selected.items.map((i) => (
                <div key={i.id} className="flex justify-between px-3 py-2 text-sm">
                  <span>{i.product?.name} × {i.qty} @ ${i.costPrice.toFixed(2)}</span>
                  <span>${i.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span>${selected.totalAmount.toFixed(2)}</span>
            </div>
            {selected.status === "ORDERED" && (
              <div className="flex gap-2">
                <button className="btn-primary flex-1" onClick={() => handleReceive(selected)}>Mark as Received</button>
                <button className="btn-danger flex-1" onClick={() => handleCancel(selected)}>Cancel Order</button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
