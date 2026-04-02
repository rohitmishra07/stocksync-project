import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "../components/common/Modal";
import { useCreateOrder, useProducts } from "../hooks/useApi";

interface OrderItemForm {
  variant: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: string;
}

interface AddOrderModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddOrderModal({ open, onClose }: AddOrderModalProps) {
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    channel: "manual",
    notes: "",
    placed_at: new Date().toISOString().slice(0, 16),
  });
  const [items, setItems] = useState<OrderItemForm[]>([
    { variant: "", sku: "", name: "", quantity: 1, unit_price: "0" },
  ]);
  const [error, setError] = useState("");

  const createOrder = useCreateOrder();
  const { data: products } = useProducts();

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateItem = (idx: number, key: keyof OrderItemForm, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item))
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { variant: "", sku: "", name: "", quantity: 1, unit_price: "0" },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const selectProduct = (idx: number, productId: string) => {
    const product = products?.results?.find((p) => p.id === productId);
    if (product) {
      // Use the first variant if available
      const variantId = product.variants?.[0]?.id || "";
      setItems((prev) =>
        prev.map((item, i) =>
          i === idx
            ? {
                ...item,
                variant: variantId,
                sku: product.sku,
                name: product.name,
                unit_price: product.selling_price,
              }
            : item
        )
      );
    }
  };

  const grandTotal = items.reduce(
    (sum, item) => sum + item.quantity * parseFloat(item.unit_price || "0"),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validItems = items.filter((item) => item.name && item.quantity > 0);
    if (validItems.length === 0) {
      setError("At least one order item is required.");
      return;
    }

    try {
      await createOrder.mutateAsync({
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        channel: form.channel,
        notes: form.notes,
        placed_at: form.placed_at ? new Date(form.placed_at).toISOString() : new Date().toISOString(),
        items: validItems.map((item) => ({
          variant: item.variant || null,
          sku: item.sku,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: "0",
          tax: "0",
        })),
      });
      // Reset form
      setForm({
        customer_name: "", customer_email: "", customer_phone: "",
        channel: "manual", notes: "",
        placed_at: new Date().toISOString().slice(0, 16),
      });
      setItems([{ variant: "", sku: "", name: "", quantity: 1, unit_price: "0" }]);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (msg && typeof msg === "object") {
        setError(JSON.stringify(msg));
      } else {
        setError("Failed to create order.");
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Order" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={form.customer_name}
              onChange={(e) => update("customer_name", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Email
            </label>
            <input
              type="email"
              value={form.customer_email}
              onChange={(e) => update("customer_email", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="john@example.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={form.customer_phone}
              onChange={(e) => update("customer_phone", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
            <select
              value={form.channel}
              onChange={(e) => update("channel", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="manual">Manual</option>
              <option value="shopify">Shopify</option>
              <option value="amazon">Amazon</option>
              <option value="woocommerce">WooCommerce</option>
              <option value="pos">POS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
            <input
              type="datetime-local"
              value={form.placed_at}
              onChange={(e) => update("placed_at", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Order Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-900">Order Items</label>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> Add Item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">Product</label>
                  <select
                    value={products?.results?.find((p) => p.name === item.name)?.id || ""}
                    onChange={(e) => selectProduct(idx, e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select product or type manually</option>
                    {products?.results?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <label className="block text-xs text-gray-500 mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-gray-500 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                  >
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
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Optional order notes..."
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="text-sm">
            <span className="text-gray-500">Estimated Total: </span>
            <span className="text-lg font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createOrder.isPending}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createOrder.isPending ? "Creating..." : "Create Order"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
