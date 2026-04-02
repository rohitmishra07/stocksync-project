import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "./common/Modal";
import { useProducts } from "../hooks/useApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../api/endpoints";

interface BundleComponentForm {
  product: string;
  quantity: number;
}

interface CreateBundleModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateBundleModal({ open, onClose }: CreateBundleModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    is_active: true,
  });
  const [components, setComponents] = useState<BundleComponentForm[]>([
    { product: "", quantity: 1 },
  ]);
  const [error, setError] = useState("");

  const { data: products } = useProducts({ limit: "100" });

  const createBundle = useMutation({
    mutationFn: (data: any) => productsApi.bundles.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  });

  const update = (key: string, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const updateComponent = (idx: number, key: keyof BundleComponentForm, value: string | number) => {
    setComponents((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
  };

  const addComponent = () => setComponents((prev) => [...prev, { product: "", quantity: 1 }]);
  const removeComponent = (idx: number) => setComponents((prev) => prev.filter((_, i) => i !== idx));

  // Compute suggested price from component cost logic could go here
  const suggestedPrice = components.reduce((sum, item) => {
    const p = products?.results?.find(p => p.id === item.product);
    return sum + (p ? parseFloat(p.selling_price) * item.quantity : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validComponents = components.filter((item) => item.product && item.quantity > 0);
    if (validComponents.length < 2) {
      setError("A bundle must contain at least two products.");
      return;
    }
    if (!form.name || !form.sku || !form.price) {
      setError("Name, SKU, and Price are required.");
      return;
    }

    try {
      await createBundle.mutateAsync({
        name: form.name,
        sku: form.sku,
        price: form.price,
        is_active: form.is_active,
        components: validComponents.map((c) => ({
          product_id: c.product, // Assuming the backend expects product_id or product based on serializers
          quantity: c.quantity
        })),
      });

      setForm({ name: "", sku: "", price: "", is_active: true });
      setComponents([{ product: "", quantity: 1 }]);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data ? JSON.stringify(err.response.data) : "Failed to create bundle.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Bundle" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Name</label>
            <input
              type="text" value={form.name} onChange={(e) => update("name", e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Starter Kit"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text" value={form.sku} onChange={(e) => update("sku", e.target.value)} required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="BNDL-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
              <input
                type="number" step="0.01" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-gray-400 mt-1">Suggested sum: ${suggestedPrice.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-900">Items / Components</label>
            <button type="button" onClick={addComponent} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <Plus className="h-3.5 w-3.5" /> Add Component
            </button>
          </div>
          <div className="space-y-3">
            {components.map((item, idx) => (
              <div key={idx} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Product</label>
                  <select
                    value={item.product}
                    onChange={(e) => updateComponent(idx, "product", e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select product...</option>
                    {products?.results?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                  <input
                    type="number" min="1" value={item.quantity}
                    onChange={(e) => updateComponent(idx, "quantity", parseInt(e.target.value) || 1)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {components.length > 2 && (
                  <button type="button" onClick={() => removeComponent(idx)} className="p-2 text-red-400 hover:text-red-600 outline-none">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
           <input type="checkbox" id="activeToggle" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
           <label htmlFor="activeToggle" className="text-sm text-gray-700 font-medium cursor-pointer">Activate immediately</label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={createBundle.isPending} className="px-5 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {createBundle.isPending ? "Creating..." : "Save Bundle"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
