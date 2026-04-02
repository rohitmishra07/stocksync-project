export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: Record<string, string>;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  tenant: Tenant;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent: string | null;
  product_count: number;
  children: Category[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  attributes: Record<string, string>;
  cost_price: string;
  selling_price: string;
  available_stock: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  brand: string;
  category: string | null;
  category_name: string | null;
  cost_price: string;
  selling_price: string;
  margin: number;
  total_stock: number;
  variant_count: number;
  variants?: ProductVariant[];
  images: string[];
  description?: string;
  is_active: boolean;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: Record<string, string>;
  is_default: boolean;
  is_active: boolean;
  stock_count: number;
}

export interface StockLevel {
  id: string;
  variant: ProductVariant;
  location: string;
  location_name: string;
  product_name: string;
  quantity: number;
  reserved_quantity: number;
  available: number;
}

export interface StockMovement {
  id: string;
  variant_sku: string;
  product_name: string;
  location_name: string;
  movement_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_type: string;
  notes: string;
  created_by_email: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  variant: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: string;
  discount: string;
  tax: string;
  total: number;
}

export interface Order {
  id: string;
  order_number: string;
  channel: string;
  status: string;
  customer_name: string;
  customer_email: string;
  grand_total: string;
  currency: string;
  item_count: number;
  items?: OrderItem[];
  fulfillment_location_name: string | null;
  placed_at: string;
  shipped_at: string | null;
}

export interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardData {
  orders: { total: number; pending: number; processing: number };
  revenue: { total: string; change_percent: number; currency: string };
  inventory: {
    low_stock_items: number;
    out_of_stock_items: number;
    total_cost_value: string;
    total_retail_value: string;
  };
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AnalyticsData {
  data: { date: string; revenue: number; orders: number }[];
}

export interface ChannelProductMapping {
  id: string;
  product: string;
  product_name: string;
  sku: string;
  channel: 'shopify' | 'amazon';
  external_id: string;
  last_synced: string;
}

export interface ForecastResult {
  id: string;
  product: string;
  product_name: string;
  product_sku: string;
  daily_avg_sales: number;
  days_of_stock_left: number;
  reorder_suggestion_qty: number;
  calculated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  lead_days: number;
  address: string;
}

export interface PurchaseOrderLine {
  id: string;
  purchase_order: string;
  product: string;
  product_name: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: string;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  supplier_name: string;
  status: 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'complete' | 'cancelled';
  po_number: string;
  token: string;
  notes: string;
  expected_delivery: string | null;
  line_count: number;
  lines?: PurchaseOrderLine[];
  created_at: string;
}

export interface BundleComponent {
  id: string;
  product: string;
  product_name: string;
  quantity: number;
}

export interface Bundle {
  id: string;
  name: string;
  sku: string;
  price: string;
  is_active: boolean;
  available_stock: number;
  components: BundleComponent[];
}

export interface AlertSettings {
  email_alerts_enabled: boolean;
  whatsapp_alerts_enabled: boolean;
  whatsapp_number: string;
  low_stock_threshold_override: number | null;
}
