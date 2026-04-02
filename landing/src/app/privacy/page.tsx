import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-20 font-sans">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-12 hover:gap-3 transition-all">
          <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
        
        <article className="bg-white p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-slate-400 font-bold mb-12 tracking-widest uppercase italic lg:not-italic">Last Updated: April 1, 2026</p>
          
          <div className="space-y-10 text-slate-600 leading-relaxed font-semibold">
            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">1. Introduction</h2>
              <p>Welcome to StockSync ("we," "our," or "us"). We respect your privacy and are committed to protecting it. This Privacy Policy describes the types of information we may collect from you or that you may provide when you visit the StockSync website and our inventory management platform.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">2. Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-3">
                <li>Personal identifiers (name, email address, phone number).</li>
                <li>Business data (store name, inventory data, order history, supplier details).</li>
                <li>Financial information (payment details processed securely via Stripe).</li>
                <li>Technical data (IP address, browser type, device information).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">3. How We Use Your Information</h2>
              <p>We use the information we collect to provide, maintain, and improve our services, including:</p>
              <ul className="list-disc pl-6 mt-4 space-y-3">
                <li>Managing your account and providing inventory sync services.</li>
                <li>Processing transactions and billing.</li>
                <li>Sending administrative alerts and notifications (WhatsApp/Email).</li>
                <li>Developing new features and improving user experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">4. Data Sharing and Third Parties</h2>
              <p>We do not sell your personal or business data. We share data only with trusted third-party service providers necessary to operate our platform:</p>
              <ul className="list-disc pl-6 mt-4 space-y-3">
                <li><strong>Stripe:</strong> For payment processing and billing management.</li>
                <li><strong>Shopify/Amazon:</strong> For inventory and order synchronization (via OAuth).</li>
                <li><strong>Twilio:</strong> For sending WhatsApp and SMS alerts.</li>
                <li><strong>Sentry:</strong> For error monitoring and system stability.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">5. Security</h2>
              <p>We implement robust security measures to protect your data, including industry-standard SSL/TLS encryption for all data in transit and secure, encrypted storage for data at rest. We conduct regular security audits of our infrastructure.</p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">6. Contact Us</h2>
              <p>If you have any questions or concerns about this Privacy Policy, please reach out to our team at <a href="mailto:support@stocksync.io" className="text-indigo-600 hover:underline">support@stocksync.io</a>.</p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
