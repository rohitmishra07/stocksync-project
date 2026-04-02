import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "./common/Modal";
import { useProducts } from "../hooks/useApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "../api/endpoints";

interface POLineForm {
  product: string;
  product_name: string;
  quantity_ordered: number;
  unit_cost: string;
}

interface CreatePOModalProps {
  open: boolean;
  onClose: () => void;
  initialProduct?: string;
  initialQuantity?: number;
}

export default function CreatePOModal({ open, onClose, initialProduct, initialQuantity }: CreatePOModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    supplier: "",
    expected_delivery: "",
    notes: "",
  });
  const [lines, setLines] = useState<POLineForm[]>([
    { product: initialProduct || "", product_name: "", quantity_ordered: initialQuantity || 1, unit_cost: "0" },
  ]);
  const [error, setError] = useState("");

  const { data: products } = useProducts();
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => ordersApi.suppliers.list().then(res => res.data.results)
  });

  const createPO = useMutation({
    mutationFn: (data: any) => ordersApi.purchaseOrders.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
    }
  });

  const sendPO = useMutation({
    mutationFn: (id: string) => ordersApi.purchaseOrders.send(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
    }
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const updateLine = (idx: number, key: keyof POLineForm, value: string | number) => {
    setLines((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
  };

  const addLine = () => setLines((prev) => [...prev, { product: "", product_name: "", quantity_ordered: 1, unit_cost: "0" }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const selectProduct = (idx: number, productId: string) => {
    const product = products?.results?.find((p) => p.id === productId);
    if (product) {
      setLines((prev) =>
        prev.map((item, i) =>
          i === idx ? { ...item, product: productId, product_name: product.name, unit_cost: product.cost_price } : item
        )
      );
    }
  };

  const grandTotal = lines.reduce((sum, item) => sum + item.quantity_ordered * parseFloat(item.unit_cost || "0"), 0);

  const handleSubmit = async (action: 'draft' | 'send') => {
    setError("");
    const validLines = lines.filter((item) => item.product && item.quantity_ordered > 0);
    if (validLines.length === 0) {
      setError("At least one product line is required.");
      return;
    }
    if (!form.supplier) {
      setError("Supplier is required.");
      return;
    }

    try {
      const res = await createPO.mutateAsync({
        supplier: form.supplier,
        notes: form.notes,
        expected_delivery: form.expected_delivery || null,
        status: "draft",
        lines: validLines.map(l => ({
          product: l.product,
          quantity_ordered: l.quantity_ordered,
          unit_cost: l.unit_cost
        })),
      });

      if (action === 'send') {
        await sendPO.mutateAsync(res.data.id);
      }

      setForm({ supplier: "", expected_delivery: "", notes: "" });
      setLines([{ product: "", product_name: "", quantity_ordered: 1, unit_cost: "0" }]);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data ? JSON.stringify(err.response.data) : "Failed to create Purchase Order.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New Purchase Order" maxWidth="max-w-3xl">
      <div className="space-y-5">
        {error && <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <select
              value={form.supplier}
              onChange={(e) => update("supplier", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Supplier</option>
              {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
            <input
              type="date"
              value={form.expected_delivery}
              onChange={(e) => update("expected_delivery", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-900">Line Items</label>
            <button type="button" onClick={addLine} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <Plus className="h-3.5 w-3.5" /> Add Product
            </button>
          </div>
          <div className="space-y-3">
            {lines.map((item, idx) => (
              <div key={idx} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Product</label>
                  <select
                    value={item.product}
                    onChange={(e) => selectProduct(idx, e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Search products...</option>
                    {products?.results?.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">Qty Ordered</label>
                  <input
                    type="number" min="1" value={item.quantity_ordered}
                    onChange={(e) => updateLine(idx, "quantity_ordered", parseInt(e.target.value) || 1)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-gray-500 mb-1">Unit Cost</label>
                  <input
                    type="number" step="0.01" min="0" value={item.unit_cost}
                    onChange={(e) => updateLine(idx, "unit_cost", e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {lines.length > 1 && (
                  <button type="button" onClick={() => removeLine(idx)} className="p-2 text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Special instructions..."
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm">
            <span className="text-gray-500">PO Total: </span>
            <span className="text-lg font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={() => handleSubmit('draft')} disabled={createPO.isPending} className="px-4 py-2 border border-blue-600 text-blue-600 rounded text-sm font-medium hover:bg-blue-50">
              Save Draft
            </button>
            <button onClick={() => handleSubmit('send')} disabled={createPO.isPending || sendPO.isPending} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
              {createPO.isPending ? "Processing..." : "Create & Send"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
