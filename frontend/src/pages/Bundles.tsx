import { useState } from "react";
import { Plus, Search, MoreVertical, Layers, Trash2 } from "lucide-react";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/endpoints";
import CreateBundleModal from "../components/CreateBundleModal";

export default function Bundles() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["bundles", search],
    queryFn: () => productsApi.bundles.list()
  });

  const columns = [
    {
      key: "sku", header: "Bundle SKU",
      render: (b: any) => (
        <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold tracking-tight">{b.sku}</span>
      )
    },
    { 
      key: "name", header: "Bundle Name",
      render: (b: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-500">
             <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 truncate tracking-tight">{b.name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase">{b.components?.length || 0} Components</p>
          </div>
        </div>
      )
    },
    { 
      key: "price", header: "Price",
      render: (b: any) => <span className="font-black text-slate-900">${parseFloat(b.price).toFixed(2)}</span>
    },
    { 
      key: "stock", header: "Max Bundles",
      render: (b: any) => <span className="font-bold font-mono text-emerald-600">{b.available_stock} Units</span>
    },
    { key: "is_active", header: "Status", render: (b: any) => <StatusBadge status={b.is_active ? "active" : "inactive"} /> },
    {
      key: "actions", header: "",
      className: "w-10 text-right",
      render: (_b: any) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-all" title="Delete Bundle">
            <Trash2 className="h-4 w-4" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-all">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kitting & Bundles</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Combine multi-SKU products into gift boxes and multipacks</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
          <Plus className="h-4 w-4" /> Create Bundle
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text" placeholder="Search bundles by name or SKU..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all shadow-sm"
        />
      </div>

      <DataTable 
        columns={columns} 
        data={data?.data?.results || []} 
        loading={isLoading} 
        emptyMessage="No product bundles found. Start creating kits for better margins!" 
      />

      <CreateBundleModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
