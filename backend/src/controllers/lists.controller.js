import { Router } from "express";
import { q } from "../db/index.js";
const r = Router();

const ensureActive = async (fid) => {
  const act = await q(
    "select id from shopping_list where family_id=$1 and is_active limit 1",
    [fid]
  );
  if (act.rowCount > 0) return act.rows[0].id;
  const ins = await q(
    "insert into shopping_list(family_id,title,week_start,is_active) values ($1, $2, date_trunc('week', now())::date, true) returning id",
    [fid, new Date().toISOString().slice(0, 10)]
  );
  return ins.rows[0].id;
};

r.get("/active", async (req, res) => {
  const { fid } = req.user;
  if (!fid) return res.status(400).json({ error: "No family" });
  const listId = await ensureActive(fid);
  const items = await q(
    "select id,title,quantity,category,notes,status from shopping_item where list_id=$1 order by created_at asc",
    [listId]
  );
  res.json({ listId, items: items.rows });
});

r.post("/weekly-reset", async (req, res) => {
  const { fid } = req.user;
  if (!fid) return res.status(400).json({ error: "No family" });
  await q("select archive_family_active_list($1)", [fid]);
  res.json({ ok: true });
});

const archiveQuery = `
  select
    l.id,
    l.title,
    l.week_start as "weekStart",
    l.archived_at as "archivedAt",
    coalesce(
      json_agg(
        json_build_object(
          'id', i.id,
          'title', i.title,
          'quantity', i.quantity,
          'category', i.category,
          'notes', i.notes,
          'status', i.status,
          'createdAt', i.created_at
        )
        order by i.created_at
      ) filter (where i.id is not null),
      '[]'
    ) as items
  from shopping_list l
  left join shopping_item i on i.list_id = l.id
  where l.family_id = $1 and l.is_active = false
  group by l.id
  order by coalesce(l.archived_at, l.week_start) desc, l.id desc
`;

r.get("/archives", async (req, res) => {
  const { fid } = req.user;
  if (!fid) return res.status(400).json({ error: "No family" });
  const archives = await q(archiveQuery, [fid]);
  res.json({ archives: archives.rows });
});

export default r;
