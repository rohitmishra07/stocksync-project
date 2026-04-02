import { useState, useEffect, useCallback, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "./store/auth";
import { authApi } from "./api/endpoints";
import type { User } from "./types";

// Layout
import AppLayout from "./components/layout/AppLayout";

// Pages
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import Bundles from "./pages/Bundles";
import PublicPurchaseOrder from "./pages/PublicPurchaseOrder";
import MobileScanner from "./pages/MobileScanner";
import OnboardingWizard from "./pages/onboarding/OnboardingWizard";

import { UpgradePromptModal } from "./components/UpgradePromptModal";
import UpgradePage from "./pages/Billing/UpgradePage";
import SuccessPage from "./pages/Billing/SuccessPage";
import BillingSettings from "./pages/Billing/BillingSettings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
  },
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  const login = useCallback((access: string, refresh: string) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    // Fetch user after login
    authApi.me().then((res) => setUser(res.data)).catch(() => {});
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    queryClient.clear();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      authApi
        .me()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("access_token");
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user && !localStorage.getItem("onboarding_complete")) {
      const createdAt = new Date(user.created_at).getTime();
      const now = new Date().getTime();
      const isNewUser = (now - createdAt) < (60 * 60 * 1000); // 1 hour
      
      if (isNewUser && window.location.pathname !== "/onboarding") {
        navigate("/onboarding", { replace: true });
      }
    }
  }, [user, navigate]);

  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<OnboardingWizard />} />
            <Route path="/public/po/:token" element={<PublicPurchaseOrder />} />
            <Route path="/billing/upgrade" element={<UpgradePage />} />
            <Route path="/billing/success" element={<SuccessPage />} />

            {/* Protected */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="orders" element={<Orders />} />
              <Route path="purchase-orders" element={<PurchaseOrders />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="bundles" element={<Bundles />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="scanner" element={<MobileScanner />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/billing" element={<BillingSettings />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <UpgradePromptModal />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
