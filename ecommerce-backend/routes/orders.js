import express from "express";
import pool from "../db.js";

const router = express.Router();

/* ---------------------------------------------------------
   GET /orders?user_id=1&expand=products
   Returns ALL orders for one user (order history)
--------------------------------------------------------- */
router.get("/", async (req, res) => {
  const { user_id, expand } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    // Fetch all orders for user
    const ordersRes = await pool.query(
      `
      SELECT *
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC;
      `,
      [user_id]
    );

    const orders = ordersRes.rows;

    // If frontend did NOT request expanded product info → return basic orders
    if (expand !== "products") {
      return res.json(orders);
    }

    // Expand products for each order
    for (const order of orders) {
      const itemsRes = await pool.query(
        `
        SELECT 
          oi.quantity,
          oi.unit_price_cents,
          oi.created_at,
          o.estimated_delivery_time_ms,
          
          json_build_object(
            'id', p.id,
            'name', p.name,
            'image', p.image
          ) AS product
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.order_id = $1;
        `,
        [order.id]
      );

      // Normalized field names for frontend
      order.products = itemsRes.rows;
      order.orderTimeMs = Number(order.order_time_ms || 0);
    }

    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "DB error" });
  }
});

/* ---------------------------------------------------------
   POST /orders/create
   Creates an order from a user's cart
--------------------------------------------------------- */
router.post("/create", async (req, res) => {
  const { user_id, delivery_option_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* 1. Ensure user has a cart */
    const cartRes = await client.query(
      "SELECT id FROM carts WHERE user_id = $1;",
      [user_id]
    );

    if (cartRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cart is empty" });
    }

    const cartId = cartRes.rows[0].id;

    /* 2. Fetch cart items */
    const itemsRes = await client.query(
      `
      SELECT ci.quantity, p.id AS product_id, p.price_cents
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = $1;
      `,
      [cartId]
    );

    if (itemsRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cart is empty" });
    }

    /* 3. Calculate total */
    let total = 0;
    for (const item of itemsRes.rows) {
      total += item.quantity * item.price_cents;
    }

    /* 4. Delivery cost */
    let deliveryCost = 0;

    if (delivery_option_id) {
      const dRes = await client.query(
        "SELECT price_cents FROM delivery_options WHERE id = $1;",
        [delivery_option_id]
      );

      if (dRes.rows.length > 0) {
        deliveryCost = dRes.rows[0].price_cents;
      }
    }

    const finalTotal = total + deliveryCost;

    /* 5. Create timestamps */
    const nowMs = Date.now();
    const etaMs = nowMs + 3 * 24 * 60 * 60 * 1000; // +3 days

    /* 6. Create order */
    const orderRes = await client.query(
      `
      INSERT INTO orders (
        user_id,
        total_cents,
        delivery_option_id,
        order_time_ms,
        estimated_delivery_time_ms
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
      `,
      [user_id, finalTotal, delivery_option_id, nowMs, etaMs]
    );

    const orderId = orderRes.rows[0].id;

    /* 7. Insert order items */
    for (const item of itemsRes.rows) {
      await client.query(
        `
        INSERT INTO order_items (
          order_id, product_id, quantity, unit_price_cents
        )
        VALUES ($1, $2, $3, $4);
        `,
        [orderId, item.product_id, item.quantity, item.price_cents]
      );
    }

    /* 8. Clear the cart */
    await client.query("DELETE FROM cart_items WHERE cart_id = $1;", [cartId]);

    await client.query("COMMIT");

    res.json({
      ok: true,
      order_id: orderId,
      total_cents: finalTotal,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Order creation failed:", err);
    res.status(500).json({ error: "Order creation failed" });
  } finally {
    client.release();
  }
});

/* ---------------------------------------------------------
   GET /orders/:id   → Single order details
--------------------------------------------------------- */
router.get("/:orderId", async (req, res) => {
  const orderId = Number(req.params.orderId);

  try {
    /* Get order main info */
    const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1;", [
      orderId,
    ]);

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderRes.rows[0];

    /* Get items for the order */
    const itemsRes = await pool.query(
      `
      SELECT 
        oi.quantity,
        oi.unit_price_cents,
        json_build_object(
          'id', p.id,
          'name', p.name,
          'image', p.image
        ) AS product
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1;
      `,
      [orderId]
    );

    order.products = itemsRes.rows;
    order.orderTimeMs = Number(order.order_time_ms || 0);

    res.json(order);
  } catch (err) {
    console.error("Fetch single order failed:", err);
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
