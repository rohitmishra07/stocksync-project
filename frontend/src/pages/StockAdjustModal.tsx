import { useState } from "react";
import Modal from "../components/common/Modal";
import { useAdjustStock, useStockLevels, useLocations } from "../hooks/useApi";
import { StockLevel } from "../types";
import { Scan, Search } from "lucide-react";
import BarcodeScanner from "../components/BarcodeScanner";

interface StockAdjustModalProps {
  open: boolean;
  onClose: () => void;
}

export default function StockAdjustModal({ open, onClose }: StockAdjustModalProps) {
  const [form, setForm] = useState({
    variant_id: "",
    location_id: "",
    quantity_change: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const adjustStock = useAdjustStock();
  const { data: stockData } = useStockLevels();
  const { data: locations } = useLocations();

  // Get unique variants from stock levels
  const variants = stockData?.results
    ? Array.from(
      new Map(
        stockData.results.map((s: StockLevel) => [
          s.variant?.id || s.variant,
          { id: s.variant?.id || s.variant, sku: s.variant?.sku || "", product_name: s.product_name },
        ])
      ).values()
    )
    : [];

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.variant_id || !form.location_id || !form.quantity_change) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      await adjustStock.mutateAsync({
        variant_id: form.variant_id,
        location_id: form.location_id,
        quantity_change: parseInt(form.quantity_change),
        notes: form.notes || undefined,
      });
      setForm({ variant_id: "", location_id: "", quantity_change: "", notes: "" });
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || "Failed to adjust stock.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Adjust Stock">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Variant <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
                <select
                    value={form.variant_id}
                    onChange={(e) => update("variant_id", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all shadow-sm appearance-none bg-white font-medium"
                    required
                >
                    <option value="">Select or scan a product...</option>
                    {variants.map((v) => (
                    <option key={String(v.id)} value={String(v.id)}>
                        {v.product_name} [{v.sku}]
                    </option>
                    ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="border-t-4 border-x-4 border-x-transparent border-t-gray-400 rounded-sm"></div>
                </div>
            </div>
            <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="px-4 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center shadow-lg active:scale-95"
                title="Scan Barcode"
            >
                <Scan className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location <span className="text-red-500">*</span>
          </label>
          <select
            value={form.location_id}
            onChange={(e) => update("location_id", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            required
          >
            <option value="">Select a location</option>
            {locations?.results?.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity Change <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={form.quantity_change}
            onChange={(e) => update("quantity_change", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Use positive to add, negative to remove"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Enter a positive number to add stock, negative to reduce stock.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Reason for adjustment..."
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
            disabled={adjustStock.isPending}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {adjustStock.isPending ? "Adjusting..." : "Adjust Stock"}
          </button>
        </div>
      </form>
      {showScanner && (
        <BarcodeScanner 
          onClose={() => setShowScanner(false)} 
          onScan={(code) => {
            const found = variants.find(v => v.sku.toLowerCase() === code.toLowerCase());
            if (found) {
                update("variant_id", String(found.id));
                setShowScanner(false);
            } else {
                alert(`Product with SKU "${code}" not found in current inventory.`);
            }
          }} 
        />
      )}
    </Modal>
  );
}
