import jwt from "jsonwebtoken";

export const signToken = (user) =>
  jwt.sign(
    { uid: user.id, fid: user.family_id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

export const requireAuth = (req, res, next) => {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};
