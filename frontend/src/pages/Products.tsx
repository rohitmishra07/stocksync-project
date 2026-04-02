import { useState, useCallback } from "react";
import { Plus, Search, Upload, Trash2, MoreVertical, Scan, Printer } from "lucide-react";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";
import { useProducts, useExportProducts, useDeleteProduct, useImportProducts } from "../hooks/useApi";
import type { Product } from "../types";
import AddProductModal from "./AddProductModal";
import BarcodeScanner from "../components/BarcodeScanner";
import ImportExportModal from "../components/ImportExportModal";
import { productsApi } from "../api/endpoints";

export default function Products() {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [prefill, setPrefill] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [labelSize, setLabelSize] = useState<"38x21"|"avery5160"|"3x2">("38x21");
  const [params, setParams] = useState<Record<string, string>>({});
  
  const { data, isLoading } = useProducts({ ...params, ...(search ? { search } : {}) });
  const exportProducts = useExportProducts();
  const importProducts = useImportProducts();
  const deleteProduct = useDeleteProduct();

  const handleExport = async () => {
    try {
      const blob = await exportProducts.mutateAsync();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `products-export-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export products. Please try again.");
    }
  };

  const handleImport = async (file: File) => {
    try {
      const res = await importProducts.mutateAsync(file);
      alert(`Import successful: ${res.created} products added/updated. ${res.errors?.length || 0} errors.`);
    } catch (err: any) {
      alert(err?.response?.data?.error || "Failed to import products.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? Standard history will be preserved but active listing will be removed.`)) return;
    try {
      await deleteProduct.mutateAsync(id);
    } catch {
      alert("Failed to delete product. It may be linked to existing orders.");
    }
  };

  const onPageChange = useCallback((url: string) => {
    const urlObj = new URL(url);
    const page = urlObj.searchParams.get("page") || "1";
    setParams(p => ({ ...p, page }));
  }, []);

  const handleBarcodeScan = async (code: string) => {
    setShowScanner(false);
    try {
      const res = await productsApi.barcodeLookup(code);
      if (res.data.found_locally) {
        // Highlight local product
        setSearch(code);
      } else {
        // Prefill from external DB if available, otherwise just use the barcode
        setPrefill(res.data.external_data || { barcode: code });
        setShowAddModal(true);
      }
    } catch (err) {
      // Fallback: manually add with just the barcode
      setPrefill({ barcode: code });
      setShowAddModal(true);
    }
  };

  const handleGenerateLabels = async () => {
    if (selectedIds.length === 0) return alert("Please select products first.");
    try {
      const res = await productsApi.barcodeSheet({
        product_ids: selectedIds,
        label_size: labelSize
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (error) {
       alert("Failed to generate labels.");
    }
  };

  const columns = [
    {
      key: "selection",
      header: <input 
        type="checkbox" 
        onChange={(e) => {
          if (e.target.checked) setSelectedIds(data?.results.map(p => p.id) || []);
          else setSelectedIds([]);
        }}
        checked={selectedIds.length > 0 && selectedIds.length === data?.results.length}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />,
      render: (p: Product) => (
        <input 
          type="checkbox" 
          checked={selectedIds.includes(p.id)}
          onChange={(e) => {
            if (e.target.checked) setSelectedIds([...selectedIds, p.id]);
            else setSelectedIds(selectedIds.filter(id => id !== p.id));
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    },
    { key: "sku", header: "SKU", render: (p: Product) => <span className="font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-bold">{p.sku}</span> },
    {
      key: "name", header: "Product",
      className: "max-w-[250px]",
      render: (p: Product) => (
        <div className="flex items-center gap-3">
          {p.images?.[0] ? (
            <img src={p.images[0]} alt={p.name} className="h-10 w-10 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 text-[10px] text-gray-400 font-bold uppercase flex-shrink-0">
               {p.name.substring(0,2)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate tracking-tight">{p.name}</p>
            <p className="text-[11px] text-gray-500 font-medium">{p.brand || "Generics"} · {p.category_name || "Uncategorized"}</p>
          </div>
        </div>
      ),
    },
    { key: "selling_price", header: "Price", render: (p: Product) => <span className="font-bold text-gray-900 font-mono">${parseFloat(p.selling_price).toFixed(2)}</span> },
    { key: "margin", header: "Margin", render: (p: Product) => <span className={`font-bold text-[13px] font-mono ${p.margin > 30 ? "text-green-600" : "text-yellow-600"}`}>{p.margin}%</span> },
    {
      key: "total_stock", header: "Stock",
      render: (p: Product) => (
        <div className="flex flex-col">
          <span className={`font-bold text-[13px] font-mono ${p.total_stock <= p.low_stock_threshold ? "text-red-500" : "text-gray-900"}`}>
            {p.total_stock}
          </span>
          {p.total_stock <= p.low_stock_threshold && (
            <span className="text-[9px] text-red-400 font-bold uppercase tracking-tighter -mt-1">Reorder soon</span>
          )}
        </div>
      ),
    },
    { key: "is_active", header: "Status", render: (p: Product) => <StatusBadge status={p.is_active ? "active" : "inactive"} /> },
    {
      key: "actions", header: "",
      className: "w-10 text-right",
      render: (p: Product) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(p.id, p.name); }}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-all"
            title="Delete Product"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-all"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Products</h1>
          <p className="text-gray-500 text-sm font-medium mt-0.5">Manage your inventory catalog and pricing</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1 bg-emerald-50 rounded-lg pr-1">
              <button
                 onClick={handleGenerateLabels}
                 className="flex items-center gap-2 px-4 py-2 text-emerald-700 text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 rounded-lg transition-all border border-emerald-200"
              >
                <Printer className="h-3.5 w-3.5" /> Labels ({selectedIds.length})
              </button>
              <select
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value as any)}
                className="bg-transparent text-emerald-700 text-xs font-bold outline-none border-none py-2 pr-4 rounded-r-lg cursor-pointer"
              >
                <option value="38x21">38x21</option>
                <option value="avery5160">Avery 5160</option>
                <option value="3x2">3x2"</option>
              </select>
            </div>
          )}
          <div className="flex items-center bg-gray-100/50 p-1 rounded-xl border border-gray-200/50 mr-2">
            <button
               onClick={() => setShowImportExport(true)}
               className="flex items-center gap-2 px-4 py-2 text-gray-600 text-xs font-bold uppercase tracking-widest hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent"
            >
              <Upload className="h-3.5 w-3.5" /> Import / Export
            </button>
          </div>
          <button
             onClick={() => setShowScanner(true)}
             className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all shadow-lg"
          >
            <Scan className="h-4 w-4" /> Scan
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text" placeholder="Search by name, SKU or brand..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all shadow-sm"
        />
      </div>

      <DataTable 
        columns={columns} 
        data={data?.results || []} 
        loading={isLoading} 
        emptyMessage="We couldn't find any products matching your search." 
        pagination={data ? {
          count: data.count,
          next: data.next,
          previous: data.previous,
          onPageChange
        } : undefined}
      />

      <AddProductModal 
        open={showAddModal} 
        onClose={() => { setShowAddModal(false); setPrefill(null); }} 
        prefill={prefill}
      />
      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
      <ImportExportModal 
        open={showImportExport} 
        onClose={() => setShowImportExport(false)} 
        onImport={handleImport} 
        onExport={handleExport} 
        isImporting={importProducts.isPending} 
        isExporting={exportProducts.isPending} 
      />
    </div>
  );
}
