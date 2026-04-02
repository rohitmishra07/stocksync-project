import { useState } from "react";
import { Plus, Search, Mail, ArrowRight } from "lucide-react";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { ordersApi } from "../api/endpoints";
import CreatePOModal from "../components/CreatePOModal";

export default function PurchaseOrders() {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(!!location.state?.new_po);
  const { data, isLoading } = useQuery({
    queryKey: ["purchase_orders", search],
    queryFn: () => ordersApi.purchaseOrders.list({ search })
  });

  const queryClient = useQueryClient();
  const sendPO = useMutation({
    mutationFn: (id: string) => ordersApi.purchaseOrders.send(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["purchase_orders"] })
  });
  
  const columns = [
    {
      key: "po_number", header: "PO #",
      render: (po: any) => (
        <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">{po.po_number}</span>
      )
    },
    { 
      key: "supplier", header: "Vendor",
      render: (po: any) => (
         <div className="flex flex-col">
           <span className="font-bold text-slate-900">{po.supplier_name}</span>
           <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter italic">Net {po.supplier_details?.lead_days || 7} Days</span>
         </div>
      )
    },
    { 
      key: "order_date", header: "Created At",
      render: (po: any) => <span className="text-xs text-slate-600 font-medium">{new Date(po.created_at || Date.now()).toLocaleDateString()}</span>
    },
    { 
      key: "total", header: "Total Value",
      render: (po: any) => <span className="font-black text-slate-900">${(po.lines?.reduce((a:number,c:any)=>a+(c.quantity_ordered*parseFloat(c.unit_cost)),0)||0).toFixed(2)}</span>
    },
    { key: "status", header: "Status", render: (po: any) => <StatusBadge status={po.status} /> },
    {
      key: "actions", header: "",
      className: "w-10 text-right",
      render: (po: any) => (
        <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
             onClick={() => sendPO.mutate(po.id)}
             disabled={sendPO.isPending || po.status !== 'draft'}
             className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-all font-bold text-[10px] uppercase flex items-center gap-1 disabled:opacity-50">
             <Mail className="h-3.5 w-3.5" /> {po.status === 'sent' ? 'Sent' : 'Notify'} <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Purchase Orders</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Track procurement cycles and inventory replenishment</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
          <Plus className="h-4 w-4" /> New PO Request
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text" placeholder="Search PO numbers or suppliers..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all shadow-sm"
        />
      </div>

      <DataTable 
        columns={columns} 
        data={data?.data?.results || []} 
        loading={isLoading} 
        emptyMessage="No procurement history found. Start stocking up!" 
      />

      {modalOpen && (
        <CreatePOModal 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
          initialProduct={location.state?.product_id}
          initialQuantity={location.state?.qty}
        />
      )}
    </div>
  );
}
