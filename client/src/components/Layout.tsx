import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", roles: ["ADMIN", "MANAGER", "CASHIER"], icon: "📊" },
  { to: "/pos", label: "Point of Sale", roles: ["ADMIN", "MANAGER", "CASHIER"], icon: "🛒" },
  { to: "/sales", label: "Sales History", roles: ["ADMIN", "MANAGER", "CASHIER"], icon: "🧾" },
  { to: "/products", label: "Products", roles: ["ADMIN", "MANAGER"], icon: "📦" },
  { to: "/categories", label: "Categories", roles: ["ADMIN", "MANAGER"], icon: "🏷️" },
  { to: "/suppliers", label: "Suppliers", roles: ["ADMIN", "MANAGER"], icon: "🚚" },
  { to: "/purchase-orders", label: "Purchase Orders", roles: ["ADMIN", "MANAGER"], icon: "📥" },
  { to: "/customers", label: "Customers", roles: ["ADMIN", "MANAGER", "CASHIER"], icon: "👥" },
  { to: "/reports", label: "Reports", roles: ["ADMIN", "MANAGER"], icon: "📈" },
  { to: "/users", label: "Users", roles: ["ADMIN"], icon: "🔑" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-800">
          <h1 className="text-lg font-bold text-white">🏬 Retail Manager</h1>
          <p className="text-xs text-slate-400 mt-0.5">Store Operations Suite</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems
            .filter((item) => !user || item.roles.includes(user.role))
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          <p className="text-xs text-slate-400 mb-3">{user?.role}</p>
          <button onClick={handleLogout} className="btn-secondary w-full !bg-slate-800 !text-slate-200 !border-slate-700 hover:!bg-slate-700">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-slate-100">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
