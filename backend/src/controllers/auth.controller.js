import { Router } from "express";
import { q } from "../db/index.js";
import bcrypt from "bcryptjs";
import { signToken, requireAuth } from "../auth/jwt.js";

const r = Router();

r.post("/register", async (req, res) => {
  const { email, password, fullName } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const u = await q(
    "insert into app_user(email,password_hash,full_name) values($1,$2,$3) returning id,email,full_name,family_id",
    [email, hash, fullName]
  );
  const user = u.rows[0];
  const token = signToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      familyId: user.family_id,
    },
  });
});

r.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const u = await q("select * from app_user where email=$1", [email]);
  if (u.rowCount === 0)
    return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, u.rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const user = u.rows[0];
  const token = signToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      familyId: user.family_id,
    },
  });
});

r.get("/me", requireAuth, async (req, res) => {
  const { uid } = req.user;
  const userRes = await q(
    "select id,email,full_name,family_id from app_user where id=$1",
    [uid]
  );
  if (userRes.rowCount === 0) {
    return res.status(404).json({ error: "User not found" });
  }
  const user = userRes.rows[0];
  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      familyId: user.family_id,
    },
  });
});

export default r;
