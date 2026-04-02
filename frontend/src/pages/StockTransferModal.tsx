import { useState } from "react";
import Modal from "../components/common/Modal";
import { useTransferStock, useStockLevels, useLocations } from "../hooks/useApi";

interface StockTransferModalProps {
  open: boolean;
  onClose: () => void;
}

export default function StockTransferModal({ open, onClose }: StockTransferModalProps) {
  const [form, setForm] = useState({
    variant_id: "",
    from_location_id: "",
    to_location_id: "",
    quantity: "",
    notes: "",
  });
  const [error, setError] = useState("");

  const transferStock = useTransferStock();
  const { data: stockData } = useStockLevels();
  const { data: locations } = useLocations();

  // Get unique variants from stock levels
  const variants = stockData?.results
    ? Array.from(
        new Map(
          stockData.results.map((s) => [
            s.variant?.id || s.variant,
            { id: s.variant?.id || s.variant, sku: s.variant?.sku || "", product_name: s.product_name },
          ])
        ).values()
      )
    : [];

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.variant_id || !form.from_location_id || !form.to_location_id || !form.quantity) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.from_location_id === form.to_location_id) {
      setError("Source and destination locations must be different.");
      return;
    }

    try {
      await transferStock.mutateAsync({
        variant_id: form.variant_id,
        from_location_id: form.from_location_id,
        to_location_id: form.to_location_id,
        quantity: parseInt(form.quantity),
        notes: form.notes || undefined,
      });
      setForm({ variant_id: "", from_location_id: "", to_location_id: "", quantity: "", notes: "" });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Failed to transfer stock.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Transfer Stock">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Variant <span className="text-red-500">*</span>
          </label>
          <select
            value={form.variant_id}
            onChange={(e) => update("variant_id", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            required
          >
            <option value="">Select a variant</option>
            {variants.map((v) => (
              <option key={String(v.id)} value={String(v.id)}>
                {v.product_name} ({v.sku})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Location <span className="text-red-500">*</span>
            </label>
            <select
              value={form.from_location_id}
              onChange={(e) => update("from_location_id", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Select source</option>
              {locations?.results?.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Location <span className="text-red-500">*</span>
            </label>
            <select
              value={form.to_location_id}
              onChange={(e) => update("to_location_id", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            >
              <option value="">Select destination</option>
              {locations?.results
                ?.filter((loc) => loc.id !== form.from_location_id)
                .map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => update("quantity", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Number of units to transfer"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Reason for transfer..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={transferStock.isPending}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {transferStock.isPending ? "Transferring..." : "Transfer Stock"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
