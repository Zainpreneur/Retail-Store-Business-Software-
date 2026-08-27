export type Role = "ADMIN" | "MANAGER" | "CASHIER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active?: boolean;
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  _count?: { products: number };
}

export interface Supplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  _count?: { products: number; purchaseOrders: number };
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  stockQty: number;
  reorderLevel: number;
  active: boolean;
  categoryId?: string | null;
  supplierId?: string | null;
  category?: Category | null;
  supplier?: Supplier | null;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  loyaltyPoints: number;
  sales?: Sale[];
}

export interface SaleItem {
  id: string;
  qty: number;
  price: number;
  discount: number;
  subtotal: number;
  productId: string;
  product?: Product;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  changeDue: number;
  paymentMethod: "CASH" | "CARD" | "MOBILE" | "STORE_CREDIT";
  status: "COMPLETED" | "REFUNDED" | "VOID";
  createdAt: string;
  customer?: Customer | null;
  user?: { id: string; name: string };
  items: SaleItem[];
}

export interface PurchaseOrderItem {
  id: string;
  qty: number;
  costPrice: number;
  subtotal: number;
  productId: string;
  product?: Product;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: "DRAFT" | "ORDERED" | "RECEIVED" | "CANCELLED";
  totalAmount: number;
  notes?: string | null;
  createdAt: string;
  receivedAt?: string | null;
  supplierId: string;
  supplier?: Supplier;
  user?: { id: string; name: string };
  items: PurchaseOrderItem[];
}

export interface DashboardData {
  todayRevenue: number;
  todayOrders: number;
  monthRevenue: number;
  monthOrders: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  pendingPurchaseOrders: number;
  recentSales: Sale[];
  topProducts: { product?: Product; qtySold: number; revenue: number }[];
}
