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

router.get("/", async (req, res) => {
  const search = (req.query.search as string) || "";
  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
  });
  res.json(customers);
});

router.get("/:id", async (req, res) => {
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { sales: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  res.json(customer);
});

router.post("/", authorize("ADMIN", "MANAGER", "CASHIER"), async (req, res) => {
  const data = schema.parse(req.body);
  const customer = await prisma.customer.create({ data });
  res.status(201).json(customer);
});

router.put("/:id", authorize("ADMIN", "MANAGER", "CASHIER"), async (req, res) => {
  const data = schema.parse(req.body);
  const customer = await prisma.customer.update({ where: { id: req.params.id }, data });
  res.json(customer);
});

router.delete("/:id", authorize("ADMIN", "MANAGER"), async (req, res) => {
  await prisma.customer.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
