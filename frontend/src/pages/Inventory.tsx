import { useState, useCallback } from "react";
import { ArrowRightLeft, TrendingDown, Warehouse, MapPin, Package, AlertCircle, Scan } from "lucide-react";
import BarcodeScanner from "../components/BarcodeScanner";
import DataTable from "../components/common/DataTable";
import { useStockLevels, useLowStock, useLocations } from "../hooks/useApi";
import type { StockLevel } from "../types";
import StockAdjustModal from "./StockAdjustModal";
import StockTransferModal from "./StockTransferModal";

export default function Inventory() {
  const [tab, setTab] = useState<"all" | "low">("all");
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [params, setParams] = useState<Record<string, string>>({});

  const { data: allStock, isLoading: loadingAll } = useStockLevels(params);
  const { data: lowStock, isLoading: loadingLow } = useLowStock();
  const { data: locations } = useLocations();

  const stock = tab === "low" ? lowStock : allStock;
  const isLoading = tab === "low" ? loadingLow : loadingAll;

  const onPageChange = useCallback((url: string) => {
    const urlObj = new URL(url);
    const page = urlObj.searchParams.get("page") || "1";
    setParams(p => ({ ...p, page }));
  }, []);

  const columns = [
    { 
      key: "sku", header: "Variant SKU", 
      render: (s: StockLevel) => (
        <span className="font-mono text-xs font-black bg-gray-50 border border-gray-100 px-2 py-1 rounded text-gray-700 tracking-tighter uppercase">{s.variant.sku}</span>
      )
    },
    { 
      key: "product_name", header: "Product", 
      render: (s: StockLevel) => (
        <div className="flex flex-col">
          <span className="font-black text-gray-900 leading-tight tracking-tight">{s.product_name}</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{s.variant.name !== "Default" ? s.variant.name : "Base Unit"}</span>
        </div>
      )
    },
    { 
      key: "location_name", header: "Warehouse", 
      render: (s: StockLevel) => (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 w-fit group-hover:bg-white transition-colors">
          <MapPin className="h-3 w-3 text-blue-400" />
          <span className="text-[11px] font-bold text-gray-600 uppercase tracking-widest leading-none">{s.location_name}</span>
        </div>
      )
    },
    {
      key: "quantity", header: "Physical",
      render: (s: StockLevel) => (
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className={`font-black text-sm font-mono tracking-tighter ${s.quantity <= 10 ? "text-red-600" : "text-gray-900"}`}>
              {s.quantity}
            </span>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter -mt-1">{s.quantity <= 10 ? 'Stock-out range' : 'Units'}</span>
          </div>
          {s.quantity <= 10 && <TrendingDown className="h-4 w-4 text-red-400 animate-pulse ml-1" />}
        </div>
      ),
    },
    { 
      key: "reserved_quantity", header: "Reserved",
      render: (s: StockLevel) => (
        <span className="text-sm font-bold text-gray-400 font-mono tracking-tighter">-{s.reserved_quantity}</span>
      )
    },
    {
      key: "available", header: "Net Available",
      render: (s: StockLevel) => (
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50/80 border border-dashed border-gray-200 min-w-16 group-hover:bg-blue-600 group-hover:border-blue-700 transition-all shadow-inner">
          <span className="text-[10px] font-black text-gray-400 group-hover:text-blue-200 uppercase tracking-widest leading-none mb-0.5">Saleable</span>
          <span className="text-base font-black text-gray-900 group-hover:text-white font-mono leading-none">{s.available}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            Inventory <Package className="h-6 w-6 text-blue-600" strokeWidth={3} />
          </h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">
            Live stock synchronization across <span className="text-blue-600 font-bold underline decoration-blue-100">{locations?.results?.length || 0} distribution hubs</span>
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-white hover:shadow-lg hover:border-gray-100 transition-all select-none active:scale-95 bg-gray-50/50"
          >
            <ArrowRightLeft className="h-4 w-4" strokeWidth={3} /> Inter-hub Transfer
          </button>
          <button
            onClick={() => setShowAdjustModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 hover:-translate-y-0.5 transition-all select-none active:translate-y-0 active:shadow-none"
          >
            <Warehouse className="h-4 w-4" /> Audit Stock
          </button>
          <button
            onClick={() => setShowScanner(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all select-none active:scale-95 shadow-lg shadow-slate-200"
          >
            <Scan className="h-4 w-4" /> Scan
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-gray-100/50 p-1 rounded-2xl border border-gray-200/50 backdrop-blur-sm shadow-sm group">
        <div className="flex gap-1 p-1 bg-white/40 rounded-xl flex-shrink-0">
          <button onClick={() => setTab("all")}
            className={`px-6 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 ${tab === "all" ? "bg-white text-blue-600 shadow-md border border-gray-100" : "text-gray-400 hover:text-gray-600 hover:bg-white/20"}`}>
            Full Stock View
          </button>
          <button onClick={() => setTab("low")}
            className={`px-6 py-2 rounded-lg text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 ${tab === "low" ? "bg-white text-red-600 shadow-md border border-red-50" : "text-gray-400 hover:text-red-400 hover:bg-white/20"}`}>
            <AlertCircle className="h-3.5 w-3.5" /> Hot Alerts
          </button>
        </div>
        
        {tab === "low" && lowStock && lowStock.count > 0 && (
          <div className="px-4 py-2 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-4 duration-500">
             <TrendingDown className="h-4 w-4 text-red-500" />
             <span className="text-xs font-bold text-red-700 uppercase tracking-widest">
               Critical stock-outs detected: <span className="font-black underline">{lowStock.count} SKUs</span>
             </span>
          </div>
        )}
      </div>

      <DataTable 
        columns={columns} 
        data={stock?.results || []} 
        loading={isLoading} 
        emptyMessage={tab === "low" ? "Excellent! All your stock levels are within safe operating limits." : "No inventory records are available. Try auditing some stock first."}
        pagination={tab === "all" && stock ? {
           count: stock.count,
           next: stock.next,
           previous: stock.previous,
           onPageChange
        } : undefined}
      />

      <StockAdjustModal open={showAdjustModal} onClose={() => setShowAdjustModal(false)} />
      <StockTransferModal open={showTransferModal} onClose={() => setShowTransferModal(false)} />
      {showScanner && (
        <BarcodeScanner 
          onClose={() => setShowScanner(false)} 
          onScan={(code) => {
            setParams(p => ({ ...p, search: code }));
            setShowScanner(false);
          }} 
        />
      )}
    </div>
  );
}
