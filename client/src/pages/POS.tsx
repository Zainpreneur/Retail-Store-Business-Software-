import React, { useEffect, useMemo, useState } from "react";
import { api, apiErrorMessage } from "../api/client";
import { Customer, Product, Sale } from "../types";

interface CartLine {
  product: Product;
  qty: number;
  discount: number;
}

export function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "MOBILE" | "STORE_CREDIT">("CASH");
  const [amountPaid, setAmountPaid] = useState("0");
  const [error, setError] = useState("");
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data.filter((p: Product) => p.active)));
    api.get("/customers").then((res) => setCustomers(res.data));
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 24);
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 24);
  }, [products, search]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stockQty) return prev;
        return prev.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l));
      }
      if (product.stockQty < 1) return prev;
      return [...prev, { product, qty: 1, discount: 0 }];
    });
  }

  function updateQty(productId: string, qty: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, qty: Math.max(1, Math.min(qty, l.product.stockQty)) } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  const subtotal = cart.reduce((s, l) => s + l.product.sellingPrice * l.qty - l.discount, 0);
  const tax = cart.reduce((s, l) => {
    const lineGross = l.product.sellingPrice * l.qty - l.discount;
    return s + lineGross * (l.product.taxRate / 100);
  }, 0);
  const total = Math.max(0, subtotal - Number(discount || 0) + tax);
  const changeDue = Math.max(0, Number(amountPaid || 0) - total);

  function resetSale() {
    setCart([]);
    setCustomerId("");
    setDiscount("0");
    setAmountPaid("0");
    setPaymentMethod("CASH");
    setCompletedSale(null);
    setError("");
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/sales", {
        customerId: customerId || null,
        items: cart.map((l) => ({ productId: l.product.id, qty: l.qty, discount: l.discount })),
        discount: Number(discount || 0),
        paymentMethod,
        amountPaid: Number(amountPaid || 0),
      });
      setCompletedSale(res.data);
      const refreshed = await api.get("/products");
      setProducts(refreshed.data.filter((p: Product) => p.active));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (completedSale) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card p-6 text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h1 className="text-xl font-bold">Sale Completed</h1>
          <p className="text-slate-500">Invoice {completedSale.invoiceNo}</p>
          <div className="border rounded-md divide-y text-left">
            {completedSale.items.map((i) => (
              <div key={i.id} className="flex justify-between px-4 py-2 text-sm">
                <span>{i.product?.name} × {i.qty}</span>
                <span>${i.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="text-left text-sm space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>${completedSale.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>-${completedSale.discount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>${completedSale.tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>${completedSale.total.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Paid ({completedSale.paymentMethod})</span><span>${completedSale.amountPaid.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Change Due</span><span>${completedSale.changeDue.toFixed(2)}</span></div>
          </div>
          <button className="btn-primary w-full" onClick={resetSale}>Start New Sale</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-2xl font-bold">Point of Sale</h1>
        <input
          className="input"
          placeholder="Search products by name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stockQty < 1}
              className="card p-3 text-left hover:border-brand-400 hover:shadow-md transition disabled:opacity-40"
            >
              <p className="font-medium text-sm truncate">{p.name}</p>
              <p className="text-xs text-slate-400">{p.sku}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-semibold text-brand-700">${p.sellingPrice.toFixed(2)}</span>
                <span className="text-xs text-slate-500">{p.stockQty} {p.unit}</span>
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && <p className="text-slate-500 text-sm col-span-full">No products found.</p>}
        </div>
      </div>

      <div className="card p-4 flex flex-col h-fit sticky top-4">
        <h2 className="font-semibold mb-3">Current Sale</h2>

        <select className="input mb-3" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Walk-in Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="flex-1 overflow-y-auto max-h-72 space-y-2 mb-3">
          {cart.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Cart is empty. Click a product to add it.</p>
          ) : (
            cart.map((l) => (
              <div key={l.product.id} className="flex items-center justify-between gap-2 text-sm border-b border-slate-100 pb-2">
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{l.product.name}</p>
                  <p className="text-xs text-slate-400">${l.product.sellingPrice.toFixed(2)} each</p>
                </div>
                <input
                  type="number"
                  className="input w-16 !py-1 text-center"
                  min={1}
                  max={l.product.stockQty}
                  value={l.qty}
                  onChange={(e) => updateQty(l.product.id, Number(e.target.value))}
                />
                <span className="w-16 text-right font-medium">
                  ${(l.product.sellingPrice * l.qty - l.discount).toFixed(2)}
                </span>
                <button className="text-red-500" onClick={() => removeLine(l.product.id)}>✕</button>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2 text-sm border-t border-slate-200 pt-3">
          <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between items-center">
            <span>Discount</span>
            <input type="number" min={0} step="0.01" className="input w-24 !py-1 text-right" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
          <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-base"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <label className="label">Payment Method</label>
            <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="MOBILE">Mobile</option>
              <option value="STORE_CREDIT">Store Credit</option>
            </select>
          </div>
          <div>
            <label className="label">Amount Paid</label>
            <input type="number" min={0} step="0.01" className="input" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
          </div>
        </div>
        {Number(amountPaid) > 0 && (
          <p className="text-xs text-slate-500 mt-1">Change due: ${changeDue.toFixed(2)}</p>
        )}

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

        <button
          className="btn-primary w-full mt-4"
          disabled={cart.length === 0 || submitting}
          onClick={handleCheckout}
        >
          {submitting ? "Processing..." : `Complete Sale — $${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
