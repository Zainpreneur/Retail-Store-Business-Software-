import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Products } from "./pages/Products";
import { Categories } from "./pages/Categories";
import { Suppliers } from "./pages/Suppliers";
import { Customers } from "./pages/Customers";
import { PurchaseOrders } from "./pages/PurchaseOrders";
import { POS } from "./pages/POS";
import { SalesHistory } from "./pages/SalesHistory";
import { Reports } from "./pages/Reports";
import { Users } from "./pages/Users";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Protected({ children, roles }: { children: React.ReactNode; roles?: any[] }) {
  return (
    <ProtectedRoute roles={roles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/pos" element={<Protected><POS /></Protected>} />
      <Route path="/sales" element={<Protected><SalesHistory /></Protected>} />
      <Route path="/products" element={<Protected roles={["ADMIN", "MANAGER"]}><Products /></Protected>} />
      <Route path="/categories" element={<Protected roles={["ADMIN", "MANAGER"]}><Categories /></Protected>} />
      <Route path="/suppliers" element={<Protected roles={["ADMIN", "MANAGER"]}><Suppliers /></Protected>} />
      <Route path="/purchase-orders" element={<Protected roles={["ADMIN", "MANAGER"]}><PurchaseOrders /></Protected>} />
      <Route path="/customers" element={<Protected><Customers /></Protected>} />
      <Route path="/reports" element={<Protected roles={["ADMIN", "MANAGER"]}><Reports /></Protected>} />
      <Route path="/users" element={<Protected roles={["ADMIN"]}><Users /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
