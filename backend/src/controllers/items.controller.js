import { Router } from "express";
import { q } from "../db/index.js";
const r = Router();

const ensureActiveList = async (fid) => {
  const active = await q(
    "select id from shopping_list where family_id=$1 and is_active limit 1",
    [fid]
  );
  if (active.rowCount > 0) return active.rows[0].id;

  const created = await q(
    "insert into shopping_list(family_id,title,week_start,is_active) values ($1,$2,date_trunc('week', now())::date,true) returning id",
    [fid, new Date().toISOString().slice(0, 10)]
  );
  return created.rows[0].id;
};

r.post("/", async (req, res) => {
  const { fid, uid } = req.user;
  if (!fid) return res.status(400).json({ error: "No family selected" });

  const listId = await ensureActiveList(fid);
  const { title, quantity, category, notes } = req.body;
  const ins = await q(
    "insert into shopping_item(list_id,title,quantity,category,notes,created_by) values($1,$2,$3,$4,$5,$6) returning id,title,quantity,category,notes,status",
    [listId, title, quantity, category, notes, uid]
  );
  res.json(ins.rows[0]);
});

r.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const allowed = ["title", "quantity", "category", "notes"];
  const updates = [];
  const values = [];

  allowed.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates.push(`${field}=$${updates.length + 1}`);
      values.push(req.body[field]);
    }
  });

  if (updates.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  values.push(id);
  const updated = await q(
    `update shopping_item set ${updates.join(", ")} where id=$${values.length} returning id,title,quantity,category,notes,status`,
    values
  );
  if (updated.rowCount === 0) {
    return res.status(404).json({ error: "Item not found" });
  }
  res.json(updated.rows[0]);
});

r.patch("/:id/toggle", async (req, res) => {
  const { id } = req.params;
  const row = await q(
    "update shopping_item set status = case when status='done' then 'pending' else 'done' end where id=$1 returning id,status",
    [id]
  );
  res.json(row.rows[0]);
});

r.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await q("delete from shopping_item where id=$1", [id]);
  res.json({ ok: true });
});

export default r;
