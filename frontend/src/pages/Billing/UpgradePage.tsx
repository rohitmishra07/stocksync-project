import { useState } from "react";
import { CheckIcon } from "@heroicons/react/20/solid";
import api from "../../api/client";

const tiers = [
  {
    name: "Starter",
    id: "starter",
    href: "#",
    priceMonthly: "₹4,000",
    description: "The essentials to provide your best work for clients.",
    features: [
      "500 products (SKUs)",
      "1 sales channel",
      "1 location",
      "Up to 2 users",
      "Basic inventory management",
    ],
    mostPopular: false,
  },
  {
    name: "Growth",
    id: "growth",
    href: "#",
    priceMonthly: "₹8,000",
    description: "A plan that scales with your rapidly growing business.",
    features: [
      "2,000 products (SKUs)",
      "Up to 3 sales channels",
      "Up to 3 locations",
      "Up to 5 users",
      "Advanced demand forecasting",
      "GST compliance reports",
      "Product bundles / kitting",
    ],
    mostPopular: true,
  },
  {
    name: "Pro",
    id: "pro",
    href: "#",
    priceMonthly: "₹12,000",
    description: "Dedicated support and infrastructure for your company.",
    features: [
      "Unlimited products (SKUs)",
      "Unlimited sales channels",
      "Unlimited locations",
      "Unlimited users",
      "Everything in Growth",
      "WhatsApp alerts integration",
    ],
    mostPopular: false,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubscribe = async (tierId: string) => {
    setLoading(tierId);
    setError("");
    try {
      const response = await api.post("/billing/create-checkout-session/", {
        plan: tierId,
        currency: "inr",
      });
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        setError("Failed to generate checkout link.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "An error occurred during checkout setup.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Upgrade your StockSync plan
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          Unlock premium features like Demand Forecasting, GST Reports, Product Bundling, and multi-channel Shopify syncing.
        </p>

        {error && (
          <div className="mx-auto mt-6 max-w-2xl text-center text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-0">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={classNames(
                tier.mostPopular ? "ring-2 ring-indigo-600" : "ring-1 ring-gray-200",
                "rounded-3xl p-8 xl:p-10"
              )}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.id}
                  className={classNames(
                    tier.mostPopular ? "text-indigo-600" : "text-gray-900",
                    "text-lg font-semibold leading-8"
                  )}
                >
                  {tier.name}
                </h3>
                {tier.mostPopular ? (
                  <p className="rounded-full bg-indigo-60/10 px-2.5 py-1 text-xs font-semibold leading-5 text-indigo-600">
                    Most popular
                  </p>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600">{tier.description}</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">{tier.priceMonthly}</span>
                <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>
              </p>
              <button
                onClick={() => handleSubscribe(tier.id)}
                disabled={loading !== null}
                className={classNames(
                  tier.mostPopular
                    ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500"
                    : "text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300",
                  "mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                )}
              >
                {loading === tier.id ? "Redirecting..." : "Subscribe"}
              </button>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
