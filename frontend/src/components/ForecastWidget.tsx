import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/endpoints';
import { useNavigate } from 'react-router-dom';

const ForecastWidget: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['forecasts'],
    queryFn: () => analyticsApi.forecast({ limit: '10' }).then(res => res.data.results),
  });

  if (isLoading) return <div className="p-4 bg-white rounded shadow text-gray-500">Loading forecasts...</div>;
  if (error) return <div className="p-4 bg-white rounded shadow text-red-500">Error loading forecasts</div>;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden xl:col-span-2">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Smart Reorder Suggestions</h2>
        <span className="text-sm text-gray-500">Based on 90-day velocity</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Avg Sales</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days of Stock Left</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggestion (Qty)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.map((item: any) => {
              // Color coding based on urgency
              const isCritical = item.days_of_stock_left < 7;
              const isWarning = item.days_of_stock_left >= 7 && item.days_of_stock_left <= 14;
              
              const rowClass = isCritical 
                ? "bg-red-50 hover:bg-red-100" 
                : isWarning 
                  ? "bg-yellow-50 hover:bg-yellow-100" 
                  : "bg-green-50 hover:bg-green-100";
                  
              const statusColor = isCritical ? "text-red-700 font-semibold" : isWarning ? "text-yellow-700 font-semibold" : "text-green-700 text-sm";

              return (
                <tr key={item.id} className={`${rowClass} transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                    <div className="text-sm text-gray-500">{item.product_sku}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.daily_avg_sales.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={statusColor}>
                      {item.days_of_stock_left > 900 ? "900+" : Math.round(item.days_of_stock_left)} days
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {item.reorder_suggestion_qty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => navigate('/purchase-orders', { 
                        state: { 
                          new_po: true, 
                          product_id: item.product, 
                          qty: item.reorder_suggestion_qty 
                        } 
                      })}
                      disabled={item.reorder_suggestion_qty <= 0}
                      className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed bg-white border border-gray-300 rounded px-3 py-1 text-xs shadow-sm transition-all"
                    >
                      Create PO
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {(!data || data.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No forecasting data available yet.
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
