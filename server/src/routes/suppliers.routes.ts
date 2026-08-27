import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
router.use(authenticate);

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

router.get("/", async (_req, res) => {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true, purchaseOrders: true } } },
  });
  res.json(suppliers);
});

router.get("/:id", async (req, res) => {
  const supplier = await prisma.supplier.findUniqueOrThrow({ where: { id: req.params.id } });
  res.json(supplier);
});

router.post("/", authorize("ADMIN", "MANAGER"), async (req, res) => {
  const data = schema.parse(req.body);
  const supplier = await prisma.supplier.create({ data });
  res.status(201).json(supplier);
});

router.put("/:id", authorize("ADMIN", "MANAGER"), async (req, res) => {
  const data = schema.parse(req.body);
  const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data });
  res.json(supplier);
});

router.delete("/:id", authorize("ADMIN", "MANAGER"), async (req, res) => {
  await prisma.supplier.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
