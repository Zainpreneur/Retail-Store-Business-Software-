import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER"]).default("CASHIER"),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER"]).optional(),
  active: z.boolean().optional(),
});

router.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  res.json(users);
});

router.post("/", async (req, res) => {
  const data = createSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, role: data.role, passwordHash },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  res.status(201).json(user);
});

router.put("/:id", async (req, res) => {
  const data = updateSchema.parse(req.body);
  const { password, ...rest } = data;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { ...rest, ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  res.json(user);
});

router.delete("/:id", async (req, res) => {
  if (req.params.id === req.user!.sub) {
    throw new ApiError(400, "You cannot delete your own account");
  }
  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
