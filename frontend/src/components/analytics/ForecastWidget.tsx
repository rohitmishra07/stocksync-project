import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../../api/endpoints';
import { ForecastResult } from '../../types';
import { TrendingUp, CheckCircle, Package } from 'lucide-react';

const ForecastWidget: React.FC = () => {
  const [forecasts, setForecasts] = useState<ForecastResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        const response = await analyticsApi.forecast();
        setForecasts(response.data.results);
      } catch (error) {
        console.error('Failed to fetch forecasts', error);
      } finally {
        setLoading(false);
      }
    };
    fetchForecasts();
  }, []);

  const getUrgencyColor = (days: number) => {
    if (days < 7) return 'bg-red-50 text-red-700 border-red-100';
    if (days < 14) return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    return 'bg-green-50 text-green-700 border-green-100';
  };

  const getRowColor = (days: number) => {
    if (days < 7) return 'bg-red-50/50';
    if (days < 14) return 'bg-yellow-50/50';
    return '';
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Loading forecasting data...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">Smart Reorder Engine</h3>
        </div>
        <span className="text-xs text-slate-500">Based on last 90 days of sales</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
            <tr>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3 text-center">Daily Sales</th>
              <th className="px-6 py-3 text-center">Stock Lifespan</th>
              <th className="px-6 py-3 text-center">Suggested Reorder</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {forecasts.map((item) => (
              <tr key={item.id} className={`${getRowColor(item.days_of_stock_left)} transition-colors`}>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{item.product_name}</div>
                  <div className="text-xs text-slate-500">{item.product_sku}</div>
                </td>
                <td className="px-6 py-4 text-center">{item.daily_avg_sales.toFixed(2)} / day</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getUrgencyColor(item.days_of_stock_left)}`}>
                    {item.days_of_stock_left > 365 ? '> 1 Year' : `${Math.round(item.days_of_stock_left)} days`}
                  </span>
                </td>
                <td className="px-6 py-4 text-center font-semibold text-slate-700">
                  {item.reorder_suggestion_qty > 0 ? (
                    <span className="flex items-center justify-center gap-1 text-indigo-600">
                      <Package className="w-4 h-4" />
                      {item.reorder_suggestion_qty}
                    </span>
                  ) : (
                    <span className="text-green-600 flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Optimal
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    className="text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                    disabled={item.reorder_suggestion_qty === 0}
                    onClick={() => {
                        // This will navigate to create PO pre-filled
                        window.location.href = `/purchase-orders/new?product=${item.product}&qty=${item.reorder_suggestion_qty}`;
                    }}
                  >
                    Create PO
                  </button>
                </td>
              </tr>
            ))}
            {forecasts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-500 italic">
                  No forecasting data available yet. Run the calculation task to generate suggestions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ForecastWidget;
