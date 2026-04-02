import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Rocket, 
  PackagePlus, 
  ChevronRight, 
  CheckCircle2, 
  FileUp,
  Mail,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { AuthContext } from "../../store/auth";
import { productsApi, alertsApi } from "../../api/endpoints";
import toast from "react-hot-toast";

export default function OnboardingWizard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [shopDomain, setShopDomain] = useState("");
  const [importResults, setImportResults] = useState<{created: number, errors: any[]} | null>(null);
  const [email, setEmail] = useState(user?.email || "");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const totalSteps = 4;

  useEffect(() => {
    if (searchParams.get("connected") === "shopify") {
      setStep(3);
      toast.success("Shopify connected successfully!");
    }
  }, [searchParams]);

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleFinish = async () => {
    try {
      await alertsApi.updateSettings({
        email_alerts_enabled: true,
        whatsapp_alerts_enabled: whatsappEnabled,
        whatsapp_number: whatsappNumber,
        low_stock_threshold_override: null
      });
      localStorage.setItem("onboarding_complete", "true");
      toast.success("Setup complete! Welcome to StockSync.");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error("Failed to save alert settings.");
    }
  };

  const handleConnectShopify = () => {
    if (!shopDomain) return toast.error("Please enter your shop domain");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
    const shop = shopDomain.replace("https://", "").replace("http://", "").split("/")[0];
    window.location.href = `${baseUrl}/channels/shopify/install/?shop=${shop}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await productsApi.importCsv(file);
      setImportResults(res.data);
      toast.success(`Successfully imported ${res.data.created} products!`);
    } catch (error) {
      toast.error("Failed to import products.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-[2rem] shadow-2xl shadow-indigo-100 border border-slate-100 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-100 flex">
          {[...Array(totalSteps)].map((_, i) => (
            <div 
              key={i} 
              className={`h-full transition-all duration-500 ${i + 1 <= step ? 'bg-indigo-600' : 'bg-transparent'}`}
              style={{ width: `${100 / totalSteps}%` }}
            />
          ))}
        </div>

        <div className="p-12">
          {step === 1 && (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-indigo-200">
                <Rocket className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
                Welcome to StockSync, {user?.first_name}!
              </h1>
              <p className="text-lg text-slate-500 font-medium mb-12 leading-relaxed">
                We're excited to help you scale your retail business. Let's get your store set up in 4 quick steps.
              </p>
              <button 
                onClick={handleNext}
                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 mx-auto group"
              >
                Let's Go <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Step 2: Connect a Channel</h2>
              <p className="text-slate-500 font-medium mb-8">Link your existing stores to sync inventory automatically.</p>
              
              <div className="grid grid-cols-1 gap-4 mb-8">
                <div className="p-6 rounded-2xl border-2 border-indigo-600 bg-indigo-50/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl font-bold border border-indigo-100">🛍️</div>
                    <div>
                      <h3 className="font-bold text-slate-900">Connect Shopify</h3>
                      <p className="text-xs text-slate-500 font-medium">Auto-sync products and orders</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="myshopify-store.myshopify.com"
                      className="flex-grow rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
                      value={shopDomain}
                      onChange={(e) => setShopDomain(e.target.value)}
                    />
                    <button 
                      onClick={handleConnectShopify}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors"
                    >
                      Connect
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleNext}
                  className="p-6 rounded-2xl border-2 border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 border border-slate-100 group-hover:border-indigo-100 transition-colors">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Skip for now</h3>
                        <p className="text-xs text-slate-500 font-medium">I'll add products manually</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setStep(1)} className="text-sm font-bold text-slate-400 hover:text-slate-600">Back</button>
                <div className="text-xs font-black text-slate-300 uppercase tracking-widest">Step 2 of 4</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Step 3: Add Your Products</h2>
              <p className="text-slate-500 font-medium mb-8">Let's populate your inventory to start tracking sales.</p>

              <div className="grid grid-cols-1 gap-4 mb-8">
                <label className="p-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-center cursor-pointer group">
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                  <FileUp className="w-10 h-10 text-slate-300 mb-4 mx-auto group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                  <h3 className="font-bold text-slate-900 mb-1">Import from CSV</h3>
                  <p className="text-xs text-slate-500 font-medium mb-4">Choose a file to bulk upload products</p>
                  {importResults && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase">
                      <CheckCircle2 className="w-3 h-3" /> {importResults.created} PRODUCTS ADDED
                    </div>
                  )}
                </label>

                <button 
                  onClick={handleNext}
                  className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                      <PackagePlus className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-slate-900 text-sm">Add products manually</h3>
                      <p className="text-[10px] text-slate-400 font-medium">I'll do it later from the dashboard</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setStep(2)} className="text-sm font-bold text-slate-400 hover:text-slate-600">Back</button>
                <div className="text-xs font-black text-slate-300 uppercase tracking-widest">Step 3 of 4</div>
                <button onClick={handleNext} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">Next</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Step 4: Smart Notifications</h2>
              <p className="text-slate-500 font-medium mb-8">Never lose a sale to a stockout. Where should we alert you?</p>

              <div className="space-y-6 mb-12">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Email Address
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 bg-slate-50"
                    placeholder="you@company.com"
                  />
                </div>

                <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-green-500" />
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">WhatsApp Alerts</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Instant low-stock notifications</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${whatsappEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${whatsappEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  
                  {whatsappEnabled && (
                    <input 
                      type="tel" 
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 animate-in zoom-in-95 duration-200"
                      placeholder="+91 99999 99999"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-50 -mx-12 px-12 py-8 border-t border-slate-100">
                <button onClick={() => setStep(3)} className="text-sm font-bold text-slate-400 hover:text-slate-600">Back</button>
                <button 
                  onClick={handleFinish}
                  className="bg-indigo-600 text-white px-10 py-4 rounded-xl text-lg font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2 group"
                >
                  Finish Setup <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
