// supserver.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// Routes
import productRoutes from "./routes/products.js";
import authRoutes from "./routes/auth.js";
import cartRoutes from "./routes/cart.js";
import deliveryRoutes from "./routes/deliveryOptions.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/paymentSummary.js";
import resetRoutes from "./routes/reset.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://fullstack-react-ecommerce-y14j.vercel.app",
];

// CORS middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// JSON body parser
app.use(express.json());

// Health route
app.get("/", (req, res) => res.send("Backend is running"));

// API routes
app.use("/products", productRoutes);
app.use("/delivery-options", deliveryRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/payment-summary", paymentRoutes);
app.use("/reset", resetRoutes);
app.use("/auth", authRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong" });
});

// Start server
app.listen(PORT, () => console.log(`App is running on port ${PORT}`));
