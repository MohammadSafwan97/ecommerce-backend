import express from "express";
import pool from "../db.js";
const router = express.Router();

/**
 * POST /cart/add
 * body: { user_id, product_id, quantity }
 * creates cart for user if not exists, adds/increments item
 */

router.get("/", (req, res) => {
  res.send("carts");
});
router.post("/add", async (req, res) => {
  try {
    const { user_id, product_id, quantity = 1 } = req.body;
    if (!user_id || !product_id)
      return res.status(400).json({ error: "user_id and product_id required" });

    // ensure cart exists
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

    // upsert cart item
    await pool.query(
      `
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (cart_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity;
    `,
      [cartId, product_id, quantity]
    );

    res.json({ ok: true, cart_id: cartId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

// GET /cart/:user_id
router.get("/:user_id", async (req, res) => {
  try {
    const user_id = parseInt(req.params.user_id, 10);
    const cartRes = await pool.query(
      "SELECT id FROM carts WHERE user_id = $1;",
      [user_id]
    );
    if (cartRes.rows.length === 0) return res.json({ items: [] });

    const cartId = cartRes.rows[0].id;
    const { rows } = await pool.query(
      `SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price_cents, p.image
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1;`,
      [cartId]
    );

    res.json({ items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
