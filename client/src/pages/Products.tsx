import React, { useEffect, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { Category, Product, Supplier } from "../types";
import { Modal } from "../components/Modal";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  unit: "pcs",
  costPrice: "0",
  sellingPrice: "0",
  taxRate: "0",
  stockQty: "0",
  reorderLevel: "5",
  categoryId: "",
  supplierId: "",
};

export function Products() {
  const { hasRole } = useAuth();
  const canEdit = hasRole("ADMIN", "MANAGER");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const [pRes, cRes, sRes] = await Promise.all([
      api.get("/products", { params: search ? { search } : {} }),
      api.get("/categories"),
      api.get("/suppliers"),
    ]);
    setProducts(pRes.data);
    setCategories(cRes.data);
    setSuppliers(sRes.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description || "",
      unit: p.unit,
      costPrice: String(p.costPrice),
      sellingPrice: String(p.sellingPrice),
      taxRate: String(p.taxRate),
      stockQty: String(p.stockQty),
      reorderLevel: String(p.reorderLevel),
      categoryId: p.categoryId || "",
      supplierId: p.supplierId || "",
    });
    setError("");
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      categoryId: form.categoryId || null,
      supplierId: form.supplierId || null,
    };
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
      } else {
        await api.post("/products", payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handleDelete(p: Product) {
    if (!confirm(`Delete product "${p.name}"?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      load();
    } catch (err) {
      alert(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-slate-500">Manage your product catalog and stock levels</p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={openCreate}>
            + Add Product
          </button>
        )}
      </div>

      <div className="card p-4">
        <input
          className="input max-w-sm"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Cost</th>
              <th>Price</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-6 text-slate-500">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-6 text-slate-500">No products found.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.category?.name || "—"}</td>
                  <td>${p.costPrice.toFixed(2)}</td>
                  <td className="font-medium">${p.sellingPrice.toFixed(2)}</td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.stockQty <= p.reorderLevel ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {p.stockQty} {p.unit}
                    </span>
                  </td>
                  <td className="text-right space-x-2">
                    {canEdit && (
                      <>
                        <button className="text-brand-600 text-sm font-medium" onClick={() => openEdit(p)}>
                          Edit
                        </button>
                        <button className="text-red-600 text-sm font-medium" onClick={() => handleDelete(p)}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Product" : "Add Product"} onClose={() => setShowModal(false)} wide>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">SKU</label>
                <input className="input" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div>
                <label className="label">Name</label>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Cost Price</label>
                <input className="input" type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
              </div>
              <div>
                <label className="label">Selling Price</label>
                <input className="input" type="number" step="0.01" min="0" required value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
              </div>
              <div>
                <label className="label">Tax Rate (%)</label>
                <input className="input" type="number" step="0.01" min="0" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Stock Qty</label>
                <input className="input" type="number" min="0" value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} disabled={!!editing} />
              </div>
              <div>
                <label className="label">Reorder Level</label>
                <input className="input" type="number" min="0" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} />
              </div>
              <div>
                <label className="label">Unit</label>
                <input className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">— None —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Supplier</label>
                <select className="input" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                  <option value="">— None —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {editing && (
              <p className="text-xs text-slate-400">
                Stock quantity is locked here — use Purchase Orders or a stock adjustment to change it.
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">{editing ? "Save Changes" : "Create Product"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
