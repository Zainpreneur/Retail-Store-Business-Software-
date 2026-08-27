import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate, authorize("ADMIN", "MANAGER"));

const poItemSchema = z.object({
  productId: z.string(),
  qty: z.coerce.number().int().positive(),
  costPrice: z.coerce.number().min(0),
});

const createPoSchema = z.object({
  supplierId: z.string(),
  items: z.array(poItemSchema).min(1),
  notes: z.string().optional(),
});

async function nextPoNumber() {
  const count = await prisma.purchaseOrder.count();
  const year = new Date().getFullYear();
  return `PO-${year}-${String(count + 1).padStart(5, "0")}`;
}

router.get("/", async (_req, res) => {
  const orders = await prisma.purchaseOrder.findMany({
    include: { supplier: true, user: { select: { id: true, name: true } }, items: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

router.get("/:id", async (req, res) => {
  const order = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      supplier: true,
      user: { select: { id: true, name: true } },
      items: { include: { product: true } },
    },
  });
  res.json(order);
});

router.post("/", async (req, res) => {
  const data = createPoSchema.parse(req.body);
  const totalAmount = data.items.reduce((sum, i) => sum + i.qty * i.costPrice, 0);
  const poNumber = await nextPoNumber();

  const order = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: data.supplierId,
      userId: req.user!.sub,
      notes: data.notes,
      totalAmount,
      status: "ORDERED",
      items: {
        create: data.items.map((i) => ({
          productId: i.productId,
          qty: i.qty,
          costPrice: i.costPrice,
          subtotal: i.qty * i.costPrice,
        })),
      },
    },
    include: { items: true, supplier: true },
  });

  res.status(201).json(order);
});

router.post("/:id/receive", async (req, res) => {
  const order = await prisma.purchaseOrder.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (order.status === "RECEIVED") throw new ApiError(400, "Purchase order already received");
  if (order.status === "CANCELLED") throw new ApiError(400, "Cannot receive a cancelled order");

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrder.update({
      where: { id: order.id },
      data: { status: "RECEIVED", receivedAt: new Date() },
    });
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: item.qty }, costPrice: item.costPrice },
      });
    }
  });

  res.json({ message: "Purchase order received and stock updated" });
});

router.post("/:id/cancel", async (req, res) => {
  const order = await prisma.purchaseOrder.findUniqueOrThrow({ where: { id: req.params.id } });
  if (order.status === "RECEIVED") throw new ApiError(400, "Cannot cancel a received order");
  await prisma.purchaseOrder.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
  res.json({ message: "Purchase order cancelled" });
});

export default router;
