import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { sequelize } from "./models/index.js";
import productRoutes from "./routes/products.js";
import deliveryOptionRoutes from "./routes/deliveryOptions.js";
import cartItemRoutes from "./routes/cartItems.js";
import orderRoutes from "./routes/orders.js";
import resetRoutes from "./routes/reset.js";
import paymentSummaryRoutes from "./routes/paymentSummary.js";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve images folder
app.use("/images", express.static(path.join(__dirname, "images")));

// API routes
app.use("/api/products", productRoutes);
app.use("/api/delivery-options", deliveryOptionRoutes);
app.use("/api/cart-items", cartItemRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reset", resetRoutes);
app.use("/api/payment-summary", paymentSummaryRoutes);

// HEALTH CHECK (IMPORTANT!)
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Sync database and load defaults
await sequelize.sync();

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
