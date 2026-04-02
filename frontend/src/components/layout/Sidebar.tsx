import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart,
  BarChart3, Bell, Settings, LogOut, Boxes, ExternalLink, ShieldCheck,
  Layers, Truck, Users, CreditCard, ScanLine
} from "lucide-react";
import { useAuth } from "../../store/auth";
import { useAlertCount } from "../../hooks/useApi";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/bundles", icon: Layers, label: "Bundles" },
  { to: "/inventory", icon: Warehouse, label: "Inventory" },
  { to: "/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/purchase-orders", icon: Truck, label: "Purchase Orders" },
  { to: "/suppliers", icon: Users, label: "Suppliers" },
  { to: "/scanner", icon: ScanLine, label: "Scanner" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/settings/billing", icon: CreditCard, label: "Billing & Plans" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { data: alertData } = useAlertCount();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Boxes className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">StockSync</h1>
            <p className="text-xs text-gray-500">{user?.tenant?.name}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
            {label === "Alerts" && alertData?.unread_count ? (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {alertData.unread_count}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>


      <div className="mx-4 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2">
         <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Management</span>
         </div>
         <a 
           href="http://localhost:8000/admin/" target="_blank" rel="noreferrer"
           className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 transition-all uppercase tracking-tight group"
         >
           Access Backend <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
         </a>
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
            {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
