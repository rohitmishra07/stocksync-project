import React, { useState, useEffect } from "react";
import Modal from "../components/common/Modal";
import { useCreateProduct, useCreateCategory, useCategories, useLocations } from "../hooks/useApi";

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  prefill?: {
    name?: string;
    sku?: string;
    barcode?: string;
    brand?: string;
    category_name?: string;
    image_url?: string;
  };
}

export default function AddProductModal({ open, onClose, prefill }: AddProductModalProps) {
  const [form, setForm] = useState({
    name: prefill?.name || "",
    sku: prefill?.sku || prefill?.barcode || "",
    barcode: prefill?.barcode || "",
    brand: prefill?.brand || "",
    category: "",
    cost_price: "0",
    selling_price: "0",
    low_stock_threshold: "10",
    description: "",
    initial_stock: "0",
    location_id: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && prefill) {
      setForm(f => ({
        ...f,
        name: prefill.name || f.name,
        sku: prefill.sku || prefill.barcode || f.sku,
        barcode: prefill.barcode || f.barcode,
        brand: prefill.brand || f.brand,
      }));
    } else if (!open) {
      setForm({
        name: "", sku: "", barcode: "", brand: "", category: "",
        cost_price: "0", selling_price: "0", low_stock_threshold: "10", 
        description: "", initial_stock: "0", location_id: "",
      });
    }
  }, [open, prefill]);

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const createProduct = useCreateProduct();
  const createCategory = useCreateCategory();
  const { data: categories } = useCategories();
  const { data: locations } = useLocations();

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.sku) {
      setError("Name and SKU are required.");
      return;
    }

    try {
      let categoryId = form.category;
      
      // If adding a new category, create it first
      if (showNewCategory && newCategoryName.trim()) {
        const newCat = await createCategory.mutateAsync(newCategoryName.trim());
        categoryId = newCat.id;
      }

      await createProduct.mutateAsync({
        name: form.name,
        sku: form.sku,
        barcode: form.barcode || undefined,
        brand: form.brand || undefined,
        category: categoryId || undefined,
        cost_price: form.cost_price,
        selling_price: form.selling_price,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 10,
        description: form.description || undefined,
        initial_stock: parseInt(form.initial_stock) || 0,
        location_id: form.location_id || undefined,
      });
      setForm({
        name: "", sku: "", barcode: "", brand: "", category: "",
        cost_price: "0", selling_price: "0", low_stock_threshold: "10", 
        description: "", initial_stock: "0", location_id: "",
      });
      setShowNewCategory(false);
      setNewCategoryName("");
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data;
      if (msg && typeof msg === "object") {
        const messages = Object.entries(msg)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
          .join(". ");
        setError(messages);
      } else {
        setError("Failed to create product.");
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New Product" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-100">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.name} onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              placeholder="e.g. Wireless Mouse" required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.sku} onChange={(e) => update("sku", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              placeholder="e.g. WM-001" required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cost ($)</label>
            <input
              type="number" step="0.01" value={form.cost_price} onChange={(e) => update("cost_price", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Price ($)</label>
            <input
              type="number" step="0.01" value={form.selling_price} onChange={(e) => update("selling_price", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Low Stock Alert</label>
            <input
              type="number" value={form.low_stock_threshold} onChange={(e) => update("low_stock_threshold", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
            />
          </div>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2">
            Initial Inventory Setup
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Opening Stock</label>
              <input
                type="number" value={form.initial_stock} onChange={(e) => update("initial_stock", e.target.value)}
                className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Warehouse</label>
              <select
                value={form.location_id} onChange={(e) => update("location_id", e.target.value)}
                className="w-full rounded-lg border border-blue-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white"
              >
                <option value="">Default Warehouse</option>
                {locations?.results?.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
               <button 
                  type="button"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tighter"
               >
                  {showNewCategory ? "← Select Existing" : "+ Create New"}
               </button>
            </div>
            
            {showNewCategory ? (
               <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-lg border border-blue-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-blue-50/30"
                  placeholder="New Category Name"
                  autoFocus
               />
            ) : (
               <select
                  value={form.category} onChange={(e) => update("category", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
               >
                  <option value="">Uncategorized</option>
                  {categories?.results?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
               </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Brand</label>
            <input
              type="text" value={form.brand} onChange={(e) => update("brand", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
          <textarea
            value={form.description} onChange={(e) => update("description", e.target.value)}
            rows={2} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-shadow"
            placeholder="Product details..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button" onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit" disabled={createProduct.isPending}
            className="px-8 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-blue-200 active:scale-95"
          >
            {createProduct.isPending ? "Adding..." : "Add Product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
