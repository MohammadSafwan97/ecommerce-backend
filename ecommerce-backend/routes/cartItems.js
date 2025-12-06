// cart.js (new version, rewritten clean and production-ready)

import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * Health check for /cart
 */
router.get("/", (req, res) => {
  res.send("Cart routes operational");
});

/**
 * POST /cart/add
 * Body: { user_id, product_id, quantity }
 *
 * Ensures a cart exists for the user,
 * then performs UPSERT on cart_items.
 */
router.post("/add", async (req, res) => {
  try {
    const { user_id, product_id, quantity = 1 } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({
        error: "user_id and product_id are required",
      });
    }

    if (typeof quantity !== "number" || quantity < 1 || quantity > 10) {
      return res.status(400).json({
        error: "Quantity must be a number between 1 and 10",
      });
    }

    // 1. Ensure cart exists
    const cartRes = await pool.query(
      "SELECT id FROM carts WHERE user_id = $1;",
      [user_id]
    );

    let cartId;

    if (cartRes.rows.length === 0) {
      const insert = await pool.query(
        "INSERT INTO carts (user_id) VALUES ($1) RETURNING id;",
        [user_id]
      );
      cartId = insert.rows[0].id;
    } else {
      cartId = cartRes.rows[0].id;
    }

    // 2. UPSERT cart_items
    await pool.query(
      `
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (cart_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity;
    `,
      [cartId, product_id, quantity]
    );

    res.status(201).json({
      message: "Item added to cart",
      cart_id: cartId,
    });
  } catch (err) {
    console.error("POST /cart/add error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

/**
 * GET /cart/:user_id
 * Returns all items for the user's cart
 */
router.get("/:user_id", async (req, res) => {
  try {
    const user_id = parseInt(req.params.user_id, 10);

    if (isNaN(user_id)) {
      return res.status(400).json({ error: "Invalid user_id" });
    }

    // Check if the user has a cart
    const cartRes = await pool.query(
      "SELECT id FROM carts WHERE user_id = $1;",
      [user_id]
    );

    if (cartRes.rows.length === 0) {
      return res.json({ items: [] });
    }

    const cartId = cartRes.rows[0].id;

    // Fetch cart items with product info
    const { rows: items } = await pool.query(
      `
      SELECT 
        ci.id,
        ci.quantity,
        p.id AS product_id,
        p.name,
        p.price_cents,
        p.image
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = $1;
      `,
      [cartId]
    );

    res.json({
      cart_id: cartId,
      items,
    });
  } catch (err) {
    console.error("GET /cart/:user_id error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
