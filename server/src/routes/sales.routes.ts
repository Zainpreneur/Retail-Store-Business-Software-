import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate);

const saleItemSchema = z.object({
  productId: z.string(),
  qty: z.coerce.number().int().positive(),
  discount: z.coerce.number().min(0).default(0),
});

const createSaleSchema = z.object({
  customerId: z.string().nullable().optional(),
  items: z.array(saleItemSchema).min(1),
  discount: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "CARD", "MOBILE", "STORE_CREDIT"]).default("CASH"),
  amountPaid: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

async function nextInvoiceNo() {
  const count = await prisma.sale.count();
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
}

router.get("/", async (req, res) => {
  const { from, to, customerId } = req.query as Record<string, string>;
  const where: any = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }
  if (customerId) where.customerId = customerId;

  const sales = await prisma.sale.findMany({
    where,
    include: { customer: true, user: { select: { id: true, name: true } }, items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(sales);
});

router.get("/:id", async (req, res) => {
  const sale = await prisma.sale.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      customer: true,
      user: { select: { id: true, name: true } },
      items: { include: { product: true } },
    },
  });
  res.json(sale);
});

router.post("/", async (req, res) => {
  const data = createSaleSchema.parse(req.body);

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  let tax = 0;
  const itemsData = data.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new ApiError(404, `Product ${item.productId} not found`);
    if (product.stockQty < item.qty) {
      throw new ApiError(400, `Insufficient stock for ${product.name} (available: ${product.stockQty})`);
    }
    const lineGross = product.sellingPrice * item.qty - item.discount;
    const lineTax = lineGross * (product.taxRate / 100);
    subtotal += lineGross;
    tax += lineTax;
    return {
      productId: product.id,
      qty: item.qty,
      price: product.sellingPrice,
      discount: item.discount,
      subtotal: lineGross,
    };
  });

  const total = Math.max(0, subtotal - data.discount + tax);
  const changeDue = Math.max(0, data.amountPaid - total);
  const invoiceNo = await nextInvoiceNo();

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.sale.create({
      data: {
        invoiceNo,
        subtotal,
        discount: data.discount,
        tax,
        total,
        amountPaid: data.amountPaid,
        changeDue,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        customerId: data.customerId || null,
        userId: req.user!.sub,
        items: { create: itemsData },
      },
      include: { items: true, customer: true, user: { select: { id: true, name: true } } },
    });

    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.qty } },
      });
    }

    if (data.customerId) {
      const pointsEarned = Math.floor(total / 10);
      if (pointsEarned > 0) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: { loyaltyPoints: { increment: pointsEarned } },
        });
      }
    }

    return created;
  });

  res.status(201).json(sale);
});

router.post("/:id/void", async (req, res) => {
  const sale = await prisma.sale.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (sale.status !== "COMPLETED") {
    throw new ApiError(400, "Only completed sales can be voided");
  }

  await prisma.$transaction(async (tx) => {
    await tx.sale.update({ where: { id: sale.id }, data: { status: "VOID" } });
    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: item.qty } },
      });
    }
  });

  res.json({ message: "Sale voided and stock restored" });
});

export default router;
