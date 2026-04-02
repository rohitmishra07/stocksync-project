import { AlertTriangle, Bell, CheckCircle, XCircle } from "lucide-react";
import StatusBadge from "../components/common/StatusBadge";
import { useAlerts } from "../hooks/useApi";
import { alertsApi } from "../api/endpoints";
import type { Alert } from "../types";

const iconMap: Record<string, React.ReactNode> = {
  low_stock: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  out_of_stock: <XCircle className="h-5 w-5 text-red-500" />,
  order_received: <Bell className="h-5 w-5 text-blue-500" />,
  sync_failure: <XCircle className="h-5 w-5 text-red-500" />,
};

export default function Alerts() {
  const { data, refetch } = useAlerts();

  const markRead = async (id: string) => {
    await alertsApi.markRead(id);
    refetch();
  };

  const dismissAll = async () => {
    await alertsApi.dismissAll();
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
        <button onClick={dismissAll}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          Dismiss All
        </button>
      </div>

      <div className="space-y-3">
        {data?.results?.map((alert: Alert) => (
          <div
            key={alert.id}
            className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${
              alert.is_read ? "border-gray-200 opacity-60" : "border-gray-300"
            }`}
          >
            {iconMap[alert.alert_type] || <Bell className="h-5 w-5 text-gray-400" />}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-900">{alert.title}</span>
                <StatusBadge status={alert.severity} />
              </div>
              <p className="text-sm text-gray-600">{alert.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            </div>
            {!alert.is_read && (
              <button onClick={() => markRead(alert.id)}
                className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                Mark read
              </button>
            )}
          </div>
        ))}
        {(!data?.results || data.results.length === 0) && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500">All clear! No alerts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
