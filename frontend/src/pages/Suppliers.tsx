import { useState } from "react";
import { Plus, Search, MapPin, Mail, Phone, ExternalLink } from "lucide-react";
import DataTable from "../components/common/DataTable";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "../api/endpoints";

export default function Suppliers() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["suppliers", search],
    queryFn: () => ordersApi.suppliers.list({ search })
  });

  const columns = [
    {
      key: "name", header: "Supplier",
      render: (s: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{s.name}</span>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">ID: {s.id.substring(0,8)}</span>
        </div>
      )
    },
    { 
      key: "contact", header: "Contact Details",
      render: (s: any) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
             <Mail className="w-3 h-3" /> {s.email}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
             <Phone className="w-3 h-3" /> {s.phone || "N/A"}
          </div>
        </div>
      )
    },
    { key: "lead_days", header: "Lead Time", render: (s: any) => <span className="font-bold text-slate-700">{s.lead_days} Days</span> },
    { 
      key: "address", header: "Location",
      render: (s: any) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
           <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate max-w-[150px]">{s.address}</span>
        </div>
      )
    },
    {
      key: "actions", header: "",
      className: "w-10 text-right",
      render: () => (
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600">
           <ExternalLink className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Suppliers</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Manage your procurement network and vendor relationships</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
          <Plus className="h-4 w-4" /> Add Supplier
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input
          type="text" placeholder="Search suppliers by name or email..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all shadow-sm"
        />
      </div>

      <DataTable 
        columns={columns} 
        data={data?.data?.results || []} 
        loading={isLoading} 
        emptyMessage="No suppliers found. Let's add your first vendor!" 
      />
    </div>
  );
}
