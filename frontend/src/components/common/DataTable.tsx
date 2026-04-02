import { ReactNode } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  key: string;
  header: ReactNode | string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  // Pagination props
  pagination?: {
    count: number;
    next: string | null;
    previous: string | null;
    onPageChange: (url: string) => void;
  };
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  data,
  loading,
  emptyMessage = "No data available.",
  onRowClick,
  pagination,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 italic text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-bottom border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={`group hover:bg-blue-50/30 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-4 text-sm text-gray-700 ${col.className || ""}`}>
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            Total records: <span className="text-gray-900">{pagination.count}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.previous && pagination.onPageChange(pagination.previous)}
              disabled={!pagination.previous}
              className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => pagination.next && pagination.onPageChange(pagination.next)}
              disabled={!pagination.next}
              className="p-1.5 rounded-md border border-gray-200 bg-white text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
