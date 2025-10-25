import { Router } from "express";
import { q } from "../db/index.js";
import { signToken } from "../auth/jwt.js";
import crypto from "crypto";
const r = Router();

r.get("/my", async (req, res) => {
  const { email } = req.user;
  if (!email) return res.json({ invites: [] });
  const inv = await q(
    "select token, expires_at as \"expiresAt\", email from invite where email = $1 and expires_at > now() and accepted_at is null",
    [email]
  );
  res.json({ invites: inv.rows });
});

r.get("/sent", async (req, res) => {
  const { fid } = req.user;
  if (!fid) return res.json({ invites: [] });
  const inv = await q(
    "select token, expires_at as \"expiresAt\", email from invite where family_id = $1 and expires_at > now() and accepted_at is null order by id desc",
    [fid]
  );
  res.json({ invites: inv.rows });
});

r.post("/", async (req, res) => {
  const { fid, uid } = req.user;
  if (!fid) return res.status(400).json({ error: "Create a family first" });
  const token = crypto.randomBytes(12).toString("hex");
  const { email } = req.body || {};
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const ins = await q(
    "insert into invite(family_id, token, email, created_by, expires_at) values($1,$2,$3,$4,$5) returning token, expires_at as \"expiresAt\", email",
    [fid, token, email || null, uid, expires]
  );
  const invite = ins.rows[0];
  const link = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/invite/${token}`;
  res.json({ invite, link });
});

r.post("/accept", async (req, res) => {
  const { uid } = req.user;
  const { token } = req.body;
  const inv = await q(
    "select * from invite where token=$1 and expires_at > now()",
    [token]
  );
  if (inv.rowCount === 0)
    return res.status(400).json({ error: "Invalid or expired token" });
  const currentUser = await q("select family_id from app_user where id=$1", [uid]);
  if (currentUser.rows[0].family_id)
    return res.status(400).json({ error: "Already in a family" });
  await q("update app_user set family_id=$1 where id=$2", [
    inv.rows[0].family_id,
    uid,
  ]);
  await q("update invite set accepted_by=$1, accepted_at=now() where id=$2", [
    uid,
    inv.rows[0].id,
  ]);
  const userRes = await q(
    "select id,email,full_name,family_id from app_user where id=$1",
    [uid]
  );
  const updatedUser = userRes.rows[0];
  const tokenJwt = signToken(updatedUser);
  const famRes = await q("select id,name from family where id=$1", [updatedUser.family_id]);
  const members = await q(
    "select id,email,full_name,role from app_user where family_id=$1",
    [updatedUser.family_id]
  );
  res.json({
    token: tokenJwt,
    family: famRes.rows[0],
    members: members.rows,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.full_name,
      familyId: updatedUser.family_id,
    },
  });
});

export default r;
