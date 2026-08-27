import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@store.com" },
    update: {},
    create: { name: "Store Admin", email: "admin@store.com", passwordHash, role: "ADMIN" },
  });

  await prisma.user.upsert({
    where: { email: "manager@store.com" },
    update: {},
    create: { name: "Store Manager", email: "manager@store.com", passwordHash, role: "MANAGER" },
  });

  await prisma.user.upsert({
    where: { email: "cashier@store.com" },
    update: {},
    create: { name: "Store Cashier", email: "cashier@store.com", passwordHash, role: "CASHIER" },
  });

  const [beverages, snacks, produce, household] = await Promise.all([
    prisma.category.upsert({ where: { name: "Beverages" }, update: {}, create: { name: "Beverages" } }),
    prisma.category.upsert({ where: { name: "Snacks" }, update: {}, create: { name: "Snacks" } }),
    prisma.category.upsert({ where: { name: "Produce" }, update: {}, create: { name: "Produce" } }),
    prisma.category.upsert({ where: { name: "Household" }, update: {}, create: { name: "Household" } }),
  ]);

  const supplier = await prisma.supplier.upsert({
    where: { id: "seed-supplier-1" },
    update: {},
    create: {
      id: "seed-supplier-1",
      name: "Global Wholesale Distributors",
      email: "sales@globalwholesale.example",
      phone: "+1-555-0100",
      address: "1 Industrial Way, Springfield",
    },
  });

  const products = [
    { sku: "BEV-001", name: "Bottled Water 500ml", categoryId: beverages.id, costPrice: 0.3, sellingPrice: 0.99, stockQty: 200, reorderLevel: 40 },
    { sku: "BEV-002", name: "Cola Can 330ml", categoryId: beverages.id, costPrice: 0.4, sellingPrice: 1.25, stockQty: 150, reorderLevel: 30 },
    { sku: "SNK-001", name: "Potato Chips 150g", categoryId: snacks.id, costPrice: 0.8, sellingPrice: 1.99, stockQty: 100, reorderLevel: 20 },
    { sku: "SNK-002", name: "Chocolate Bar", categoryId: snacks.id, costPrice: 0.5, sellingPrice: 1.49, stockQty: 12, reorderLevel: 25 },
    { sku: "PRD-001", name: "Bananas (per kg)", categoryId: produce.id, costPrice: 0.6, sellingPrice: 1.2, stockQty: 80, reorderLevel: 15, unit: "kg" },
    { sku: "PRD-002", name: "Tomatoes (per kg)", categoryId: produce.id, costPrice: 0.7, sellingPrice: 1.6, stockQty: 8, reorderLevel: 15, unit: "kg" },
    { sku: "HH-001", name: "Dish Soap 500ml", categoryId: household.id, costPrice: 1.1, sellingPrice: 2.49, stockQty: 60, reorderLevel: 10 },
    { sku: "HH-002", name: "Paper Towels (2-pack)", categoryId: household.id, costPrice: 1.8, sellingPrice: 3.49, stockQty: 45, reorderLevel: 10 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: { ...p, supplierId: supplier.id, taxRate: 5 },
    });
  }

  await prisma.customer.upsert({
    where: { id: "seed-customer-1" },
    update: {},
    create: { id: "seed-customer-1", name: "Walk-in Customer", email: "", phone: "" },
  });

  await prisma.customer.upsert({
    where: { id: "seed-customer-2" },
    update: {},
    create: { id: "seed-customer-2", name: "Jordan Lee", email: "jordan.lee@example.com", phone: "+1-555-0123" },
  });

  console.log("Seed complete.");
  console.log("Login with: admin@store.com / manager@store.com / cashier@store.com, password: password123");
  console.log(`Admin user id: ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
