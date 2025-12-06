// supserver.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import productRoutes from "./routes/products.js";
import deliveryRoutes from "./routes/deliveryOptions.js";
import cartRoutes from "./routes/cartItems.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/paymentSummary.js";
import resetRoutes from "./routes/reset.js";

const app = express();
const PORT = process.env.PORT || 3000;

import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173",
  "https://fullstack-react-ecommerce-y14j.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// health
app.get("/", (req, res) => res.send("Backend is running"));

// routes
app.use("/products", productRoutes);
app.use("/delivery-options", deliveryRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/payment-summary", paymentRoutes);
app.use("/reset", resetRoutes);

// error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => console.log("App is running on port ", PORT));
