import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate);

const schema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().default("pcs"),
  costPrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  stockQty: z.coerce.number().int().min(0).default(0),
  reorderLevel: z.coerce.number().int().min(0).default(5),
  categoryId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  imageUrl: z.string().optional(),
  active: z.boolean().optional(),
});

router.get("/", async (req, res) => {
  const { search, categoryId, lowStock } = req.query as Record<string, string>;
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;

  const products = await prisma.product.findMany({
    where,
    include: { category: true, supplier: true },
    orderBy: { name: "asc" },
  });

  const filtered = lowStock === "true" ? products.filter((p) => p.stockQty <= p.reorderLevel) : products;
  res.json(filtered);
});

router.get("/low-stock", async (_req, res) => {
  const products = await prisma.product.findMany({
    include: { category: true, supplier: true },
  });
  res.json(products.filter((p) => p.stockQty <= p.reorderLevel));
});

router.get("/:id", async (req, res) => {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { category: true, supplier: true },
  });
  res.json(product);
});

router.post("/", authorize("ADMIN", "MANAGER"), async (req, res) => {
  const data = schema.parse(req.body);
  const product = await prisma.product.create({ data });
  res.status(201).json(product);
});

router.put("/:id", authorize("ADMIN", "MANAGER"), async (req, res) => {
  const data = schema.partial().parse(req.body);
  const product = await prisma.product.update({ where: { id: req.params.id }, data });
  res.json(product);
});

router.delete("/:id", authorize("ADMIN", "MANAGER"), async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

const adjustSchema = z.object({
  qtyChange: z.coerce.number().int(),
  reason: z.string().min(1),
});

router.post("/:id/adjust", authorize("ADMIN", "MANAGER"), async (req, res) => {
  const { qtyChange, reason } = adjustSchema.parse(req.body);
  const product = await prisma.product.findUniqueOrThrow({ where: { id: req.params.id } });
  const newQty = product.stockQty + qtyChange;
  if (newQty < 0) throw new ApiError(400, "Resulting stock cannot be negative");

  const [updated] = await prisma.$transaction([
    prisma.product.update({ where: { id: product.id }, data: { stockQty: newQty } }),
    prisma.stockAdjustment.create({
      data: { productId: product.id, qtyChange, reason, userId: req.user!.sub },
    }),
  ]);
  res.json(updated);
});

export default router;
