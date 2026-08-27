import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

router.get("/dashboard", async (_req, res) => {
  const today = startOfDay(new Date());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    todaySales,
    monthSales,
    totalProducts,
    lowStockCount,
    totalCustomers,
    pendingPOs,
    recentSales,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: today }, status: "COMPLETED" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: monthStart }, status: "COMPLETED" },
      _sum: { total: true },
      _count: true,
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.product.findMany().then((ps) => ps.filter((p) => p.stockQty <= p.reorderLevel).length),
    prisma.customer.count(),
    prisma.purchaseOrder.count({ where: { status: "ORDERED" } }),
    prisma.sale.findMany({
      where: { status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { customer: true, user: { select: { name: true } } },
    }),
  ]);

  const topProductsRaw = await prisma.saleItem.groupBy({
    by: ["productId"],
    _sum: { qty: true, subtotal: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 5,
  });
  const topProductIds = topProductsRaw.map((t) => t.productId);
  const topProductDetails = await prisma.product.findMany({ where: { id: { in: topProductIds } } });
  const topProducts = topProductsRaw.map((t) => ({
    product: topProductDetails.find((p) => p.id === t.productId),
    qtySold: t._sum.qty || 0,
    revenue: t._sum.subtotal || 0,
  }));

  res.json({
    todayRevenue: todaySales._sum.total || 0,
    todayOrders: todaySales._count,
    monthRevenue: monthSales._sum.total || 0,
    monthOrders: monthSales._count,
    totalProducts,
    lowStockCount,
    totalCustomers,
    pendingPurchaseOrders: pendingPOs,
    recentSales,
    topProducts,
  });
});

router.get("/sales", async (req, res) => {
  const { from, to } = req.query as Record<string, string>;
  const where: any = { status: "COMPLETED" };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const sales = await prisma.sale.findMany({ where, include: { items: true } });

  const byDay = new Map<string, { date: string; revenue: number; orders: number }>();
  for (const sale of sales) {
    const key = sale.createdAt.toISOString().slice(0, 10);
    const entry = byDay.get(key) || { date: key, revenue: 0, orders: 0 };
    entry.revenue += sale.total;
    entry.orders += 1;
    byDay.set(key, entry);
  }

  res.json({
    totalRevenue: sales.reduce((s, x) => s + x.total, 0),
    totalOrders: sales.length,
    totalTax: sales.reduce((s, x) => s + x.tax, 0),
    totalDiscount: sales.reduce((s, x) => s + x.discount, 0),
    daily: Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)),
  });
});

router.get("/inventory", async (_req, res) => {
  const products = await prisma.product.findMany({ include: { category: true } });
  const totalStockValue = products.reduce((s, p) => s + p.stockQty * p.costPrice, 0);
  const lowStock = products.filter((p) => p.stockQty <= p.reorderLevel);

  res.json({
    totalProducts: products.length,
    totalStockValue,
    lowStock,
  });
});

export default router;
