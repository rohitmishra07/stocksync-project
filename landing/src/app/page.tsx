import Image from "next/image";
import Link from "next/link";
import { 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Zap, 
  BarChart3, 
  Smartphone, 
  Truck, 
  AlertCircle,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  Globe
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header/Nav */}
      <header className="fixed top-0 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl">S</div>
            <span className="font-bold text-xl tracking-tight">StockSync</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="http://localhost:5173/login" className="text-sm font-semibold text-slate-600 hover:text-indigo-600">Login</Link>
            <Link href="http://localhost:5173/register" className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:translate-y-0">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-16">
        {/* SECTION 1: HERO */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold mb-8 animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
              NEW: AI-POWERED DEMAND FORECASTING
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
              One Dashboard for Shopify, Amazon & Your <span className="text-indigo-600 text-shadow-sm">Physical Store</span>
            </h1>
            <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
              Stop losing sales to stockouts. StockSync unifies your inventory across every channel in real-time, giving you total control over your business.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="http://localhost:5173/register" className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 group">
                Start 14-Day Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="w-full sm:w-auto bg-white text-slate-900 px-8 py-4 rounded-xl text-lg font-bold border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                Watch Demo
              </button>
            </div>
            
            {/* Hero Image / Mockup */}
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute inset-0 bg-indigo-600/10 blur-[120px] rounded-full scale-90"></div>
              <div className="relative bg-slate-900 rounded-2xl p-2 border border-slate-800 shadow-2xl skew-y-0 hover:skew-y-0 transition-transform duration-700 ease-out">
                <div className="bg-white rounded-xl overflow-hidden aspect-[16/10] flex items-center justify-center text-slate-300 font-bold bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100">
                  <div className="flex flex-col items-center gap-4">
                    <Image src="/next.svg" alt="App Preview" width={200} height={40} className="opacity-20 grayscale" />
                    <span className="text-slate-400 text-sm italic">[ StockSync Dashboard Interactive Preview ]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: SOCIAL PROOF */}
        <section className="py-12 border-y border-slate-50 bg-slate-50/30">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by 5,000+ modern retailers</p>
            <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-40 grayscale">
              <div className="font-black text-2xl text-slate-900 tracking-tighter">NIKE</div>
              <div className="font-black text-2xl text-slate-900 tracking-tighter">ZARA</div>
              <div className="font-black text-2xl text-slate-900 tracking-tighter">IKEA</div>
              <div className="font-black text-2xl text-slate-900 tracking-tighter">APPLE</div>
              <div className="font-black text-2xl text-slate-900 tracking-tighter">TESLA</div>
            </div>
          </div>
        </section>

        {/* SECTION 3: PROBLEMS */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl border-l-4 border-indigo-600 pl-8 mb-16">
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">The mess stops here.</h2>
              <p className="text-lg text-slate-500 font-medium">Retail is hard. Spreadsheet inventory is a nightmare. StockSync solves the three biggest pain points for growing stores.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Overselling Nightmares",
                  desc: "Ever sold your last item on Amazon only to have someone buy it on Shopify a minute later? We prevent overselling by syncing in milliseconds.",
                  icon: <AlertCircle className="w-8 h-8 text-rose-500" />
                },
                {
                  title: "Spreadsheet Blindness",
                  desc: "Using manual Excel sheets that are out of date as soon as you type. Get accurate, real-time data that lives and breathes with your sales.",
                  icon: <Layers className="w-8 h-8 text-amber-500" />
                },
                {
                  title: "Profit Uncertainty",
                  desc: "Running sales but not knowing your actual margins after COGS and multi-channel fees. We calculate your true profitability automatically.",
                  icon: <BarChart3 className="w-8 h-8 text-indigo-500" />
                }
              ].map((item, idx) => (
                <div key={idx} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-100/50 transition-all">
                  <div className="mb-6">{item.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: FEATURES */}
        <section id="features" className="py-24 bg-slate-900 text-white rounded-[3rem_3rem_0_0]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-5xl font-black mb-6 tracking-tight">Feature-packed for <span className="text-indigo-400">Scale</span></h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">Everything you need to run a high-volume omnichannel business without breaking a sweat.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: "Multi-channel Sync", desc: "Native integrations for Shopify & Amazon. Keep your physical store and digital screens in perfect harmony.", icon: <Globe className="w-6 h-6" /> },
                { title: "Demand Forecasting", desc: "Know exactly when you'll run out of stock and what to reorder based on historical sales velocity.", icon: <Zap className="w-6 h-6 text-yellow-400" /> },
                { title: "Mobile Scanner PWA", desc: "Turn any smartphone into a professional barcode scanner for lightning-fast stock intake and shipments.", icon: <Smartphone className="w-6 h-6" /> },
                { title: "Smart Purchase Orders", desc: "Automate restocks with professional POs sent directly to your suppliers with one click.", icon: <Truck className="w-6 h-6" /> },
                { title: "GST-Ready Reports", desc: "India-compliant tax reporting with HSN-lookup and automated SGST/CGST/IGST splitting.", icon: <Layers className="w-6 h-6 text-green-400" /> },
                { title: "Omnichannel Alerts", desc: "Get critical low-stock alerts sent directly to your WhatsApp or Email so you never miss a beat.", icon: <MessageSquare className="w-6 h-6" /> }
              ].map((feat, idx) => (
                <div key={idx} className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                  <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 tracking-tight">{feat.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-sm font-medium">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: HOW IT WORKS */}
        <section id="how-it-works" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-4xl font-black text-slate-900 mb-4">Go Live in Minutes.</h2>
              <p className="text-slate-500 font-medium">A setup process designed for busy retailers.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
              <div className="hidden md:block absolute top-16 left-0 w-full h-0.5 bg-slate-100 -z-10"></div>
              {[
                { step: "01", title: "Connect Stores", desc: "Connect your Shopify or Amazon store in two clicks via secure OAuth." },
                { step: "02", title: "Import Data", desc: "Automatically sync products, variants, and historical orders in seconds." },
                { step: "03", title: "Scale Up", desc: "Get real-time insights, AI alerts, and start fulfilling orders with confidence." }
              ].map((item, idx) => (
                <div key={idx} className="text-center group">
                  <div className="w-16 h-16 bg-white border-2 border-indigo-600 rounded-full flex items-center justify-center text-xl font-black text-indigo-600 mx-auto mb-8 shadow-xl shadow-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{item.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: PRICING */}
        <section id="pricing" className="py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Simple, Transparent Pricing</h2>
              <p className="text-slate-500 font-medium">Choose the plan that grows with your business.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { 
                  name: "Starter", price: "4,000", desc: "Perfect for new single-channel sellers.",
                  features: ["500 SKUs", "1 Sales Channel", "2 User Accounts", "Basic Inventory", "Email Support"]
                },
                { 
                  name: "Growth", price: "8,000", desc: "Best for growing omnichannel brands.", popular: true,
                  features: ["2,000 SKUs", "3 Sales Channels", "5 User Accounts", "Demand Forecasting", "Priority Support", "Email Alerts"]
                },
                { 
                  name: "Pro", price: "12,000", desc: "Unlimited power for serious retailers.",
                  features: ["Unlimited SKUs", "Unlimited Channels", "Unlimited Users", "AI Anomaly Detection", "WhatsApp Alerts", "API Access", "Dedicated Manager"]
                }
              ].map((plan, idx) => (
                <div key={idx} className={`p-10 rounded-3xl bg-white border ${plan.popular ? 'border-indigo-600 ring-4 ring-indigo-600/5' : 'border-slate-200'} relative flex flex-col`}>
                  {plan.popular && <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-tighter px-4 py-1.5 rounded-full">MOST POPULAR</span>}
                  <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mb-6 font-medium">{plan.desc}</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-slate-400 font-bold text-xl">₹</span>
                    <span className="text-5xl font-black text-slate-900">{plan.price}</span>
                    <span className="text-slate-400 font-bold">/mo</span>
                  </div>
                  <ul className="space-y-4 mb-10 flex-grow">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600 italic lg:not-italic">
                        <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="http://localhost:5173/register" className={`w-full py-4 rounded-xl text-center font-black transition-all ${plan.popular ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                    Start Free Trial
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 7: FAQ */}
        <section id="faq" className="py-24 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex items-center gap-3 mb-12">
              <HelpCircle className="w-6 h-6 text-indigo-600" />
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-6">
              {[
                { q: "Does it work with Indian Shopify stores?", a: "Yes! We support Indian Shopify stores and handle the complex GST reporting requirements (SGST, CGST, IGST) automatically." },
                { q: "Can I use it without Shopify or Amazon?", a: "Absolutely. Many of our customers use StockSync purely for their physical store and warehouse management without any digital channels." },
                { q: "Is my data secure?", a: "Data security is our top priority. All data is encrypted in transit using SSL and at rest in our secure database. We undergo regular security audits." },
                { q: "Do you support Flipkart or Meesho?", a: "These integrations are currently in our product roadmap and will be released later this year. Stay tuned!" }
              ].map((faq, idx) => (
                <div key={idx} className="group border-b border-slate-100 pb-6 cursor-pointer">
                  <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-center justify-between group-hover:text-indigo-600 transition-colors italic not-italic">
                    {faq.q} <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -rotate-45" />
                  </h4>
                  <p className="text-slate-500 font-medium leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL SECTION */}
        <section className="py-24 bg-indigo-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl lg:text-5xl font-black mb-8 tracking-tight">Ready to stop guessing?</h2>
            <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto font-medium">Join 5,000+ stores that rely on StockSync for their daily operations.</p>
            <Link href="http://localhost:5173/register" className="inline-flex bg-white text-indigo-600 px-10 py-5 rounded-2xl text-xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all">
              Start Your 14-Day Free Trial
            </Link>
          </div>
        </section>
      </main>

      {/* SECTION 8: FOOTER */}
      <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl">S</div>
                <span className="font-bold text-xl tracking-tight">StockSync</span>
              </div>
              <p className="text-slate-500 max-w-xs font-medium leading-relaxed mb-6">
                The advanced inventory platform for thousands of small to medium retailers worldwide.
              </p>
              <div className="flex items-center gap-4 text-slate-400">
                <ShieldCheck className="w-6 h-6 hover:text-indigo-600 cursor-pointer" />
                <Globe className="w-6 h-6 hover:text-indigo-600 cursor-pointer" />
              </div>
            </div>
            <div>
              <h5 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6 font-sans">Legal</h5>
              <ul className="space-y-4 text-sm font-bold text-slate-600">
                <li><Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-6 font-sans">Support</h5>
              <ul className="space-y-4 text-sm font-bold text-slate-600">
                <li><a href="mailto:support@stocksync.io" className="hover:text-indigo-600 transition-colors">support@stocksync.io</a></li>
                <li className="text-slate-400 font-medium">Hargao, Gurugram, India</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs font-medium italic">© 2026 StockSync Technologies Inc. All rights reserved.</p>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              Made in Bharat <span className="text-orange-500 font-bold">🇮🇳</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
