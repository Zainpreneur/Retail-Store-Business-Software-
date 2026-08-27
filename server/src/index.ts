import "express-async-errors";
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/users.routes";
import categoryRoutes from "./routes/categories.routes";
import supplierRoutes from "./routes/suppliers.routes";
import productRoutes from "./routes/products.routes";
import customerRoutes from "./routes/customers.routes";
import saleRoutes from "./routes/sales.routes";
import purchaseOrderRoutes from "./routes/purchaseOrders.routes";
import reportRoutes from "./routes/reports.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/reports", reportRoutes);

app.use((_req, res) => res.status(404).json({ message: "Not found" }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Retail Store API listening on http://localhost:${PORT}`);
});
