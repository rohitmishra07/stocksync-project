import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 font-sans">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-12 hover:gap-3 transition-all">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        
        <article className="bg-white p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Terms of Service</h1>
          <p className="text-sm text-slate-400 font-bold mb-12 tracking-widest uppercase italic lg:not-italic">Effective Date: April 1, 2026</p>
          
          <div className="space-y-10 text-slate-600 leading-relaxed font-semibold">
            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">1. Acceptance of Terms</h2>
              <p>By creating an account or using the StockSync platform, you agree to comply with and be bound by these Terms of Service. If you do not agree, you are not authorized to use the service.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">2. Description of Service</h2>
              <p>StockSync provides a multi-channel inventory management Software-as-a-Service (SaaS). We offer tools for stock synchronization, order management, and business intelligence.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-3">
                <li>You are responsible for maintaining the confidentiality of your credentials.</li>
                <li>You are responsible for all data uploaded and sales made via the platform.</li>
                <li>You must not use the platform for any illegal or unauthorized purpose.</li>
                <li>You agree not to bypass any security measures of the platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">4. Subscriptions and Billing</h2>
              <ul className="list-disc pl-6 space-y-3">
                <li>Subscription fees are billed in advance on a monthly basis.</li>
                <li>All payments are non-refundable unless otherwise stated.</li>
                <li>Changes to your plan level (upgrade/downgrade) will be reflected in your next billing cycle.</li>
                <li>Failure to pay may lead to temporary suspension or termination of your account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">5. Intellectual Property</h2>
              <p>The StockSync platform, including all software, branding, and proprietary assets, is the property of StockSync Technologies Inc. and is protected by intellectual property laws. You are granted a limited, non-exclusive license to use the service for its intended business purpose.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">6. Limitation of Liability</h2>
              <p>StockSync is provided "as is." We are not liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services, including data loss or loss of profit.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">7. Termination</h2>
              <p>You may terminate your account at any time. We reserve the right to suspend or terminate accounts that violate our terms or engage in fraudulent activities.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">8. Contact Us</h2>
              <p>If you have any questions or concerns about these Terms of Service, please reach out to our team at <a href="mailto:support@stocksync.io" className="text-indigo-600 hover:underline">support@stocksync.io</a>.</p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
