import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from "recharts";
import { useSalesAnalytics, useTopProducts, useMargins, useGstReport } from "../hooks/useApi";
import ForecastWidget from "../components/ForecastWidget";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Analytics() {
  const [days, setDays] = useState("30");
  const { data: salesData } = useSalesAnalytics({ days, group_by: "day" });
  const { data: topProducts } = useTopProducts({ days, limit: "10" });
  const { data: marginsData } = useMargins();
  const { data: gstData } = useGstReport();

  const handleDownloadGST = () => {
    if (!gstData || gstData.length === 0) return;
    const header = ["Order Number", "HSN Code", "Taxable Value", "CGST", "SGST", "IGST", "Tax Rate", "Tax Type", "Total Tax"];
    const rows = gstData.map((row: any) => [
      row.order_number,
      row.hsn_code,
      row.taxable_value,
      row.cgst,
      row.sgst,
      row.igst,
      row.tax_rate,
      row.tax_type,
      row.tax_amount
    ]);
    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `gst-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <select value={days} onChange={(e) => setDays(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData?.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }}
                tickFormatter={(d) => new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" })} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Orders per Day</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData?.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }}
                tickFormatter={(d) => new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" })} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Products by Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts?.products || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
              <Bar dataKey="total_revenue" radius={[0, 4, 4, 0]}>
                {topProducts?.products?.map((_: unknown, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Channel Profit & Margin</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold uppercase tracking-wider">
                <th className="pb-3 pr-4">Channel</th>
                <th className="pb-3 px-4 text-right">Revenue</th>
                <th className="pb-3 px-4 text-right">Cost</th>
                <th className="pb-3 px-4 text-right">Gross Profit</th>
                <th className="pb-3 pl-4 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {marginsData?.map((m: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 pr-4 font-bold text-gray-900 capitalize">{m.channel || "Manual"}</td>
                  <td className="py-3 px-4 text-right text-gray-600 font-mono">${m.total_revenue.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-red-500 font-mono">${m.total_cost.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">${m.profit.toFixed(2)}</td>
                  <td className="py-3 pl-4 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      m.margin_pct >= 40 ? "bg-emerald-50 text-emerald-700" :
                      m.margin_pct >= 20 ? "bg-blue-50 text-blue-700" :
                      "bg-yellow-50 text-yellow-700"
                    }`}>
                      {m.margin_pct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {(!marginsData || marginsData.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 italic">No channel data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-hidden mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">GST Report (India)</h3>
          <button 
            onClick={handleDownloadGST}
            className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            Download CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 font-bold uppercase tracking-wider">
                <th className="pb-3 pr-4">Order #</th>
                <th className="pb-3 px-4">HSN</th>
                <th className="pb-3 px-4 text-right">Taxable Value</th>
                <th className="pb-3 px-4 text-right">CGST</th>
                <th className="pb-3 px-4 text-right">SGST</th>
                <th className="pb-3 px-4 text-right">IGST</th>
                <th className="pb-3 pl-4 text-right">Total Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {gstData?.map((g: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 pr-4 font-bold text-gray-900">{g.order_number}</td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-xs">{g.hsn_code || "N/A"}</td>
                  <td className="py-3 px-4 text-right font-mono">${g.taxable_value.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-gray-600 font-mono">${g.cgst.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-gray-600 font-mono">${g.sgst.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-gray-600 font-mono">${g.igst.toFixed(2)}</td>
                  <td className="py-3 pl-4 text-right font-bold text-blue-600 font-mono">
                    <div className="flex flex-col items-end">
                      <span>${g.tax_amount.toFixed(2)}</span>
                      <span className="text-[9px] text-gray-400 font-semibold uppercase">{g.tax_type} @ {g.tax_rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {(!gstData || gstData.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 italic">No GST data currently available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8">
        <ForecastWidget />
      </div>
    </div>
  );
}
