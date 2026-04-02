import { useState, useEffect } from "react";
import { channelsApi } from "../api/endpoints";
import { ChannelProductMapping } from "../types";
import Modal from "./common/Modal";

export default function ChannelSyncStatus() {
  const [mappings, setMappings] = useState<ChannelProductMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [shopDomain, setShopDomain] = useState("");

  const fetchData = async () => {
    try {
      const response = await channelsApi.status();
      setMappings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch channel status:", error);
      setMappings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnectShopify = () => {
    if (!shopDomain) return;
    // Build the install URL - the backend handles the redirect
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
    window.location.href = `${baseUrl}/channels/shopify/install/?shop=${shopDomain}`;
  };

  // Group mappings by channel
  const channels = [
    { name: "Shopify", id: "shopify", icon: "🛍️" },
    { name: "Amazon", id: "amazon", icon: "📦" },
  ];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-blue-600">🔌</span> Channel Synchronization
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map((channel) => {
          const channelMappings = mappings.filter((m) => m.channel === channel.id);
          const isConnected = channelMappings.length > 0;

          return (
            <div
              key={channel.id}
              className="p-4 rounded-lg border border-gray-100 bg-gray-50 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{channel.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{channel.name}</h4>
                    {isConnected ? (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Synced
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Not Connected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isConnected ? (
                <div className="mt-2">
                  <p className="text-2xl font-bold text-gray-900">{channelMappings.length}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Synced SKUs</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Last sync: {channelMappings[0]?.last_synced ? new Date(channelMappings[0].last_synced).toLocaleString() : "Never"}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => channel.id === 'shopify' ? setShowConnectModal(true) : null}
                  className="mt-4 w-full py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Connect {channel.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        title="Connect Shopify Store"
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Enter your Shopify store domain to start the integration process.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shop Domain
            </label>
            <input
              type="text"
              value={shopDomain}
              onChange={(e) => setShopDomain(e.target.value)}
              placeholder="my-store.myshopify.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setShowConnectModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConnectShopify}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Start Installation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
