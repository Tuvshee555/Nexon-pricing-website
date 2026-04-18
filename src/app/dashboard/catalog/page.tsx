"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  sku?: string;
  currency: string;
  enabled: boolean;
  created_at: string;
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", image_url: "", sku: "", currency: "MNT" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => { setProducts(d.products || []); setLoading(false); });
  }, []);

  const save = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    });
    const data = await res.json() as { product?: Product };
    if (data.product) {
      setProducts((prev) => [data.product!, ...prev]);
      setForm({ name: "", description: "", price: "", image_url: "", sku: "", currency: "MNT" });
      setShowForm(false);
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleEnabled = async (p: Product) => {
    await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, enabled: !p.enabled }),
    });
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, enabled: !x.enabled } : x));
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] space-y-6">
      <section className="surface-card rounded-[30px] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">Product Catalog</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-slate-950">
              WhatsApp product catalog
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Add products here and send them as interactive WhatsApp list messages via keyword triggers or flow nodes.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
          >
            + Add product
          </button>
        </div>
      </section>

      {showForm && (
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-5">New product</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Product name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Premium Package" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Price *</label>
              <div className="flex gap-2">
                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="29000" type="number" className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-slate-400" />
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm focus:outline-none">
                  <option value="MNT">MNT</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Image URL (optional)</label>
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">SKU (optional)</label>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-slate-400" />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button onClick={save} disabled={saving || !form.name || !form.price} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors">
              {saving ? "Saving..." : "Save product"}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-sm text-slate-400 py-10">Loading...</div>
      ) : products.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-slate-500 font-medium">No products yet</p>
          <p className="text-sm text-slate-400 mt-1">Add your first product to start sending catalogs via WhatsApp.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className={`rounded-[24px] border bg-white p-5 shadow-sm ${p.enabled ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
              {p.image_url && (
                <img src={p.image_url} alt={p.name} className="mb-4 h-32 w-full rounded-xl object-cover" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-900">{p.name}</p>
                  {p.sku && <p className="text-xs text-slate-400">SKU: {p.sku}</p>}
                  {p.description && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{p.description}</p>}
                </div>
                <p className="text-base font-black text-slate-900 flex-shrink-0">
                  {p.price.toLocaleString()} {p.currency}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => void toggleEnabled(p)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${p.enabled ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                  {p.enabled ? "Active" : "Hidden"}
                </button>
                <button onClick={() => void remove(p.id)} className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-bold text-slate-900 mb-2">How to send a catalog via WhatsApp</p>
        <p className="text-sm text-slate-600">
          In your keyword triggers, create a trigger (e.g. keyword: &quot;catalog&quot;) and it will automatically send your active products as a WhatsApp interactive list. You can also add a &quot;Send Catalog&quot; node in your flows.
        </p>
      </div>
    </div>
  );
}
