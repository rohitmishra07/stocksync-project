import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  analyticsApi, productsApi, inventoryApi,
  ordersApi, alertsApi, authApi, categoriesApi,
} from "../api/endpoints";
import type { Product } from "../types";

// Dashboard
export const useDashboard = () =>
  useQuery({ queryKey: ["dashboard"], queryFn: () => analyticsApi.dashboard().then((r) => r.data) });

// Auth & Settings
export const useMe = () =>
  useQuery({ queryKey: ["me"], queryFn: () => authApi.me().then((r) => r.data) });

export const useUpdateMe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<any>) => authApi.updateMe(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
};

export const useUpdateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => authApi.updateTenantSettings(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

// Products
export const useProducts = (params?: Record<string, string>) =>
  useQuery({ queryKey: ["products", params], queryFn: () => productsApi.list(params).then((r) => r.data) });

export const useProduct = (id: string) =>
  useQuery({ queryKey: ["product", id], queryFn: () => productsApi.get(id).then((r) => r.data), enabled: !!id });

export const useCategories = () =>
  useQuery({ queryKey: ["categories"], queryFn: () => categoriesApi.list().then((r) => r.data) });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => categoriesApi.create({ name }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
};

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Product> & { initial_stock?: number; location_id?: string }) => 
      productsApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => 
      productsApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useExportProducts = () => {
  return useMutation({
    mutationFn: () => productsApi.exportCsv().then((r) => r.data),
  });
};

export const useImportProducts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => productsApi.importCsv(file).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
    },
  });
};

// Inventory
export const useStockLevels = (params?: Record<string, string>) =>
  useQuery({ queryKey: ["stock", params], queryFn: () => inventoryApi.stock(params).then((r) => r.data) });

export const useLowStock = () =>
  useQuery({ queryKey: ["low-stock"], queryFn: () => inventoryApi.lowStock().then((r) => r.data) });

export const useLocations = () =>
  useQuery({ queryKey: ["locations"], queryFn: () => inventoryApi.locations().then((r) => r.data) });

export const useAdjustStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      variant_id: string; location_id: string;
      quantity_change: number; notes?: string;
    }) => inventoryApi.adjust(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["low-stock"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useTransferStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      variant_id: string; from_location_id: string;
      to_location_id: string; quantity: number; notes?: string;
    }) => inventoryApi.transfer(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

// Orders
export const useOrders = (params?: Record<string, string>) =>
  useQuery({ queryKey: ["orders", params], queryFn: () => ordersApi.list(params).then((r) => r.data) });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => ordersApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useDeleteOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

// Alerts
export const useAlerts = () =>
  useQuery({ queryKey: ["alerts"], queryFn: () => alertsApi.list().then((r) => r.data) });

export const useAlertCount = () =>
  useQuery({ queryKey: ["alert-count"], queryFn: () => alertsApi.count().then((r) => r.data), refetchInterval: 30000 });

export const useMarkAlertRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["alert-count"] });
    },
  });
};

export const useDismissAllAlerts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => alertsApi.dismissAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["alert-count"] });
    },
  });
};

// Analytics
export const useSalesAnalytics = (params?: Record<string, string>) =>
  useQuery({ queryKey: ["sales", params], queryFn: () => analyticsApi.sales(params).then((r) => r.data) });

export const useTopProducts = (params?: Record<string, string>) =>
  useQuery({ queryKey: ["top-products", params], queryFn: () => analyticsApi.topProducts(params).then((r) => r.data) });

export const useMargins = () =>
  useQuery({ queryKey: ["margins"], queryFn: () => analyticsApi.margins().then((r) => r.data) });

export const useGstReport = () =>
  useQuery({ queryKey: ["gst-report"], queryFn: () => analyticsApi.gstReport().then((r) => r.data) });

export const useAnomalies = () =>
  useQuery({ queryKey: ["anomalies"], queryFn: () => analyticsApi.anomalies().then((r) => r.data) });
