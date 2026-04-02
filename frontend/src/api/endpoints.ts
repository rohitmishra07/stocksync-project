import api from "./client";
import {
  Product, ProductVariant, Category, StockLevel, StockMovement,
  Order, AnalyticsData, Alert, Location,
  PaginatedResponse, DashboardData, ChannelProductMapping,
  ForecastResult, Supplier, PurchaseOrder, Bundle, AlertSettings
} from "../types";

// Auth
export const authApi = {
  register: (data: any) => api.post("/auth/register/", data),
  login: (data: any) => api.post("/auth/login/", data),
  refresh: (refresh: string) => api.post("/auth/refresh/", { refresh }),
  me: () => api.get("/auth/me/"),
  updateMe: (data: Partial<any>) => api.patch("/auth/me/", data),
  tenantSettings: () => api.get("/auth/tenant/settings/"),
  updateTenantSettings: (data: any) => api.patch("/auth/tenant/settings/", data),
};

// Products
export const productsApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Product>>("/products/", { params }),
  get: (id: string) => api.get<Product>(`/products/${id}/`),
  create: (data: Partial<Product> & { initial_stock?: number; location_id?: string }) => 
    api.post<Product>("/products/", data),
  update: (id: string, data: Partial<Product>) =>
    api.patch<Product>(`/products/${id}/`, data),
  delete: (id: string) => api.delete(`/products/${id}/`),
  barcodeLookup: (code: string) =>
    api.get<{
      found_locally: boolean;
      product?: Product;
      variant?: ProductVariant;
      external_data?: {
        name: string;
        brand: string;
        category_name: string;
        image_url: string;
        barcode: string;
      };
    }>(`/products/barcode/${code}/`),
  barcodeSheet: (data: { product_ids: string[]; label_size: string }) =>
    api.post("/products/barcode-sheet/", data, { responseType: "blob" }),
  import: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/products/import/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  export: (format: 'csv' | 'xlsx') => 
    api.get(`/products/export/?format=${format}`, { responseType: "blob" }),
  bundles: {
    list: () => api.get<PaginatedResponse<Bundle>>("/products/bundles/"),
    get: (id: string) => api.get<Bundle>(`/products/bundles/${id}/`),
    create: (data: any) => api.post<Bundle>("/products/bundles/", data),
    update: (id: string, data: any) => api.patch<Bundle>(`/products/bundles/${id}/`, data),
    delete: (id: string) => api.delete(`/products/bundles/${id}/`),
    stock: (id: string) => api.get<{ available_stock: number }>(`/products/bundles/${id}/stock/`),
  },
  exportCsv: () => api.get("/products/export_csv/", { responseType: "blob" }),
  importCsv: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/products/import_csv/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// Categories
export const categoriesApi = {
  list: () => api.get<PaginatedResponse<Category>>("/products/categories/"),
  create: (data: { name: string }) => api.post<Category>("/products/categories/", data),
};

// Inventory
export const inventoryApi = {
  stock: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<StockLevel>>("/inventory/stock/", { params }),
  adjust: (data: {
    variant_id: string; location_id: string;
    quantity_change: number; notes?: string;
  }) => api.post("/inventory/adjust/", data),
  transfer: (data: {
    variant_id: string; from_location_id: string;
    to_location_id: string; quantity: number; notes?: string;
  }) => api.post("/inventory/transfer/", data),
  movements: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<StockMovement>>("/inventory/movements/", { params }),
  lowStock: () => api.get<PaginatedResponse<StockLevel>>("/inventory/low-stock/"),
  valuation: () => api.get("/inventory/valuation/"),
  locations: () => api.get<PaginatedResponse<Location>>("/inventory/locations/"),
};

// Orders
export const ordersApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Order>>("/orders/", { params }),
  get: (id: string) => api.get<Order>(`/orders/${id}/`),
  create: (data: any) => api.post<Order>("/orders/", data),
  fulfill: (id: string, data: { location_id: string; tracking_number?: string }) =>
    api.post<Order>(`/orders/${id}/fulfill/`, data),
  cancel: (id: string) => api.post<Order>(`/orders/${id}/cancel/`,),
  delete: (id: string) => api.delete(`/orders/${id}/`),
  suppliers: {
    list: (params?: Record<string, string>) => api.get<PaginatedResponse<Supplier>>("/orders/suppliers/", { params }),
    create: (data: any) => api.post<Supplier>("/orders/suppliers/", data),
  },
  purchaseOrders: {
    list: (params?: Record<string, string>) =>
      api.get<PaginatedResponse<PurchaseOrder>>("/orders/purchase-orders/", { params }),
    create: (data: any) => api.post<PurchaseOrder>("/orders/purchase-orders/", data),
    get: (id: string) => api.get<PurchaseOrder>(`/orders/purchase-orders/${id}/`),
    send: (id: string) => api.patch(`/orders/purchase-orders/${id}/send/`),
    receive: (id: string, lines: any[]) => 
      api.patch(`/orders/purchase-orders/${id}/receive/`, { lines }),
    confirmPublic: (token: string) => 
      api.patch(`/orders/purchase-orders/public/${token}/confirm/`, {}),
    getPublic: (token: string) => 
      api.get<PurchaseOrder>(`/orders/purchase-orders/public/${token}/`),
  }
};

// Analytics
export const analyticsApi = {
  dashboard: () => api.get<DashboardData>("/analytics/dashboard/"),
  sales: (params?: Record<string, string>) =>
    api.get<AnalyticsData>("/analytics/sales/", { params }),
  topProducts: (params?: Record<string, string>) =>
    api.get<any>("/analytics/top-products/", { params }),
  forecast: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<ForecastResult>>("/analytics/forecast/", { params }),
  margins: () => api.get<any[]>("/analytics/margins/"),
  anomalies: () => api.get<any[]>("/analytics/anomalies/"),
  gstReport: () => api.get<any[]>("/analytics/gst-report/"),
};

// Alerts
export const alertsApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Alert>>("/alerts/", { params }),
  count: () => api.get<{ unread_count: number }>("/alerts/count/"),
  markRead: (id: string) => api.patch(`/alerts/${id}/dismiss/`),
  dismissAll: () => api.put("/alerts/dismiss-all/"),
  settings: () => api.get<AlertSettings>("/alerts/settings/"),
  updateSettings: (data: Partial<AlertSettings>) => api.patch<AlertSettings>("/alerts/settings/", data),
};

// Channels
export const channelsApi = {
  status: () => api.get<ChannelProductMapping[]>("/channels/status/"),
  amazonStatus: () => api.get('/channels/amazon/status/'),
  amazonConnect: () => api.post('/channels/amazon/connect/'),
  installShopify: (shop: string) => 
    api.get(`/channels/shopify/install/?shop=${shop}`),
};
