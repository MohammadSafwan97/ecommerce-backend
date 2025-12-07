import express from "express";
import pool from "../db.js";

const router = express.Router();

// 🟢 In-memory cache
let cacheAllProducts = null;
let cacheCategoryProducts = {};
let cacheTimeAll = 0;
let cacheTimeCategory = {};

const CACHE_DURATION = 60 * 1000; // 60 seconds

// GET /products
router.get("/", async (req, res) => {
  try {
    const category = req.query.category;
    const now = Date.now();

    // 🟢 CATEGORY FILTERING WITH CACHE
    if (category) {
      // If category cached and still fresh → return cached
      if (
        cacheCategoryProducts[category] &&
        now - cacheTimeCategory[category] < CACHE_DURATION
      ) {
        return res.json(cacheCategoryProducts[category]);
      }

      // Otherwise fetch from DB
      const { rows } = await pool.query(
        "SELECT * FROM products WHERE category=$1",
        [category]
      );

      // Store in cache
      cacheCategoryProducts[category] = rows;
      cacheTimeCategory[category] = now;

      return res.json(rows);
    }

    // 🟢 ALL PRODUCTS CACHE
    if (cacheAllProducts && now - cacheTimeAll < CACHE_DURATION) {
      return res.json(cacheAllProducts);
    }

    // Fetch from DB
    const { rows } = await pool.query(
      "SELECT * FROM products ORDER BY id DESC;"
    );

    // Save cache
    cacheAllProducts = rows;
    cacheTimeAll = now;

    res.json(rows);
  } catch (err) {
    console.error("Product fetch error:", err);
    res.status(500).json({ error: "DB error" });
  }
});

// GET /products/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const { rows } = await pool.query("SELECT * FROM products WHERE id = $1;", [
      id,
    ]);

    if (rows.length === 0)
      return res.status(404).json({ error: "Product not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error("Product detail fetch error:", err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
