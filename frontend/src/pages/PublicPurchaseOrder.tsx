import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, Truck, Printer, Download, Clock, ArrowRight } from "lucide-react";
import { ordersApi } from "../api/endpoints";

export default function PublicPurchaseOrder() {
  const { token } = useParams<{ token: string }>();
  const [po, setPo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    fetchPO();
  }, [token]);

  const fetchPO = async () => {
    try {
      if (!token) return;
      const res = await ordersApi.purchaseOrders.getPublic(token);
      setPo(res.data);
    } catch (error) {
       console.error("Failed to fetch public PO", error);
    } finally {
       setLoading(false);
    }
  };

  const handleConfirm = async () => {
     try {
       await ordersApi.purchaseOrders.confirmPublic(token!);
       setConfirmed(true);
     } catch(e) { console.error(e); }
  };

  if (loading) return (
     <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">Authenticating PO Token...</div>
     </div>
  );

  if (!po) return (
     <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-red-500 font-bold">Error: Invalid or Expired PO Link</div>
     </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform hover:scale-[1.005] transition-transform">
          
          {/* Status Header */}
          <div className="bg-slate-900 px-8 py-10 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Truck className="w-48 h-48" />
             </div>
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                   <h2 className="text-3xl font-black tracking-tight mb-2">Purchase Order #{po.po_number}</h2>
                   <p className="text-slate-400 font-medium tracking-wide flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" /> EXPECTED DELIVERY {po.expected_delivery ? new Date(po.expected_delivery).toLocaleDateString() : 'TBD'}
                   </p>
                </div>
                <div className="flex gap-3">
                   <button onClick={() => window.print()} className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-2">
                       <Printer className="w-4 h-4" /> PRINT PDF
                   </button>
                   <button className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/40">
                       <Download className="w-4 h-4" /> DOWNLOAD CSV
                   </button>
                </div>
             </div>
          </div>

          <div className="p-8 md:p-12">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                <div>
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Supplier Information</h4>
                   <p className="text-lg font-black text-slate-900">{po.supplier_name}</p>
                   <p className="text-slate-500 text-sm mt-1 leading-relaxed">{po.supplier_details?.address || "Global HQ · Registered Address"}</p>
                </div>
                <div className="md:text-right">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Deliver To</h4>
                   <p className="text-lg font-black text-slate-900 underline decoration-blue-500 decoration-2">StockSync Central Hub</p>
                   <p className="text-slate-500 text-sm mt-1">Warehouse Block B · Zone 4</p>
                </div>
             </div>

             {/* Line Items */}
             <div className="border border-slate-100 rounded-2xl overflow-hidden mb-12">
                <table className="min-w-full divide-y divide-slate-100">
                   <thead className="bg-slate-50">
                      <tr>
                         <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase">Item #</th>
                         <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase">Product Description</th>
                         <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-500 uppercase">Qty</th>
                         <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase">Rate</th>
                         <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 uppercase">Total</th>
                      </tr>
                   </thead>
                    <tbody className="divide-y divide-slate-100">
                       {po.lines?.map((item: any) => (
                          <tr key={item.id}>
                             <td className="px-6 py-4 text-sm font-mono font-bold text-slate-400">{String(item.id).substring(0,8)}</td>
                             <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.product_name || `Product ID: ${item.product}`}</td>
                             <td className="px-6 py-4 text-sm text-center font-black text-slate-900 bg-slate-50/50">{item.quantity_ordered}</td>
                             <td className="px-6 py-4 text-sm text-right font-medium text-slate-600">${parseFloat(item.unit_cost).toFixed(2)}</td>
                             <td className="px-6 py-4 text-sm text-right font-black text-slate-900">${(item.quantity_ordered * item.unit_cost).toFixed(2)}</td>
                          </tr>
                       ))}
                       {(!po.lines || po.lines.length === 0) && (
                          <tr>
                             <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">No line items in this order.</td>
                          </tr>
                       )}
                    </tbody>
                </table>
             </div>

             {/* Footer summary */}
             <div className="flex flex-col md:flex-row justify-between items-end gap-12">
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl md:max-w-md">
                   <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4" /> Statutory Compliance Managed
                   </p>
                   <p className="text-xs text-emerald-600 leading-relaxed font-medium">This PO includes automated tax calculation based on Inter-state (IGST) commerce rules as defined in the StockSync Analytics Engine.</p>
                </div>
                 <div className="text-right w-full md:w-auto">
                    <div className="space-y-2 mb-8">
                       <div className="flex justify-between md:justify-end gap-12 border-t border-slate-100 pt-4">
                          <span className="text-slate-900 font-black uppercase text-xs">Total Units</span>
                          <span className="text-slate-900 font-bold text-lg">{po.lines?.reduce((a:number, c:any)=>a+c.quantity_ordered, 0) || 0}</span>
                       </div>
                    </div>

                   {confirmed ? (
                      <div className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-200 flex items-center gap-3 animate-bounce">
                         <CheckCircle className="w-6 h-6" /> ORDER ACKNOWLEDGED
                      </div>
                   ) : (
                      <button 
                         onClick={handleConfirm}
                         className="w-full bg-slate-900 text-white px-10 py-5 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest text-sm flex items-center justify-center gap-3 group"
                      >
                         Acknowledge & Confirm Receipt <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                   )}
                </div>
             </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
           <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Generated by StockSync Cloud Infrastructure · Secure Procurement Tunnel</p>
        </div>
      </div>
    </div>
  );
}
