import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";

interface UsageMetric {
  current: number;
  limit: number;
}

interface SubscriptionData {
  plan: string;
  display_name: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  usage: {
    skus: UsageMetric;
    channels: UsageMetric;
    locations: UsageMetric;
    users: UsageMetric;
  };
  features: {
    has_forecasting: boolean;
    has_gst_reports: boolean;
    has_whatsapp_alerts: boolean;
    has_bundles: boolean;
    has_api_access: boolean;
  };
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function BillingSettings() {
  const { data: subscription, isLoading, error } = useQuery<SubscriptionData>({
    queryKey: ["subscription"],
    queryFn: async () => {
      const response = await api.get("/billing/subscription/");
      return response.data;
    },
  });

  const handleManageBilling = async () => {
    try {
      const response = await api.post("/billing/create-portal-session/");
      if (response.data.portal_url) {
        window.location.href = response.data.portal_url;
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Error establishing portal connection.");
    }
  };

  const getPercentage = (current: number, limit: number) => {
    if (limit === -1) return 0;
    if (limit === 0) return 100;
    const pct = (current / limit) * 100;
    return pct > 100 ? 100 : pct;
  };

  const renderUsageBar = (label: string, metric: UsageMetric) => {
    const isUnlimited = metric.limit === -1;
    const percentage = getPercentage(metric.current, metric.limit);
    const inDanger = percentage > 85 && !isUnlimited;

    return (
      <div className="mt-4">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-gray-700">{label}</span>
          <span className="text-gray-900">
            {metric.current} / {isUnlimited ? "Unlimited" : metric.limit}
          </span>
        </div>
        <div className="mt-1 w-full rounded-full bg-gray-200">
          <div
            className={classNames(
              "h-2 rounded-full",
              inDanger ? "bg-red-500" : "bg-indigo-600"
            )}
            style={{ width: `${isUnlimited ? 0 : percentage}%` }}
          />
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="p-8 text-center">Loading Billing Configuration...</div>;
  if (error || !subscription) return <div className="p-8 text-center text-red-500">Failed to load subscription details</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold leading-7 text-gray-900">Billing & Overview</h1>

      <div className="mt-6 flex flex-col sm:flex-row gap-6">
        <div className="flex-1 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
            <h3 className="flex items-center text-base font-semibold leading-6 text-gray-900 gap-x-3">
              Current Plan: {subscription.display_name}
              {subscription.status === "trialing" && (
                <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                  Trial Active
                </span>
              )}
            </h3>
          </div>
          <div className="px-6 py-6 border-b border-gray-100">
            <div className="space-y-4">
              <p className="text-sm text-gray-700 font-medium">Limits Definition</p>
              {renderUsageBar("Registered SKUs", subscription.usage.skus)}
              {renderUsageBar("Sales Channels", subscription.usage.channels)}
              {renderUsageBar("Team Members", subscription.usage.users)}
              {renderUsageBar("Inventory Outposts", subscription.usage.locations)}
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {subscription.current_period_end && (
                <span>Next Billing Cycle: {new Date(subscription.current_period_end).toLocaleDateString()}</span>
              )}
            </div>
            {(subscription.status === 'active' || subscription.status === 'trialing') ? (
              <div className="flex gap-3">
                {!subscription.stripe_customer_id && subscription.status === 'trialing' ? (
                  <a 
                    href="/billing/upgrade"
                    className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all font-mono tracking-tight"
                  >
                    ACTIVATE PLAN
                  </a>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:bg-gray-100 transition-all"
                    onClick={handleManageBilling}
                  >
                    Manage Subscription
                  </button>
                )}
              </div>
            ) : (
               <a 
                 href="/billing/upgrade"
                 className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
               >
                 Upgrade Plan
               </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
