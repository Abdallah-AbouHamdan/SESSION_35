import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { requireAuth } from "./auth/jwt.js";
import auth from "./controllers/auth.controller.js";
import families from "./controllers/family.controller.js";
import invites from "./controllers/invites.controller.js";
import lists from "./controllers/lists.controller.js";
import items from "./controllers/items.controller.js";

dotenv.config({ path: new URL("./src/.env", import.meta.url) });

const app = express();
const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());

app.get("/", (req, res) => res.json({ ok: true }));

app.use("/api/auth", auth);
app.use("/api/families", requireAuth, families);
app.use("/api/invites", requireAuth, invites);
app.use("/api/lists", requireAuth, lists);
app.use("/api/items", requireAuth, items);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`✅ API running on port ${port}`));
