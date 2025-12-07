import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export default function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);

    req.user = { id: decoded.sub }; // ALWAYS PUT USER ID HERE

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
