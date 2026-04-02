import { useState, useCallback } from "react";
import { Plus, Search, Trash2, ShoppingBag } from "lucide-react";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";
import { useOrders, useDeleteOrder } from "../hooks/useApi";
import type { Order } from "../types";
import AddOrderModal from "./AddOrderModal";

const STATUS_TABS = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [params, setParams] = useState<Record<string, string>>({});

  const orderParams: Record<string, string> = { ...params };
  if (statusFilter !== "all") orderParams.status = statusFilter;
  if (search) orderParams.search = search;

  const { data, isLoading } = useOrders(orderParams);
  const deleteOrder = useDeleteOrder();

  const handleDelete = async (id: string, number: string) => {
    if (!window.confirm(`Are you sure you want to delete order ${number}? This action will permanently remove it from records.`)) return;
    try {
      await deleteOrder.mutateAsync(id);
    } catch {
      alert("Failed to delete order.");
    }
  };

  const onPageChange = useCallback((url: string) => {
    const urlObj = new URL(url);
    const page = urlObj.searchParams.get("page") || "1";
    setParams(p => ({ ...p, page }));
  }, []);

  const columns = [
    { 
      key: "order_number", header: "Order ID", 
      render: (o: Order) => (
        <div className="flex flex-col">
          <span className="font-black text-gray-900 tracking-tighter text-sm uppercase">{o.order_number}</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50 px-1 py-0.5 rounded inline-block w-fit mt-1">
             ID: {o.id.toString().slice(-6)}
          </span>
        </div>
      )
    },
    { 
      key: "customer_name", header: "Customer", 
      className: "w-[180px]",
      render: (o: Order) => (
        <div className="min-w-0">
          <p className="font-bold text-gray-800 truncate tracking-tight">{o.customer_name || "Guest Checkout"}</p>
          <p className="text-[11px] text-gray-400 font-medium truncate italic">{o.customer_email || "no-email@order"}</p>
        </div>
      )
    },
    { 
      key: "channel", header: "Channel", 
      render: (o: Order) => (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 w-fit group-hover:bg-white transition-colors">
          <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
          <span className="capitalize text-[11px] font-bold text-gray-600 uppercase tracking-wide">{o.channel}</span>
        </div>
      )
    },
    { 
      key: "item_count", header: "Units",
      render: (o: Order) => <span className="text-sm font-bold text-gray-700 bg-blue-50/50 px-2 py-1 rounded-md border border-blue-100/50">{o.item_count}</span>
    },
    { key: "status", header: "Status", render: (o: Order) => <StatusBadge status={o.status} /> },
    { 
      key: "grand_total", header: "Total", 
      className: "text-right", 
      render: (o: Order) => <span className="font-black text-gray-900 text-base font-mono">${parseFloat(o.grand_total).toFixed(2)}</span> 
    },
    {
      key: "placed_at", header: "Placed Date",
      className: "text-right w-40",
      render: (o: Order) => (
        <div className="flex flex-col items-end">
          <span className="text-[13px] font-bold text-gray-700 font-mono">
            {new Date(o.placed_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
          </span>
          <span className="text-[10px] text-gray-400 font-medium font-mono uppercase tracking-tighter border-t border-gray-100 pt-0.5 mt-0.5">
             {new Date(o.placed_at).toLocaleTimeString("en", { hour: "numeric", minute: "numeric" })}
          </span>
        </div>
      ),
    },
    {
      key: "actions", header: "",
      className: "w-10 text-right",
      render: (o: Order) => (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(o.id.toString(), o.order_number); }}
            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all border border-transparent active:scale-95"
            title="Delete Order"
          >
           <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Orders</h1>
          <p className="text-gray-500 text-sm font-medium mt-0.5">Track and fulfill customer sales across all channels</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 hover:-translate-y-0.5 transition-all active:translate-y-0 active:shadow-none uppercase tracking-widest"
        >
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white/50 p-2 rounded-2xl border border-gray-100 backdrop-blur-md">
        <div className="flex gap-1 overflow-x-auto p-1 bg-gray-100/50 rounded-xl flex-shrink-0 hide-scrollbar">
          {STATUS_TABS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition-all border border-transparent tracking-widest uppercase ${
                statusFilter === s ? "bg-white text-blue-600 shadow-sm border-gray-100" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/30"
              }`}>
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input type="text" placeholder="Filter by ID or customer..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 text-sm font-medium focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all shadow-sm group-hover:shadow-md" />
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={data?.results || []} 
        loading={isLoading} 
        emptyMessage={`No ${statusFilter === 'all' ? '' : statusFilter} orders found.`}
        pagination={data ? {
          count: data.count,
          next: data.next,
          previous: data.previous,
          onPageChange
        } : undefined}
      />

      <AddOrderModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
