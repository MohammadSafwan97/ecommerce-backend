import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log(
  "SERVICE ROLE KEY EXISTS:",
  !!process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Supabase using service_role key (backend ONLY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// ============================
// SIGNUP
// ============================
router.post("/signup", async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
      },
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      message: "Signup successful",
      user: data.user,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ============================
// SIGNIN
// ============================
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.json({
      message: "Signin successful",
      user: data.user,
      access_token: data.session.access_token,
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ============================
// GET USER
// ============================
router.get("/user", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.json({ user: null });

    const { data, error } = await supabase.auth.getUser(token);

    if (error) return res.status(401).json({ user: null });

    res.json({ user: data.user });
  } catch (err) {
    console.error("User error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ============================
// LOGOUT
// ============================
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

export default router;
