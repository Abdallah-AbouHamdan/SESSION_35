import { Router } from "express";
import { q } from "../db/index.js";
import { signToken } from "../auth/jwt.js";
const r = Router();

r.get("/me", async (req, res) => {
  const { fid } = req.user;
  if (!fid) return res.json({ family: null, members: [] });
  const fam = await q("select id,name from family where id=$1", [fid]);
  const mem = await q(
    "select id,email,full_name,role from app_user where family_id=$1 order by created_at asc",
    [fid]
  );
  res.json({ family: fam.rows[0], members: mem.rows });
});

r.post("/", async (req, res) => {
  const { uid } = req.user;
  const { name } = req.body;
  const fam = await q("insert into family(name) values($1) returning id,name", [
    name,
  ]);
  await q("update app_user set family_id=$1, role=$2 where id=$3", [
    fam.rows[0].id,
    "admin",
    uid,
  ]);
  const mem = await q("select id,email,full_name,role from app_user where family_id=$1", [
    fam.rows[0].id,
  ]);
  const userRes = await q(
    "select id,email,full_name,family_id from app_user where id=$1",
    [uid]
  );
  const user = userRes.rows[0];
  const token = signToken(user);
  res.json({
    family: fam.rows[0],
    members: mem.rows,
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      familyId: user.family_id,
    },
  });
});

r.post("/leave", async (req, res) => {
  const { uid } = req.user;
  await q("update app_user set family_id=null, role=$1 where id=$2", [
    "member",
    uid,
  ]);
  res.json({ ok: true });
});

r.delete("/", async (req, res) => {
  const { fid } = req.user;
  if (!fid) return res.status(400).json({ error: "No family" });
  await q("delete from family where id=$1", [fid]);
  res.json({ ok: true });
});

export default r;
