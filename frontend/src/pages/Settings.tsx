import { useState, useEffect } from "react";
import { useAuth } from "../store/auth";
import api from "../api/client";
import { alertsApi, channelsApi } from "../api/endpoints";
import type { AlertSettings } from "../types";

export default function Settings() {
  const { user, setUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [orgForm, setOrgForm] = useState({
    name: user?.tenant?.name || "",
    currency: user?.tenant?.settings?.currency || "USD",
    timezone: user?.tenant?.settings?.timezone || "UTC",
  });

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
  });

  const [alertSettings, setAlertSettings] = useState<AlertSettings | null>(null);
  const [amazonStatus, setAmazonStatus] = useState<{ connected: boolean; store?: any } | null>(null);
  const [connectingAmazon, setConnectingAmazon] = useState(false);

  useEffect(() => {
    alertsApi.settings()
      .then(res => setAlertSettings(res.data))
      .catch(() => {});

    channelsApi.amazonStatus()
      .then(res => setAmazonStatus(res.data))
      .catch(() => {});
  }, []);

  const handleSaveOrg = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { data } = await api.patch("/auth/me/", {
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
      });
      setUser(data);

      if (alertSettings) {
        await alertsApi.updateSettings({
          email_alerts_enabled: alertSettings.email_alerts_enabled,
          whatsapp_alerts_enabled: alertSettings.whatsapp_alerts_enabled,
          whatsapp_number: alertSettings.whatsapp_number,
        });
      }

      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch {
      setMessage({ type: "error", text: "Failed to save settings. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleConnectAmazon = async () => {
     setConnectingAmazon(true);
     try {
        const res = await channelsApi.amazonConnect();
        setAmazonStatus({ connected: true, store: res.data.store });
        setMessage({ type: "success", text: "Amazon account connected successfully (Demo Mode)!" });
     } catch {
        setMessage({ type: "error", text: "Failed to connect Amazon account." });
     } finally {
        setConnectingAmazon(false);
     }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm font-medium toast-enter ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={orgForm.name}
              onChange={(e) => setOrgForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={orgForm.currency}
                onChange={(e) => setOrgForm((f) => ({ ...f, currency: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={orgForm.timezone}
                onChange={(e) => setOrgForm((f) => ({ ...f, timezone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
              >
                <option value="UTC">UTC</option>
                <option value="US/Eastern">US/Eastern</option>
                <option value="US/Pacific">US/Pacific</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="Europe/London">Europe/London</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={profileForm.first_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, first_name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, last_name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              defaultValue={user?.email || ""}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              defaultValue={user?.role || ""}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 capitalize"
            />
          </div>
        </div>
      </div>

      {alertSettings && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <input 
                 type="checkbox" 
                 id="emailAlerts" 
                 checked={alertSettings.email_alerts_enabled} 
                 onChange={(e) => setAlertSettings(prev => prev ? {...prev, email_alerts_enabled: e.target.checked} : null)} 
                 className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
               />
               <label htmlFor="emailAlerts" className="text-sm font-medium text-gray-700">Enable Email Alerts</label>
            </div>
            <div className="flex items-center gap-3">
               <input 
                 type="checkbox" 
                 id="whatsappAlerts" 
                 checked={alertSettings.whatsapp_alerts_enabled} 
                 onChange={(e) => setAlertSettings(prev => prev ? {...prev, whatsapp_alerts_enabled: e.target.checked} : null)} 
                 className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
               />
               <label htmlFor="whatsappAlerts" className="text-sm font-medium text-gray-700">Enable WhatsApp Alerts</label>
            </div>
            {alertSettings.whatsapp_alerts_enabled && (
               <div className="mt-2 pl-7">
                 <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number (with country code)</label>
                 <input
                   type="text"
                   value={alertSettings.whatsapp_number}
                   onChange={(e) => setAlertSettings(prev => prev ? {...prev, whatsapp_number: e.target.value} : null)}
                   placeholder="+1234567890"
                   className="w-full sm:w-1/2 rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                 />
                 <p className="text-xs text-gray-500 mt-1">E.g. +14155238886</p>
               </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Integrations</h2>
        <div className="space-y-4">
          <div className="p-5 border border-gray-100 rounded-xl bg-gray-50/30 flex items-center justify-between group hover:border-blue-100 transition-colors">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center p-2 shadow-sm">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg" alt="Amazon" className="w-full h-full object-contain" />
               </div>
               <div>
                  <h3 className="font-bold text-gray-900">Amazon SP-API</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${amazonStatus?.connected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <p className="text-xs text-gray-500 font-medium">
                       {amazonStatus?.connected ? `Connected (${amazonStatus.store.seller_id})` : 'Not Connected'}
                    </p>
                  </div>
               </div>
            </div>
            <button 
              onClick={handleConnectAmazon}
              disabled={connectingAmazon || amazonStatus?.connected}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all shadow-sm ${
                amazonStatus?.connected 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50 active:scale-95'
              }`}
            >
              {connectingAmazon ? 'Connecting...' : amazonStatus?.connected ? 'Linked' : 'Connect Amazon'}
            </button>
          </div>

          <div className="p-5 border border-gray-100 rounded-xl bg-gray-50/30 flex items-center justify-between opacity-50 grayscale">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center p-2 shadow-sm">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg" alt="Shopify" className="w-full h-full object-contain" />
               </div>
               <div>
                  <h3 className="font-bold text-gray-900">Shopify</h3>
                  <p className="text-xs text-gray-500">Coming Soon</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <button
          onClick={handleSaveOrg}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
