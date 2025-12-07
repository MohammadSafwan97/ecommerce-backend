import express from "express";
import pool from "../db.js";

const router = express.Router();

// ADD TO CART (simple)
router.post("/add", async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;

    if (!user_id) return res.status(400).json({ error: "user_id is required" });
    if (!product_id)
      return res.status(400).json({ error: "product_id is required" });

    const qty = quantity || 1;

    const result = await pool.query(
      `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      RETURNING *;
      `,
      [user_id, product_id, qty]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Add to cart error:", err); // FULL ERROR
    return res.status(500).json({ error: err.message });
  }
});

// GET CART
router.get("/:user_id", async (req, res) => {
  try {
    const user_id = req.params.user_id;

    const result = await pool.query(
      `SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price_cents, p.image
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = $1`,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch cart error:", err);
    res.status(500).json({ error: "DB error fetching cart" });
  }
});

export default router;
