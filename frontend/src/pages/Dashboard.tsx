import { useEffect, useState } from "react";
import {
  ShoppingCart, DollarSign, AlertTriangle, PackageX,
  TrendingUp, BarChart3, PieChart as PieChartIcon,
  ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import KpiCard from "../components/common/KpiCard";
import StatusBadge from "../components/common/StatusBadge";
import ChannelSyncStatus from "../components/ChannelSyncStatus";
import { useDashboard, useSalesAnalytics, useOrders, useAnomalies } from "../hooks/useApi";
import { analyticsApi } from "../api/endpoints";
import { ForecastResult } from "../types";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Dashboard() {
  const { data: kpi, isLoading } = useDashboard();
  const { data: salesData } = useSalesAnalytics({ days: "30", group_by: "day" });
  const { data: orders } = useOrders({ page_size: "5" });
  const { data: anomalies } = useAnomalies();

  const [forecasts, setForecasts] = useState<ForecastResult[]>([]);
  const [margins, setMargins] = useState<any[]>([]);

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const fetchIntelligence = async () => {
    try {
      const [fRes, mRes] = await Promise.all([
        analyticsApi.forecast(),
        analyticsApi.margins()
      ]);
      setForecasts(fRes.data.results?.slice(0, 5) || []);
      setMargins(mRes.data || []);
    } catch (error) {
       console.error("Failed to fetch intelligence", error);
    }
  };

  if (isLoading) return <div className="text-gray-500 p-8">Loading dashboard metrics...</div>;

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: kpi?.revenue?.currency || "USD" }).format(num);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Intelligence Dashboard</h1>
          <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-widest">Global Ops Command Center · Real-time</p>
        </div>
        <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> SYSTEM STATUS: OPTIMAL
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Orders" value={kpi?.orders?.total || 0}
          icon={<ShoppingCart className="h-5 w-5" />} color="blue"
        />
        <KpiCard
          title="Revenue" value={formatCurrency(kpi?.revenue?.total || "0")}
          change={kpi?.revenue?.change_percent}
          icon={<DollarSign className="h-5 w-5" />} color="green"
        />
        <KpiCard
          title="Avg Daily Velocity" value={((salesData?.data || []).reduce((acc: number, cur: any) => acc + (cur.orders_count || 0), 0) / 30).toFixed(1)}
          icon={<BarChart3 className="h-5 w-5" />} color="indigo"
        />
        <KpiCard
          title="Low Stock Risk" value={kpi?.inventory?.low_stock_items || 0}
          icon={<AlertTriangle className="h-5 w-5" />} color="yellow"
        />
      </div>
      
      <ChannelSyncStatus />

      {anomalies && anomalies.length > 0 && (
        <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-bold text-red-900">SYSTEM ANOMALIES DETECTED ({anomalies.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {anomalies.map((anomaly: any, idx: number) => (
              <div key={idx} className="bg-white border text-left border-red-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{anomaly.type}</span>
                  <span className="text-xs font-bold text-slate-400">#{anomaly.reference}</span>
                </div>
                <p className="text-sm font-medium text-slate-700 leading-snug">{anomaly.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> REVENUE FLOW (30D)
             </h3>
             <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-100">CONFIRMED ORDERS</span>
             </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={salesData?.data || []}>
              <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(d) => new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" })} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <ReTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(v: number) => [formatCurrency(v), "Revenue"]} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Forecasting Widget */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col">
           <div className="flex justify-between items-start mb-6">
              <h3 className="text-sm font-bold flex items-center gap-2 tracking-wide uppercase">
                 <AlertTriangle className="w-4 h-4 text-yellow-400" /> Stock Lifespan Forecast
              </h3>
              <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/60">NEXT 14 DAYS</span>
           </div>
           
           <div className="space-y-5 flex-1 overflow-y-auto pr-1">
              {forecasts.map((f: any) => (
                 <div key={f.product || f.id} className="group cursor-pointer">
                    <div className="flex justify-between text-xs mb-1.5">
                       <span className="font-bold truncate opacity-90 w-40">{f.product_name}</span>
                       <span className={`font-bold ${f.days_of_stock_left !== null && f.days_of_stock_left < 7 ? "text-red-400" : "text-slate-400"}`}>
                          {f.days_of_stock_left !== null ? `${Math.ceil(f.days_of_stock_left)} DAYS LEFT` : "NO SALES DATA"}
                       </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                       <div 
                          className={`h-full rounded-full transition-all duration-1000 ${f.days_of_stock_left < 7 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-yellow-500"}`}
                          style={{ width: `${Math.min(100, (f.days_of_stock_left / 14) * 100)}%` }}
                       />
                    </div>
                    <div className="mt-1 flex justify-between">
                       <span className="text-[10px] text-white/40 font-medium">AVG SALE: {f.daily_avg_sales.toFixed(1)}/day</span>
                       <span className="text-[10px] text-emerald-400 font-bold hidden group-hover:flex items-center gap-1">
                          AUTO-REORDER: {f.reorder_suggestion_qty} <ArrowRight className="w-2.5 h-2.5" />
                       </span>
                    </div>
                 </div>
              ))}
              {forecasts.length === 0 && (
                 <div className="h-40 flex flex-col items-center justify-center text-center opacity-30 gap-2 border border-white/10 border-dashed rounded-xl">
                    <PackageX className="w-8 h-8" />
                    <span className="text-xs font-medium italic">No immediate stock risks found.</span>
                 </div>
              )}
           </div>

           <button className="mt-6 w-full py-2.5 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-xl text-xs font-bold transition-all border border-white/20">
              OPEN SMART REORDER ENGINE
           </button>
        </div>

        {/* Channel Profit Margins Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                 <PieChartIcon className="w-4 h-4 text-indigo-500" /> Channel Profitability
              </h3>
           </div>
           
           <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={margins}
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="profit"
                       nameKey="channel"
                    >
                       {margins.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                    </Pie>
                    <ReTooltip formatter={(v: number) => formatCurrency(v)} />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">Total Profit</span>
                 <span className="text-lg font-black text-slate-900">
                    {formatCurrency(margins.reduce((acc, m) => acc + parseFloat(m.profit || 0), 0))}
                 </span>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3 mt-4">
              {margins.map((m, idx) => (
                 <div key={m.channel} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <div className="min-w-0">
                       <p className="text-[10px] font-bold text-slate-700 uppercase truncate">{m.channel}</p>
                       <p className="text-xs font-black text-slate-900">{formatCurrency(m.profit)}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* Top Activity & Orders (Combined for better UI balance) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
           <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                 <BarChart3 className="w-4 h-4 text-blue-500" /> RECENT FULFILLMENT ACTIVITY
              </h3>
              <button className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest">View All Orders</button>
           </div>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-slate-100">
               <thead className="bg-slate-50/80">
                 <tr>
                   <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order</th>
                   <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                   <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Platform</th>
                   <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                   <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Value</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 italic font-medium">
                 {orders?.results?.slice(0, 6).map((o) => (
                   <tr key={o.id} className="hover:bg-blue-50/40 transition-colors group cursor-pointer font-sans not-italic">
                     <td className="px-6 py-4 text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform">{o.order_number}</td>
                     <td className="px-6 py-4 text-sm text-slate-700 font-semibold">{o.customer_name || "Guest Customer"}</td>
                     <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-black text-slate-600 border border-slate-200 uppercase">{o.channel}</span>
                     </td>
                     <td className="px-6 py-3"><StatusBadge status={o.status} /></td>
                     <td className="px-6 py-4 text-sm text-right font-black text-slate-900">{formatCurrency(o.grand_total)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

      </div>
    </div>
  );
}
